export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildCalendarDays } from '@/lib/streakEngine'
import { STREAK_LIMITS, getTodayDateString } from '@/lib/streakConfig'
import type { StreakLog, StreakState, StreakAchievement, StreakDashboardData } from '@/types'

// ── GET /api/streak/state ─────────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Profile — plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const plan = ((profile?.plan ?? 'free') as string) in STREAK_LIMITS
      ? (profile?.plan ?? 'free') as keyof typeof STREAK_LIMITS
      : 'free' as keyof typeof STREAK_LIMITS

    // 3. Streak state (upsert default if missing)
    const { data: stateData, error: stateError } = await supabase
      .from('streak_states')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (stateError) throw stateError

    let streakState: StreakState

    if (!stateData) {
      const defaultRow = {
        user_id: user.id,
        publish_streak: 0,
        publish_best: 0,
        publish_last_date: null,
        engage_streak: 0,
        engage_best: 0,
        engage_last_date: null,
        plan_streak: 0,
        plan_best: 0,
        plan_last_date: null,
        grace_days_remaining: 1,
        grace_days_reset_at: null,
        freeze_count: 0,
        freeze_active_until: null,
        total_posts_logged: 0,
        longest_gap_days: 0,
      }

      const { data: inserted, error: insertError } = await supabase
        .from('streak_states')
        .insert(defaultRow)
        .select()
        .single()

      if (insertError) throw insertError

      streakState = (inserted ?? {
        ...defaultRow,
        updated_at: new Date().toISOString(),
      }) as StreakState
    } else {
      streakState = stateData as StreakState
    }

    // 4. Fetch last 365 days of logs
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 365)
    const cutoffStr = cutoff.toISOString().split('T')[0]

    const { data: logsData, error: logsError } = await supabase
      .from('streak_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('log_date', cutoffStr)
      .order('log_date', { ascending: false })

    if (logsError) throw logsError

    const logs = (logsData ?? []) as StreakLog[]

    // 5. Fetch achievements
    const { data: achievementsData, error: achievementsError } = await supabase
      .from('streak_achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })

    if (achievementsError) throw achievementsError

    const achievements = (achievementsData ?? []) as StreakAchievement[]

    // 6. Calendar days
    const calDays = STREAK_LIMITS[plan].calendar_days
    const calendar_days = buildCalendarDays(logs, calDays)

    // 7. Today's logged status
    const today = getTodayDateString()
    const posted_today_publish = logs.some(l => l.log_date === today && l.log_type === 'publish')
    const posted_today_engage  = logs.some(l => l.log_date === today && l.log_type === 'engage')
    const posted_today_plan    = logs.some(l => l.log_date === today && l.log_type === 'plan')

    // 8. Weekly pattern — publish logs per day-of-week (0=Sun … 6=Sat)
    const weekly_pattern: Record<string, number> = {
      '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0,
    }
    logs
      .filter(l => l.log_type === 'publish')
      .forEach(l => {
        const [y, m, d] = l.log_date.split('-').map(Number)
        const dow = String(new Date(y, m - 1, d).getDay())
        weekly_pattern[dow] = (weekly_pattern[dow] ?? 0) + 1
      })

    // 9. Monthly consistency — last 6 months
    const nowDate = new Date()
    const monthly_consistency: StreakDashboardData['monthly_consistency'] = []

    for (let i = 5; i >= 0; i--) {
      const d     = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1)
      const year  = d.getFullYear()
      const mon   = d.getMonth()            // 0-indexed
      const monPadded = String(mon + 1).padStart(2, '0')
      const monthStr  = `${year}-${monPadded}`
      const daysInMonth = new Date(year, mon + 1, 0).getDate()

      const postedDays = new Set(
        logs
          .filter(l => l.log_type === 'publish' && l.log_date.startsWith(monthStr))
          .map(l => l.log_date),
      )

      const posted = postedDays.size
      const rate   = daysInMonth > 0 ? Math.round((posted / daysInMonth) * 100) : 0

      monthly_consistency.push({ month: monthStr, rate, posted, planned: daysInMonth })
    }

    // 10. Build + return response
    const response: StreakDashboardData = {
      state:               streakState,
      recent_logs:         logs.slice(0, 30),
      achievements,
      calendar_days,
      posted_today_publish,
      posted_today_engage,
      posted_today_plan,
      weekly_pattern,
      monthly_consistency,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[GET /api/streak/state]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to fetch streak data' }, { status: 500 })
  }
}
