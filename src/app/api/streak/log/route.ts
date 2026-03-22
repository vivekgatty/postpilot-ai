export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateStreak, checkNewAchievements } from '@/lib/streakEngine'
import { getTodayDateString } from '@/lib/streakConfig'
import type { StreakLog, StreakState, StreakAchievement } from '@/types'

const VALID_LOG_TYPES = ['publish', 'engage', 'plan'] as const

// ── POST /api/streak/log ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { log_type, source, post_id, comment_urls, notes, date } = body

    // Validate log_type
    if (!VALID_LOG_TYPES.includes(log_type)) {
      return NextResponse.json({ error: 'Invalid log_type' }, { status: 400 })
    }

    // Validate comment_urls for engage type
    if (log_type === 'engage' && (!Array.isArray(comment_urls) || comment_urls.length < 1)) {
      return NextResponse.json(
        { error: 'comment_urls required for engage type (min 1)' },
        { status: 400 },
      )
    }

    // Validate date format and range — only today or yesterday allowed
    const todayStr     = getTodayDateString()
    const yesterdayStr = (() => {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      return d.toISOString().split('T')[0]
    })()

    let log_date: string
    if (!date) {
      log_date = todayStr
    } else {
      if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'date must be in YYYY-MM-DD format' }, { status: 400 })
      }
      if (date !== todayStr && date !== yesterdayStr) {
        return NextResponse.json(
          { error: 'date must be today or yesterday' },
          { status: 400 },
        )
      }
      log_date = date
    }

    // Check if already logged for this user / date / type
    const { data: existing } = await supabase
      .from('streak_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('log_date', log_date)
      .eq('log_type', log_type)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ already_logged: true, message: 'Already logged for today' })
    }

    // Insert streak log
    const { error: logError } = await supabase.from('streak_logs').insert({
      user_id:      user.id,
      log_date,
      log_type,
      source:       source || 'self_report',
      post_id:      post_id || null,
      comment_urls: comment_urls || [],
      notes:        notes || '',
    })
    if (logError) throw logError

    // Fetch ALL logs for this user (for accurate streak calculation)
    const { data: allLogsData, error: allLogsError } = await supabase
      .from('streak_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
    if (allLogsError) throw allLogsError
    const allLogs = (allLogsData ?? []) as StreakLog[]

    // Fetch / initialise streak state
    const { data: stateData, error: stateError } = await supabase
      .from('streak_states')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (stateError) throw stateError

    let currentState: StreakState

    if (!stateData) {
      const defaultRow = {
        user_id:              user.id,
        publish_streak:       0,
        publish_best:         0,
        publish_last_date:    null,
        engage_streak:        0,
        engage_best:          0,
        engage_last_date:     null,
        plan_streak:          0,
        plan_best:            0,
        plan_last_date:       null,
        grace_days_remaining: 1,
        grace_days_reset_at:  null,
        freeze_count:         0,
        freeze_active_until:  null,
        total_posts_logged:   0,
        longest_gap_days:     0,
      }
      const { data: inserted, error: insertError } = await supabase
        .from('streak_states')
        .insert(defaultRow)
        .select()
        .single()
      if (insertError) throw insertError
      currentState = (inserted ?? { ...defaultRow, updated_at: new Date().toISOString() }) as StreakState
    } else {
      currentState = stateData as StreakState
    }

    // Profile for plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    const plan = (profile?.plan ?? 'free') as string

    // Recalculate all three streak types
    const publishCalc = calculateStreak(allLogs, 'publish', currentState)
    const engageCalc  = calculateStreak(allLogs, 'engage',  currentState)
    const planCalc    = calculateStreak(allLogs, 'plan',    currentState)

    // Monthly grace days reset
    const today     = new Date()
    const resetDate = currentState.grace_days_reset_at
      ? new Date(currentState.grace_days_reset_at)
      : null
    let grace_days_remaining = currentState.grace_days_remaining
    if (
      !resetDate ||
      today.getMonth()    !== resetDate.getMonth() ||
      today.getFullYear() !== resetDate.getFullYear()
    ) {
      grace_days_remaining = 1
    }

    // Freeze earning: Pro / Agency earn 1 freeze per 30-day milestone (max 2)
    let freeze_count = currentState.freeze_count
    if (
      ['pro', 'agency'].includes(plan) &&
      publishCalc.current > 0 &&
      publishCalc.current % 30 === 0 &&
      freeze_count < 2
    ) {
      freeze_count = Math.min(freeze_count + 1, 2)
    }

    // Update streak_states
    const updatePayload = {
      publish_streak:      publishCalc.current,
      publish_best:        publishCalc.best,
      publish_last_date:   publishCalc.lastDate,
      engage_streak:       engageCalc.current,
      engage_best:         engageCalc.best,
      engage_last_date:    engageCalc.lastDate,
      plan_streak:         planCalc.current,
      plan_best:           planCalc.best,
      plan_last_date:      planCalc.lastDate,
      grace_days_remaining,
      grace_days_reset_at: new Date().toISOString().split('T')[0],
      freeze_count,
      total_posts_logged:  currentState.total_posts_logged + 1,
    }

    const { error: updateError } = await supabase
      .from('streak_states')
      .update(updatePayload)
      .eq('user_id', user.id)
    if (updateError) throw updateError

    // Check for new achievements (publish type only)
    const { data: achData } = await supabase
      .from('streak_achievements')
      .select('*')
      .eq('user_id', user.id)
    const existingAchievements = (achData ?? []) as StreakAchievement[]

    const newMilestones = checkNewAchievements(publishCalc.current, 'publish', existingAchievements)

    for (const m of newMilestones) {
      await supabase.from('streak_achievements').insert({
        user_id:              user.id,
        achievement_key:      m.key,
        achievement_label:    m.label,
        streak_type:          'publish',
        milestone_value:      m.days,
        earned_at:            new Date().toISOString(),
        share_card_generated: false,
      })
    }

    return NextResponse.json({
      logged:           true,
      new_streak:       publishCalc.current,
      new_achievements: newMilestones,
      state:            { ...currentState, ...updatePayload },
    })
  } catch (err) {
    console.error('[POST /api/streak/log]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to log streak' }, { status: 500 })
  }
}
