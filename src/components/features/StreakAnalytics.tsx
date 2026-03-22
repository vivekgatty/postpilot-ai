'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'
import { TrendingUp, Calendar, Clock, Trophy, Flame, Lock } from 'lucide-react'
import { DAY_LABELS } from '@/lib/streakConfig'
import type { StreakDashboardData } from '@/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  data: StreakDashboardData
  plan: string
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionHeading({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-gray-500">{icon}</span>
      <h3 className="text-sm font-bold text-gray-800">{children}</h3>
    </div>
  )
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

// ─── Section 1 — Summary stats strip ─────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-2 text-gray-400">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 tabular-nums leading-tight">{value}</div>
    </div>
  )
}

function SummaryStrip({ data }: { data: StreakDashboardData }) {
  const lastMonth = data.monthly_consistency[data.monthly_consistency.length - 1]
  const monthRate = lastMonth ? `${lastMonth.rate}%` : '—'

  return (
    <div className="flex gap-3 flex-wrap">
      <StatCard
        icon={<Flame size={13} />}
        label="Current streak"
        value={`${data.state.publish_streak} days`}
      />
      <StatCard
        icon={<Trophy size={13} />}
        label="Best streak"
        value={`${data.state.publish_best} days`}
      />
      <StatCard
        icon={<Calendar size={13} />}
        label="Total posts logged"
        value={String(data.state.total_posts_logged)}
      />
      <StatCard
        icon={<TrendingUp size={13} />}
        label="This month"
        value={monthRate}
      />
    </div>
  )
}

// ─── Section 2 — Day of week pattern ─────────────────────────────────────────

interface DowEntry { day: string; posts: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DowTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { day, posts } = payload[0].payload as DowEntry
  return (
    <div className="bg-gray-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg">
      {posts} post{posts !== 1 ? 's' : ''} on {day}s
    </div>
  )
}

function DayOfWeekChart({ data }: { data: StreakDashboardData }) {
  const chartData: DowEntry[] = DAY_LABELS.map((day, i) => ({
    day,
    posts: data.weekly_pattern[String(i)] ?? 0,
  }))

  // Best day insight
  const best = chartData.reduce(
    (acc, cur) => (cur.posts > acc.posts ? cur : acc),
    chartData[0],
  )
  const insightText =
    best.posts > 0
      ? `You post most on ${best.day}s — keep scheduling content for that day.`
      : 'No posting pattern yet — keep logging to see your best days.'

  return (
    <Section>
      <SectionHeading icon={<Calendar size={14} />}>When you post</SectionHeading>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barCategoryGap="30%">
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <RechartsTooltip content={<DowTooltip />} cursor={{ fill: '#F3F4F6' }} />
          <Bar dataKey="posts" fill="#1D9E75" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[11px] text-gray-400 mt-2">{insightText}</p>
    </Section>
  )
}

// ─── Section 3 — Monthly consistency ─────────────────────────────────────────

interface MonthEntry { month: string; rate: number; posted: number; planned: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MonthTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as MonthEntry
  return (
    <div className="bg-gray-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-lg">
      {d.rate}% consistency in {d.month} ({d.posted} of {d.planned} days)
    </div>
  )
}

function MonthlyConsistencyChart({ data, plan }: { data: StreakDashboardData; plan: string }) {
  const isLocked = plan === 'free'

  return (
    <div className="relative">
      {isLocked && (
        <div className="absolute inset-0 rounded-2xl z-10 flex flex-col items-center justify-center gap-1.5 backdrop-blur-[3px] bg-white/60">
          <Lock size={16} className="text-gray-400" />
          <span className="text-[12px] font-bold text-gray-500">Basic analytics</span>
          <span className="text-[11px] text-gray-400">Starter plan</span>
        </div>
      )}
      <Section className={isLocked ? 'pointer-events-none select-none' : ''}>
        <SectionHeading icon={<TrendingUp size={14} />}>Monthly consistency</SectionHeading>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data.monthly_consistency} barCategoryGap="30%">
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              hide
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <RechartsTooltip content={<MonthTooltip />} cursor={{ fill: '#F3F4F6' }} />
            <Bar dataKey="rate" fill="#534AB7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  )
}

// ─── Section 4 — Full analytics (Pro only) ───────────────────────────────────

const TIME_BINS = [
  { name: 'Morning\n6–11am',   posts: 0 },
  { name: 'Afternoon\n12–4pm', posts: 0 },
  { name: 'Evening\n5–8pm',    posts: 0 },
  { name: 'Night\n9pm+',       posts: 0 },
]

