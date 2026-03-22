export const PUBLISH_MILESTONES = [
  { days: 3,   key: 'publish_3',   label: 'Getting Started',    icon: '👋', description: 'First 3 days — the hardest part is starting' },
  { days: 7,   key: 'publish_7',   label: 'One Week Strong',    icon: '🏆', description: 'Seven days of consistent LinkedIn presence' },
  { days: 14,  key: 'publish_14',  label: 'Two Week Warrior',   icon: '🛡️', description: 'Two weeks of building your LinkedIn brand' },
  { days: 21,  key: 'publish_21',  label: '21-Day Habit',       icon: '🎓', description: 'Science says 21 days builds a habit — you\'ve done it' },
  { days: 30,  key: 'publish_30',  label: 'Monthly Master',     icon: '🥇', description: 'A full month of daily LinkedIn presence' },
  { days: 60,  key: 'publish_60',  label: '60-Day Elite',       icon: '💎', description: 'Two months — you\'re in the top 5% of LinkedIn creators' },
  { days: 90,  key: 'publish_90',  label: '90-Day Legend',      icon: '🦸', description: 'Ninety days — your algorithm advantage is now significant' },
  { days: 180, key: 'publish_180', label: 'Half-Year Hero',     icon: '💫', description: 'Six months of consistent LinkedIn growth' },
  { days: 365, key: 'publish_365', label: 'LinkedIn Legend',    icon: '👑', description: 'A full year — fewer than 0.1% of creators reach this' },
]

export const COMBO_ACHIEVEMENTS = [
  { key: 'perfect_week',        label: 'Perfect Week',          icon: '⭐', description: 'Posted every planned day for a full week' },
  { key: 'comeback_kid',        label: 'Comeback Kid',          icon: '🔄', description: 'Rebuilt a streak to 7 days after breaking one' },
  { key: 'early_bird',          label: 'Early Bird',            icon: '🌅', description: '5 consecutive posts before 9am' },
  { key: 'night_owl',           label: 'Night Owl',             icon: '🦉', description: '5 consecutive posts after 7pm' },
  { key: 'niche_authority',     label: 'Niche Authority',       icon: '🎯', description: '30 posts all in the same niche or pillar' },
  { key: 'engagement_champion', label: 'Engagement Champion',   icon: '💬', description: '30-day engagement streak alongside publishing streak' },
]

export const STREAK_LIMITS = {
  free:    { streak_types: ['publish'], calendar_days: 30,  grace_days: 1, freezes: false, reminders: false, analytics: false, milestone_posts: false },
  starter: { streak_types: ['publish','engage','plan'], calendar_days: 365, grace_days: 1, freezes: false, reminders: true,  analytics: 'basic', milestone_posts: false },
  pro:     { streak_types: ['publish','engage','plan'], calendar_days: 365, grace_days: 1, freezes: true,   reminders: true,  analytics: 'full',  milestone_posts: true  },
  agency:  { streak_types: ['publish','engage','plan'], calendar_days: 365, grace_days: 1, freezes: true,   reminders: true,  analytics: 'full',  milestone_posts: true  },
}

export const CALENDAR_COLORS = {
  empty:       '#F1EFE8',
  plan_only:   '#9FE1CB',
  published:   '#1D9E75',
  published_2: '#0F6E56',
  milestone:   '#C9A84C',
  break:       '#E24B4A',
  grace:       '#534AB7',
  today:       '#0A2540',
}

export const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export function getMilestoneForStreak(
  streak: number
): typeof PUBLISH_MILESTONES[0] | null {
  return PUBLISH_MILESTONES.find(m => m.days === streak) ?? null
}

export function getNextMilestone(
  streak: number
): typeof PUBLISH_MILESTONES[0] | null {
  return PUBLISH_MILESTONES.find(m => m.days > streak) ?? null
}

export function isStreakActive(
  lastDate: string | null,
  freezeActiveUntil: string | null
): boolean {
  if (!lastDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const last = new Date(lastDate)
  last.setHours(0, 0, 0, 0)
  const diffDays = Math.floor(
    (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (freezeActiveUntil) {
    const freeze = new Date(freezeActiveUntil)
    if (freeze > today) return true
  }
  return diffDays <= 1
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}
