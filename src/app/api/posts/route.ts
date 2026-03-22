export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateStreak, checkNewAchievements } from '@/lib/streakEngine'
import { getTodayDateString } from '@/lib/streakConfig'
import type { CreatePostInput, StreakLog, StreakState, StreakAchievement } from '@/types'

// ── Fire-and-forget streak log when a post is published ──────────────────────

async function autoLogPublishStreak(userId: string, postId: string) {
  try {
    const supabase  = await createClient()
    const log_date  = getTodayDateString()

    // Skip if already logged today
    const { data: existing } = await supabase
      .from('streak_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('log_date', log_date)
      .eq('log_type', 'publish')
      .maybeSingle()

    if (existing) return

    await supabase.from('streak_logs').insert({
      user_id:      userId,
      log_date,
      log_type:     'publish',
      source:       'postpika',
      post_id:      postId,
      comment_urls: [],
      notes:        '',
    })

    // Fetch all logs and current state for recalculation
    const { data: allLogsData } = await supabase
      .from('streak_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })

    const allLogs = (allLogsData ?? []) as StreakLog[]

    const { data: stateData } = await supabase
      .from('streak_states')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

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

    const today      = new Date()
    const resetDate  = currentState.grace_days_reset_at ? new Date(currentState.grace_days_reset_at) : null
    const graceReset = !resetDate || today.getMonth() !== resetDate.getMonth() || today.getFullYear() !== resetDate.getFullYear()

    await supabase.from('streak_states').update({
      publish_streak:      publishCalc.current,
      publish_best:        publishCalc.best,
      publish_last_date:   publishCalc.lastDate,
      engage_streak:       engageCalc.current,
      engage_best:         engageCalc.best,
      engage_last_date:    engageCalc.lastDate,
      plan_streak:         planCalc.current,
      plan_best:           planCalc.best,
      plan_last_date:      planCalc.lastDate,
      grace_days_remaining: graceReset ? 1 : currentState.grace_days_remaining,
      grace_days_reset_at: today.toISOString().split('T')[0],
      total_posts_logged:  currentState.total_posts_logged + 1,
    }).eq('user_id', userId)

    // Check achievements
    const { data: achData } = await supabase
      .from('streak_achievements').select('*').eq('user_id', userId)
    const existing_ach = (achData ?? []) as StreakAchievement[]
    const newMilestones = checkNewAchievements(publishCalc.current, 'publish', existing_ach)
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

// ── GET /api/posts ────────────────────────────────────────────────────────────
// Query params: status, search, sort ('created_at DESC'), limit (20), offset (0)

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const status  = searchParams.get('status')                     // e.g. 'draft'
    const search  = searchParams.get('search')                     // full-text
    const sort    = searchParams.get('sort') ?? 'created_at DESC'  // 'field DIR'
    const limit   = Math.min(parseInt(searchParams.get('limit')  ?? '20', 10), 100)
    const offset  = Math.max(parseInt(searchParams.get('offset') ?? '0',  10), 0)

    // Parse sort → column + direction
    const parts     = sort.trim().split(/\s+/)
    const sortCol   = parts[0] ?? 'created_at'
    const ascending = (parts[1] ?? 'DESC').toUpperCase() !== 'DESC'

    // Build query — select with exact count for pagination
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    if (status) query = query.eq('status', status)
    if (search)  query = query.ilike('content', `%${search}%`)

    const { data, error, count } = await query
      .order(sortCol, { ascending })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({ posts: data ?? [], total: count ?? 0 })
  } catch (err) {
    console.error('[GET /api/posts]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// ── POST /api/posts ───────────────────────────────────────────────────────────
// Body: { content, tone, niche, topic_input, generation_index, status? }

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as CreatePostInput
    const {
      content,
      tone,
      niche,
      topic_input,
      generation_index,
      status = 'draft',
    } = body

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    if (!tone) {
      return NextResponse.json({ error: 'Tone is required' }, { status: 400 })
    }

    // Auto-derived fields
    const autoTitle          = content.length > 60
      ? content.slice(0, 60).trimEnd() + '…'
      : content
    const autoCharacterCount = content.length

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id:          user.id,
        content,
        tone,
        niche:            niche ?? null,
        topic_input:      topic_input ?? null,
        generation_index: generation_index ?? 0,
        status,
        title:            autoTitle,
        character_count:  autoCharacterCount,
      })
      .select()
      .single()

    if (error) throw error

    // Auto-log streak when post is created with published status
    if (status === 'published' && data) {
      void autoLogPublishStreak(user.id, data.id as string)
    }

    return NextResponse.json({ post: data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/posts]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
