'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/hooks/useUser'
import { useToast } from '@/components/ui/Toast'
import StreakCounter      from '@/components/features/StreakCounter'
import StreakCalendar     from '@/components/features/StreakCalendar'
import StreakAchievements from '@/components/features/StreakAchievements'
import StreakAnalytics    from '@/components/features/StreakAnalytics'
import LogTodayModal      from '@/components/features/LogTodayModal'
import { getMilestoneForStreak } from '@/lib/streakConfig'
import type { StreakDashboardData, StreakAchievement } from '@/types'
import { Flame, Settings, Calendar, Award, BarChart2, CheckCircle, Snowflake } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'calendar' | 'achievements' | 'analytics' | 'settings'

interface ReminderSettings {
  email_enabled: boolean
  reminder_time: string
  timezone:      string
}

// ─── Celebration CSS ──────────────────────────────────────────────────────────

const CONFETTI_STYLE = `
@keyframes confetti-fall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(180px) rotate(720deg); opacity: 0; }
}
.confetti-dot {
  position: absolute;
  top: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: confetti-fall 1.6s ease-in forwards;
}
`

const CONFETTI_COLORS = ['#1D9E75','#C9A84C','#534AB7','#E24B4A','#F59E0B','#60A5FA']

function ConfettiDots() {
  return (
    <>
      <style>{CONFETTI_STYLE}</style>
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="confetti-dot"
          style={{
            left:            `${Math.random() * 100}%`,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay:  `${Math.random() * 0.6}s`,
            animationDuration: `${1.2 + Math.random() * 0.8}s`,
          }}
        />
      ))}
    </>
  )
}

// ─── Celebration overlay ──────────────────────────────────────────────────────

