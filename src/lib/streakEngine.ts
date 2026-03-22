import type { StreakState, StreakLog, StreakAchievement, CalendarDay } from '@/types'
import {
  PUBLISH_MILESTONES,
  getMilestoneForStreak,
  getTodayDateString,
} from '@/lib/streakConfig'

// Suppress unused-import warning — getMilestoneForStreak is exported for
// convenience use by consumers of this module.
void getMilestoneForStreak

// ─── calculateStreak ─────────────────────────────────────────────────────────

export function calculateStreak(
  logs: StreakLog[],
  logType: 'publish' | 'engage' | 'plan',
  currentState: Partial<StreakState>,
): { current: number; best: number; lastDate: string | null } {
  const typeLogs = logs.filter(l => l.log_type === logType)
  const uniqueDates = Array.from(new Set(typeLogs.map(l => l.log_date))).sort((a, b) =>
    b.localeCompare(a),
  )

  const bestKey = (`${logType}_best`) as 'publish_best' | 'engage_best' | 'plan_best'

  if (uniqueDates.length === 0) {
    return {
      current: 0,
      best: (currentState[bestKey] as number | undefined) ?? 0,
      lastDate: null,
    }
  }

  const today = getTodayDateString()
  let current = 0
  const checkDate = new Date(today)

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0]
    if (uniqueDates.includes(dateStr)) {
      current++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (current === 0 && dateStr === today) {
      checkDate.setDate(checkDate.getDate() - 1)
      continue
    } else {
      break
    }
  }

  const best = Math.max(current, (currentState[bestKey] as number | undefined) ?? 0)
  return { current, best, lastDate: uniqueDates[0] }
}

// ─── checkNewAchievements ─────────────────────────────────────────────────────

export function checkNewAchievements(
  newStreak: number,
  _streakType: 'publish' | 'engage' | 'plan',
  existingAchievements: StreakAchievement[],
): typeof PUBLISH_MILESTONES[0][] {
  const earnedKeys = existingAchievements.map(a => a.achievement_key)
  return PUBLISH_MILESTONES.filter(m => m.days <= newStreak && !earnedKeys.includes(m.key))
}

// ─── buildCalendarDays ────────────────────────────────────────────────────────

export function buildCalendarDays(logs: StreakLog[], days: number): CalendarDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const result: CalendarDay[] = []

  const publishDates = new Set(
    logs.filter(l => l.log_type === 'publish').map(l => l.log_date),
  )
  const engageDates = new Set(
    logs.filter(l => l.log_type === 'engage').map(l => l.log_date),
  )
  const planDates = new Set(
    logs.filter(l => l.log_type === 'plan').map(l => l.log_date),
  )

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const publish_logged = publishDates.has(dateStr)

    result.push({
      date: dateStr,
      publish_logged,
      engage_logged: engageDates.has(dateStr),
      plan_logged: planDates.has(dateStr),
      is_today: i === 0,
      is_future: false,
      streak_at_day: 0,
      is_milestone_day: false,
      is_grace_day: false,
      is_streak_break: false,
      day_of_week: date.getDay(),
    })
  }

  return result
}