function ProAnalyticsLocked() {
  return (
    <Section>
      <div className="flex flex-col items-center text-center py-4 gap-3">
        <div className="w-10 h-10 rounded-full bg-[#1D9E75]/10 flex items-center justify-center">
          <Lock size={18} className="text-[#1D9E75]" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-1">Full analytics — Pro plan</h4>
          <p className="text-[12px] text-gray-400 leading-relaxed max-w-xs mx-auto">
            Posting time patterns, streak predictions, and engagement correlation
            available on Pro.
          </p>
        </div>
        <a
          href="/dashboard/settings"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-[#1D9E75] text-white text-[13px] font-semibold hover:bg-[#18876A] transition-colors"
        >
          Upgrade to Pro →
        </a>
      </div>
    </Section>
  )
}

function PostingTimeChart() {
  return (
    <Section>
      <SectionHeading icon={<Clock size={14} />}>
        Posting time pattern (coming soon)
      </SectionHeading>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={TIME_BINS} barCategoryGap="30%">
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Bar dataKey="posts" fill="#D1D5DB" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[11px] text-gray-400 mt-2">
        Track posting times by enabling time logging in settings.
      </p>
    </Section>
  )
}

interface StreakHistoryPoint { date: string; streak: number }

function StreakHistoryChart({ data }: { data: StreakDashboardData }) {
  // Approximate streak history from recent_logs (publish only, ascending)
  const publishLogs = [...data.recent_logs]
    .filter(l => l.log_type === 'publish')
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
    .slice(-30)

  let running = 0
  let lastDate = ''
  const chartData: StreakHistoryPoint[] = publishLogs.map(log => {
    if (lastDate) {
      const prev = new Date(lastDate)
      const curr = new Date(log.log_date)
      const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000)
      running = diff === 1 ? running + 1 : 1
    } else {
      running = 1
    }
    lastDate = log.log_date
    const [, m, d] = log.log_date.split('-')
    return { date: `${d}/${m}`, streak: running }
  })

  return (
    <Section>
      <SectionHeading icon={<TrendingUp size={14} />}>Streak history</SectionHeading>
      {chartData.length < 2 ? (
        <p className="text-[12px] text-gray-400 py-6 text-center">
          Not enough data yet — keep posting to see your streak trend.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis hide />
            <RechartsTooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E7EB' }}
              formatter={(v) => [`${v} days`, 'Streak']}
            />
            <Line
              type="monotone"
              dataKey="streak"
              stroke="#1D9E75"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#1D9E75' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      <p className="text-[11px] text-gray-400 mt-2">Based on logged activity</p>
    </Section>
  )
}

// ─── Section 5 — Streak prediction (Pro only) ────────────────────────────────

function StreakPrediction({ data }: { data: StreakDashboardData }) {
  // Find weak day: lowest nonzero post count among days that have at least some posts
  const entries = DAY_LABELS.map((day, i) => ({
    day,
    posts: data.weekly_pattern[String(i)] ?? 0,
  })).filter(e => e.posts > 0)

  const totalDays = entries.length
  let weakInfo: { day: string } | null = null

  if (totalDays >= 3) {
    const avg = entries.reduce((s, e) => s + e.posts, 0) / totalDays
    const weakest = entries.reduce((acc, cur) => (cur.posts < acc.posts ? cur : acc), entries[0])
    // Only flag if clearly below average (less than 60% of avg)
    if (weakest.posts < avg * 0.6) {
      weakInfo = { day: weakest.day }
    }
  }

  return (
    <Section>
      <SectionHeading icon={<TrendingUp size={14} />}>Streak prediction</SectionHeading>
      {weakInfo ? (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-[12px] text-amber-800 leading-relaxed">
          Based on your history, you tend to skip <strong>{weakInfo.day}s</strong>.
          Consider scheduling content in advance for this day.
        </div>
      ) : (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-[12px] text-green-800 leading-relaxed">
          Your posting consistency is well-distributed across the week. Keep it up!
        </div>
      )}
    </Section>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function StreakAnalytics({ data, plan }: Props) {
  const isPro = plan === 'pro' || plan === 'agency'

  return (
    <div className="space-y-4">
      {/* Section 1 — Summary */}
      <SummaryStrip data={data} />

      {/* Section 2 — Day of week */}
      <DayOfWeekChart data={data} />

      {/* Section 3 — Monthly consistency (locked for free) */}
      <MonthlyConsistencyChart data={data} plan={plan} />

      {/* Section 4 — Full analytics */}
      {isPro ? (
        <>
          <PostingTimeChart />
          <StreakHistoryChart data={data} />
        </>
      ) : (
        <ProAnalyticsLocked />
      )}

      {/* Section 5 — Streak prediction (Pro only) */}
      {isPro && <StreakPrediction data={data} />}
    </div>
  )
}
