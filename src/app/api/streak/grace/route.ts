export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateStreak } from '@/lib/streakEngine'
import type { StreakLog, StreakState } from '@/types'

const VALID_LOG_TYPES = ['publish', 'engage', 'plan'] as const

// ── POST /api/streak/grace ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: Record<string, unknown>
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const raw_log_type: unknown = body.log_type ?? 'publish'
    if (!VALID_LOG_TYPES.includes(raw_log_type as typeof VALID_LOG_TYPES[number])) {
      return NextResponse.json({ error: 'Invalid log_type' }, { status: 400 })
    }
    const log_type = raw_log_type as typeof VALID_LOG_TYPES[number]

    // Fetch streak state
    const { data: stateData, error: stateError } = await supabase
      .from('streak_states')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (stateError) throw stateError
    if (!stateData) return NextResponse.json({ error: 'No streak state found' }, { status: 404 })

    const state = stateData as StreakState

    // Verify grace days available
    if (state.grace_days_remaining <= 0) {
      return NextResponse.json({ error: 'No grace days remaining' }, { status: 403 })
    }

    // Verify last publish date was yesterday (gap is exactly 1 day)
    const lastDate = new Date(state.publish_last_date ?? '')
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    lastDate.setHours(0, 0, 0, 0)

    if (lastDate.getTime() !== yesterday.getTime()) {
      return NextResponse.json(
        { error: 'Grace day can only be used for yesterday' },
        { status: 400 },
      )
    }

    // Insert a streak_log for yesterday with source = 'manual'
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const { error: logError } = await supabase.from('streak_logs').insert({
      user_id:      user.id,
      log_date:     yesterdayStr,
      log_type,
      source:       'manual',
      comment_urls: [],
      notes:        'Grace day used',
    })
    if (logError) throw logError

    // Recalculate streak
    const { data: allLogsData } = await supabase
      .from('streak_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
    const allLogs = (allLogsData ?? []) as StreakLog[]

    const calc = calculateStreak(allLogs, 'publish', state)

    // Update streak_states
    const newGrace = state.grace_days_remaining - 1
    const { error: updateError } = await supabase
      .from('streak_states')
      .update({
        publish_streak:       calc.current,
        publish_best:         calc.best,
        publish_last_date:    calc.lastDate,
        grace_days_remaining: newGrace,
      })
      .eq('user_id', user.id)
    if (updateError) throw updateError

    return NextResponse.json({
      success:              true,
      grace_days_remaining: newGrace,
      new_streak:           calc.current,
    })
  } catch (err) {
    console.error('[POST /api/streak/grace]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to apply grace day' }, { status: 500 })
  }
}
