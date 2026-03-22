export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateStreak, checkNewAchievements } from '@/lib/streakEngine'
import { getTodayDateString } from '@/lib/streakConfig'
import type { StreakLog, StreakState, StreakAchievement } from '@/types'

// ── Fire-and-forget streak log when a post is marked published ────────────────

async function autoLogPublishStreak(userId: string, postId: string) {
  try {
    const supabase = await createClient()
    const log_date = getTodayDateString()

    const { data: existing } = await supabase
      .from('streak_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('log_date', log_date)
      .eq('log_type', 'publish')
      .maybeSingle()

    if (existing) return

    await supabase.from('streak_logs').insert({
      user_id: userId, log_date, log_type: 'publish', source: 'postpika',
      post_id: postId, comment_urls: [], notes: '',
    })

    const { data: allLogsData } = await supabase
      .from('streak_logs').select('*').eq('user_id', userId)
      .order('log_date', { ascending: false })
    const allLogs = (allLogsData ?? []) as StreakLog[]

    const { data: stateData } = await supabase
      .from('streak_states').select('*').eq('user_id', userId).maybeSingle()

    let currentState: StreakState
    if (!stateData) {
      const defaultRow = {
        user_id: userId, publish_streak: 0, publish_best: 0, publish_last_date: null,
        engage_streak: 0, engage_best: 0, engage_last_date: null,
        plan_streak: 0, plan_best: 0, plan_last_date: null,
        grace_days_remaining: 1, grace_days_reset_at: null, freeze_count: 0,
        freeze_active_until: null, total_posts_logged: 0, longest_gap_days: 0,
      }
      const { data: inserted } = await supabase
        .from('streak_states').insert(defaultRow).select().single()
      currentState = (inserted ?? { ...defaultRow, updated_at: new Date().toISOString() }) as StreakState
    } else {
      currentState = stateData as StreakState
    }

    const publishCalc = calculateStreak(allLogs, 'publish', currentState)
    const engageCalc  = calculateStreak(allLogs, 'engage',  currentState)
    const planCalc    = calculateStreak(allLogs, 'plan',    currentState)

    const today     = new Date()
    const resetDate = currentState.grace_days_reset_at ? new Date(currentState.grace_days_reset_at) : null
    const graceReset = !resetDate || today.getMonth() !== resetDate.getMonth() || today.getFullYear() !== resetDate.getFullYear()

    await supabase.from('streak_states').update({
      publish_streak: publishCalc.current, publish_best: publishCalc.best, publish_last_date: publishCalc.lastDate,
      engage_streak:  engageCalc.current,  engage_best:  engageCalc.best,  engage_last_date:  engageCalc.lastDate,
      plan_streak:    planCalc.current,    plan_best:    planCalc.best,    plan_last_date:    planCalc.lastDate,
      grace_days_remaining: graceReset ? 1 : currentState.grace_days_remaining,
      grace_days_reset_at: today.toISOString().split('T')[0],
      total_posts_logged: currentState.total_posts_logged + 1,
    }).eq('user_id', userId)

    const { data: achData } = await supabase
      .from('streak_achievements').select('*').eq('user_id', userId)
    const existingAch = (achData ?? []) as StreakAchievement[]
    const newMilestones = checkNewAchievements(publishCalc.current, 'publish', existingAch)
    for (const m of newMilestones) {
      await supabase.from('streak_achievements').insert({
        user_id: userId, achievement_key: m.key, achievement_label: m.label,
        streak_type: 'publish', milestone_value: m.days,
        earned_at: new Date().toISOString(), share_card_generated: false,
      })
    }
  } catch (err) {
    console.error('[autoLogPublishStreak]', err instanceof Error ? err.message : err)
  }
}

type Params = { params: Promise<{ id: string }> }

// ── GET /api/posts/[id] ───────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)   // ownership check
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ post: data })
  } catch (err) {
    console.error('[GET /api/posts/[id]]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

// ── PATCH /api/posts/[id] ─────────────────────────────────────────────────────
// Allowed fields: content, status, scheduled_for, is_favourite, title

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const raw = await req.json() as {
      content?:       string
      status?:        string
      scheduled_for?: string | null
      is_favourite?:  boolean
      title?:         string
    }

    // ── Whitelist the fields we accept ───────────────────────────────────────
    const updates: Record<string, unknown> = {}
    if (raw.content       !== undefined) {
      updates.content         = raw.content
      updates.character_count = raw.content.length
      // Auto-refresh title when content changes (unless caller also sent title)
      if (raw.title === undefined) {
        updates.title = raw.content.length > 60
          ? raw.content.slice(0, 60).trimEnd() + '…'
          : raw.content
      }
    }
    if (raw.title         !== undefined) updates.title         = raw.title
    if (raw.is_favourite  !== undefined) updates.is_favourite  = raw.is_favourite
    if (raw.status        !== undefined) updates.status        = raw.status
    if (raw.scheduled_for !== undefined) updates.scheduled_for = raw.scheduled_for

    // ── Validate scheduled_for when setting status to 'scheduled' ────────────
    if (updates.status === 'scheduled') {
      const sf = updates.scheduled_for
      if (!sf || typeof sf !== 'string') {
        return NextResponse.json(
          { error: 'scheduled_for is required when status is "scheduled"' },
          { status: 400 }
        )
      }
      if (new Date(sf) <= new Date()) {
        return NextResponse.json(
          { error: 'scheduled_for must be a future timestamp' },
          { status: 400 }
        )
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('posts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)   // ownership check
      .select()
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    // Auto-log streak when post is marked as published
    if (updates.status === 'published') {
      void autoLogPublishStreak(user.id, id)
    }

    return NextResponse.json({ post: data })
  } catch (err) {
    console.error('[PATCH /api/posts/[id]]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

// ── DELETE /api/posts/[id] ────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)   // ownership check

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/posts/[id]]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