function CelebrationOverlay({
  achievement,
  onDismiss,
}: {
  achievement: StreakAchievement
  onDismiss:   () => void
}) {
  const milestone = getMilestoneForStreak(achievement.milestone_value ?? 0)
  const icon      = milestone?.icon ?? '🏆'

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center relative overflow-hidden">
        <ConfettiDots />

        <div className="relative z-10">
          <div className="text-[60px] leading-none mb-4 select-none">{icon}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {achievement.achievement_label}
          </h2>
          {milestone?.description && (
            <p className="text-sm text-gray-500 mb-3 leading-relaxed">
              {milestone.description}
            </p>
          )}
          {achievement.milestone_value ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D9E75]/10 rounded-full mb-6">
              <Flame size={16} className="text-[#1D9E75]" />
              <span className="text-lg font-bold text-[#1D9E75]">
                Day {achievement.milestone_value}!
              </span>
            </div>
          ) : null}
          <button
            onClick={onDismiss}
            className="w-full py-3 rounded-xl bg-[#1D9E75] hover:bg-[#18876A] text-white font-bold text-sm transition-colors"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Stat cards */}
      <div className="flex gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-1 bg-white rounded-xl border border-gray-100 p-4 space-y-3 shadow-sm">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      {/* Calendar skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-12 gap-1">
          {Array.from({ length: 84 }).map((_, i) => (
            <div key={i} className="h-3 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Tab button ───────────────────────────────────────────────────────────────

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active:  boolean
  onClick: () => void
  icon:    React.ReactNode
  label:   string
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors whitespace-nowrap',
        active
          ? 'bg-[#1D9E75] text-white shadow-sm'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  )
}

// ─── Calendar legend ──────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { color: '#1D9E75', label: 'Published' },
  { color: '#0F6E56', label: 'All three logged' },
  { color: '#9FE1CB', label: 'Planned only' },
  { color: '#534AB7', label: 'Grace day' },
  { color: '#E24B4A', label: 'Streak break' },
  { color: '#C9A84C', label: 'Milestone' },
]

function CalendarLegend() {
  return (
    <div className="flex flex-wrap gap-3 mt-3">
      {LEGEND_ITEMS.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-[11px] text-gray-500">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Timezone options ─────────────────────────────────────────────────────────

const TIMEZONES = [
  { value: 'Asia/Kolkata',     label: 'India (IST, UTC+5:30)' },
  { value: 'Asia/Dubai',       label: 'Dubai (GST, UTC+4)' },
  { value: 'Asia/Singapore',   label: 'Singapore (SGT, UTC+8)' },
  { value: 'Europe/London',    label: 'London (GMT/BST)' },
  { value: 'Europe/Berlin',    label: 'Central Europe (CET, UTC+1)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Chicago',  label: 'Chicago (CST/CDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST, UTC+10)' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StreakPage() {
  const { profile }                                    = useUser()
  const { toast }                                      = useToast()
  const plan                                           = (profile?.plan ?? 'free') as string

  const [dashboardData,    setDashboardData]    = useState<StreakDashboardData | null>(null)
  const [isLoading,        setIsLoading]        = useState(true)
  const [isLogging,        setIsLogging]        = useState(false)
  const [showLogModal,     setShowLogModal]     = useState(false)
  const [showCelebration,  setShowCelebration]  = useState<StreakAchievement | null>(null)
  const [calendarView,     setCalendarView]     = useState<'year' | 'month'>('year')
  const [activeTab,        setActiveTab]        = useState<Tab>('overview')
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    email_enabled: false,
    reminder_time: '09:00',
    timezone:      'Asia/Kolkata',
  })
  const [isSavingReminders, setIsSavingReminders] = useState(false)

  // ── Data loading ─────────────────────────────────────────────────────────────

  const handleLoadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [stateRes, reminderRes] = await Promise.all([
        fetch('/api/streak/state'),
        fetch('/api/streak/reminders'),
      ])
      if (stateRes.ok) {
        const data = await stateRes.json() as StreakDashboardData
        setDashboardData(data)
      }
      if (reminderRes.ok) {
        const r = await reminderRes.json() as ReminderSettings
        setReminderSettings(r)
      }
    } catch {
      toast.error('Failed to load streak data')
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => { handleLoadData() }, [handleLoadData])

  // ── Log activity ──────────────────────────────────────────────────────────────

  async function handleLogActivity(
    logType: 'publish' | 'engage' | 'plan',
    data: { comment_urls?: string[]; notes?: string; post_id?: string },
  ) {
    setIsLogging(true)
    try {
      const res = await fetch('/api/streak/log', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ log_type: logType, ...data }),
      })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error ?? 'Failed to log activity')
        return
      }

      if (json.already_logged) {
        toast.success('Already logged for today!')
        setShowLogModal(false)
        return
      }

      // Update dashboardData state if provided
      if (json.state && dashboardData) {
        setDashboardData(prev =>
          prev ? { ...prev, state: json.state } : prev,
        )
      }

      // Celebration for new achievements
      if (Array.isArray(json.new_achievements) && json.new_achievements.length > 0) {
        setShowCelebration(json.new_achievements[0] as StreakAchievement)
      }

      toast.success(
        logType === 'publish'
          ? `🔥 Post logged! Streak: ${json.new_streak} days`
          : 'Activity logged!',
      )
      setShowLogModal(false)
      handleLoadData()
    } catch {
      toast.error('Failed to log activity')
    } finally {
      setIsLogging(false)
    }
  }

  // ── Grace day ─────────────────────────────────────────────────────────────────

  async function handleUseGraceDay() {
    try {
      const res  = await fetch('/api/streak/grace', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ log_type: 'publish' }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to use grace day')
        return
      }
      toast.success('Grace day used — streak saved!')
      handleLoadData()
    } catch {
      toast.error('Failed to use grace day')
    }
  }

  // ── Freeze ────────────────────────────────────────────────────────────────────

  async function handleUseFreeze() {
    try {
      const res  = await fetch('/api/streak/freeze', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to activate freeze')
        return
      }
      toast.success('Streak freeze activated for 48 hours!')
      handleLoadData()
    } catch {
      toast.error('Failed to activate freeze')
    }
  }

  // ── Reminders ─────────────────────────────────────────────────────────────────

  async function handleSaveReminders() {
    setIsSavingReminders(true)
    try {
      const res = await fetch('/api/streak/reminders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(reminderSettings),
      })
      if (res.ok) {
        toast.success('Reminder settings saved')
      } else {
        toast.error('Failed to save settings')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setIsSavingReminders(false)
    }
  }

  // ── Share achievement (modal handled in StreakAchievements) ───────────────────

  function handleShareAchievement(_achievement: StreakAchievement) {
    // no-op: StreakAchievements opens its own share modal
  }

  // ─── Grace day banner logic ─────────────────────────────────────────────────

  const showGraceBanner = (() => {
    if (!dashboardData) return false
    const { state, posted_today_publish } = dashboardData
    if (posted_today_publish || state.publish_streak === 0) return false
    if (state.grace_days_remaining <= 0) return false
    if (!state.publish_last_date) return false
    const lastDate = new Date(state.publish_last_date)
    lastDate.setHours(0, 0, 0, 0)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    return lastDate.getTime() === yesterday.getTime()
  })()

  // ─── Derived ────────────────────────────────────────────────────────────────

  const isPro = plan === 'pro' || plan === 'agency'
  const state = dashboardData?.state

  const freezeIsActive =
    state?.freeze_active_until && new Date(state.freeze_active_until) > new Date()

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto space-y-5">

        {/* Page heading */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={24} className="text-[#1D9E75]" />
            <h1 className="text-xl font-bold text-gray-900">Streak Tracker</h1>
          </div>
          <button
            onClick={() => setActiveTab('settings')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Reminder settings"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Grace day banner */}
        {showGraceBanner && state && (
          <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-sm text-amber-800 font-medium">
              Your streak is at risk! Use your grace day to save your{' '}
              <strong>{state.publish_streak}-day streak</strong> →
            </p>
            <button
              onClick={handleUseGraceDay}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors"
            >
              Use grace day
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          <TabBtn active={activeTab === 'overview'}      onClick={() => setActiveTab('overview')}      icon={<Flame size={13} />}      label="Overview" />
          <TabBtn active={activeTab === 'calendar'}      onClick={() => setActiveTab('calendar')}      icon={<Calendar size={13} />}   label="Calendar" />
          <TabBtn active={activeTab === 'achievements'}  onClick={() => setActiveTab('achievements')}  icon={<Award size={13} />}      label="Achievements" />
          <TabBtn active={activeTab === 'analytics'}     onClick={() => setActiveTab('analytics')}     icon={<BarChart2 size={13} />}  label="Analytics" />
          <TabBtn active={activeTab === 'settings'}      onClick={() => setActiveTab('settings')}      icon={<Settings size={13} />}   label="Settings" />
        </div>

        {/* Loading */}
        {isLoading && <LoadingSkeleton />}

        {/* Tab content */}
        {!isLoading && dashboardData && (
          <>
            {/* ── Overview ─────────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                <StreakCounter
                  streakState={dashboardData.state}
                  postedTodayPublish={dashboardData.posted_today_publish}
                  postedTodayEngage={dashboardData.posted_today_engage}
                  postedTodayPlan={dashboardData.posted_today_plan}
                  plan={plan}
                  compact={false}
                />

                {/* CTA or success banner */}
                {dashboardData.posted_today_publish ? (
                  <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        ✓ Posted today — streak safe!
                      </p>
                      <p className="text-[12px] text-green-700 mt-0.5">
                        You&apos;ve logged your post for today. Come back tomorrow.
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowLogModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D9E75] hover:bg-[#18876A] text-white font-semibold text-sm transition-colors shadow-sm"
                  >
                    <Flame size={15} />
                    Log today&apos;s activity
                  </button>
                )}

                {/* Recent activity */}
                {dashboardData.recent_logs.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Recent activity</h3>
                    <div className="space-y-2">
                      {dashboardData.recent_logs.slice(0, 7).map(log => {
                        const [y, m, d] = log.log_date.split('-').map(Number)
                        const dateLabel = new Date(y, m - 1, d).toLocaleDateString('en-IN', {
                          weekday: 'short', day: 'numeric', month: 'short',
                        })
                        const badgeColors: Record<string, string> = {
                          publish: 'bg-[#1D9E75]/10 text-[#1D9E75]',
                          engage:  'bg-blue-50 text-blue-700',
                          plan:    'bg-purple-50 text-purple-700',
                        }
                        return (
                          <div key={log.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${badgeColors[log.log_type] ?? ''}`}>
                              {log.log_type}
                            </span>
                            <span className="text-[12px] text-gray-500 flex-1">{dateLabel}</span>
                            <span className="text-[11px] text-gray-400 capitalize">{log.source}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Calendar ─────────────────────────────────────────────────── */}
            {activeTab === 'calendar' && (
              <div className="space-y-4">
                {/* View toggle */}
                <div className="flex gap-2">
                  {(['year', 'month'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setCalendarView(v)}
                      className={[
                        'px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors capitalize',
                        calendarView === v
                          ? 'bg-[#1D9E75] text-white'
                          : 'text-gray-500 hover:bg-gray-100',
                      ].join(' ')}
                    >
                      {v === 'year' ? 'Year view' : 'Month view'}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <StreakCalendar
                    calendarDays={dashboardData.calendar_days}
                    view={calendarView}
                    plan={plan}
                  />
                  <CalendarLegend />
                </div>
              </div>
            )}

            {/* ── Achievements ─────────────────────────────────────────────── */}
            {activeTab === 'achievements' && (
              <StreakAchievements
                achievements={dashboardData.achievements}
                currentStreak={dashboardData.state.publish_streak}
                plan={plan}
                onShareAchievement={handleShareAchievement}
              />
            )}

            {/* ── Analytics ────────────────────────────────────────────────── */}
            {activeTab === 'analytics' && (
              <StreakAnalytics data={dashboardData} plan={plan} />
            )}

            {/* ── Settings ─────────────────────────────────────────────────── */}
            {activeTab === 'settings' && (
              <div className="space-y-5">

                {/* Reminder settings card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-5">
                  <h3 className="text-sm font-bold text-gray-900">Reminder settings</h3>

                  {/* Email toggle */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderSettings.email_enabled}
                      onChange={e =>
                        setReminderSettings(s => ({ ...s, email_enabled: e.target.checked }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1D9E75] focus:ring-[#1D9E75]"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-800">Email reminders</span>
                      <p className="text-[12px] text-gray-400 mt-0.5">
                        We&apos;ll email you if you haven&apos;t posted by your preferred time.
                      </p>
                    </div>
                  </label>

                  {reminderSettings.email_enabled && (
                    <div className="space-y-3 pl-7">
                      {/* Time */}
                      <div>
                        <label className="block text-[12px] font-semibold text-gray-600 mb-1">
                          Reminder time
                        </label>
                        <input
                          type="time"
                          value={reminderSettings.reminder_time}
                          onChange={e =>
                            setReminderSettings(s => ({ ...s, reminder_time: e.target.value }))
                          }
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] transition"
                        />
                      </div>

                      {/* Timezone */}
                      <div>
                        <label className="block text-[12px] font-semibold text-gray-600 mb-1">
                          Your timezone
                        </label>
                        <select
                          value={reminderSettings.timezone}
                          onChange={e =>
                            setReminderSettings(s => ({ ...s, timezone: e.target.value }))
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] transition bg-white"
                        >
                          {TIMEZONES.map(tz => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSaveReminders}
                    disabled={isSavingReminders}
                    className="px-4 py-2.5 rounded-xl bg-[#1D9E75] hover:bg-[#18876A] disabled:opacity-50 text-white font-semibold text-sm transition-colors"
                  >
                    {isSavingReminders ? 'Saving…' : 'Save reminder settings'}
                  </button>

                  {profile?.email && (
                    <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 space-y-1">
                      <p className="text-[12px] text-gray-600">
                        Reminders are sent to <strong>{profile.email}</strong>
                      </p>
                      <p className="text-[11px] text-gray-400">
                        We&apos;ll only email you if you haven&apos;t posted by your reminder time. No spam.
                      </p>
                    </div>
                  )}
                </div>

                {/* Freeze settings */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-gray-900">Streak freezes</h3>

                  {!isPro ? (
                    <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-4 text-center space-y-1">
                      <p className="text-[12px] font-semibold text-gray-500">Pro plan feature</p>
                      <p className="text-[11px] text-gray-400">
                        Earn streak freezes to protect your streak on days you can&apos;t post.
                      </p>
                      <a
                        href="/dashboard/settings"
                        className="inline-block mt-2 text-[12px] font-semibold text-[#1D9E75] hover:underline"
                      >
                        Upgrade to Pro →
                      </a>
                    </div>
                  ) : state ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Snowflake size={16} className="text-blue-500" />
                        <span className="text-sm font-semibold text-gray-800">
                          {state.freeze_count} freeze{state.freeze_count !== 1 ? 's' : ''} available
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-400">
                        Earn 1 freeze per 30-day active streak. Max 2 stored at once.
                      </p>

                      {freezeIsActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[12px] font-semibold">
                          <Snowflake size={11} />
                          Freeze active until{' '}
                          {new Date(state.freeze_active_until!).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      ) : state.freeze_count > 0 ? (
                        <button
                          onClick={handleUseFreeze}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                        >
                          <Snowflake size={14} />
                          Use a freeze
                        </button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Log modal */}
      <LogTodayModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onLog={handleLogActivity}
        postedTodayPublish={dashboardData?.posted_today_publish ?? false}
        postedTodayEngage={dashboardData?.posted_today_engage   ?? false}
        postedTodayPlan={dashboardData?.posted_today_plan       ?? false}
        plan={plan}
        currentStreak={dashboardData?.state.publish_streak ?? 0}
        isLogging={isLogging}
      />

      {/* Achievement celebration */}
      {showCelebration && (
        <CelebrationOverlay
          achievement={showCelebration}
          onDismiss={() => setShowCelebration(null)}
        />
      )}
    </>
  )
}
