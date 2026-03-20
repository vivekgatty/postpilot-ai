'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import PricingTable  from '@/components/features/PricingTable'
import type { Post, PlanType, ToneType } from '@/types'

// ── Tone colours (matches ToneSelector) ──────────────────────────────────────

const TONE_COLORS: Record<ToneType, string> = {
  professional:  '#0A2540',
  storytelling:  '#7F77DD',
  controversial: '#EF9F27',
  educational:   '#378ADD',
  inspirational: '#D85A30',
}

// ── Derived stats ─────────────────────────────────────────────────────────────

interface Stats {
  postsThisMonth:  number
  avgCharCount:    number
  mostUsedTone:    ToneType | null
  currentStreak:   number
  weeklyBars:      { week: string; posts: number }[]
  toneDistribution:{ name: string; value: number; color: string }[]
}

function computeStats(posts: Post[]): Stats {
  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const thisMonth = posts.filter(p => new Date(p.created_at) >= monthStart)

  // Avg char count (all posts with content)
  const charsTotal = posts.reduce((s, p) => s + (p.character_count ?? p.content.length), 0)
  const avgCharCount = posts.length ? Math.round(charsTotal / posts.length) : 0

  // Most used tone
  const toneCounts: Partial<Record<ToneType, number>> = {}
  for (const p of posts) {
    toneCounts[p.tone] = (toneCounts[p.tone] ?? 0) + 1
  }
  const mostUsedTone = (Object.entries(toneCounts) as [ToneType, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  // Current streak (consecutive calendar days with at least one post)
  const daySet = new Set(posts.map(p => p.created_at.slice(0, 10)))
  let streak = 0
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  while (daySet.has(d.toISOString().slice(0, 10))) {
    streak++
    d.setDate(d.getDate() - 1)
  }

  // Weekly bars: 4 weeks of this month (Mon-Sun)
  const weeklyBars: { week: string; posts: number }[] = []
  const mStart = new Date(monthStart)
  for (let w = 0; w < 4; w++) {
    const wStart = new Date(mStart)
    wStart.setDate(mStart.getDate() + w * 7)
    const wEnd = new Date(wStart)
    wEnd.setDate(wStart.getDate() + 7)
    const count = thisMonth.filter(p => {
      const d = new Date(p.created_at)
      return d >= wStart && d < wEnd
    }).length
    weeklyBars.push({ week: `Wk ${w + 1}`, posts: count })
  }

  // Tone distribution
  const toneDistribution = (Object.entries(toneCounts) as [ToneType, number][])
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, color: TONE_COLORS[name] }))
    .sort((a, b) => b.value - a.value)

  return { postsThisMonth: thisMonth.length, avgCharCount, mostUsedTone, currentStreak: streak, weeklyBars, toneDistribution }
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{label}</p>
      <p className="text-3xl font-extrabold text-[#0A2540]">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── Upgrade gate (blurred preview + overlay) ──────────────────────────────────

function UpgradeGate({ plan }: { plan: PlanType }) {
  return (
    <div className="relative">
      {/* Blurred mock charts */}
      <div className="filter blur-sm pointer-events-none select-none" aria-hidden>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {['Posts this month', 'Avg char count', 'Most used tone', 'Current streak'].map(l => (
            <div key={l} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="h-3 bg-gray-100 rounded w-28 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 h-56 flex items-end gap-4 justify-around">
            {[40, 70, 30, 55].map((h, i) => (
              <div key={i} className="w-10 bg-gray-200 rounded" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 h-56 flex items-center justify-center">
            <div className="w-36 h-36 rounded-full border-[18px] border-gray-200" />
          </div>
        </div>
      </div>

      {/* Glass overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center
                      bg-white/70 backdrop-blur-[2px] rounded-2xl z-10 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 max-w-2xl w-full text-center">
          <div className="text-4xl mb-3">📊</div>
          <h2 className="text-xl font-bold text-[#0A2540] mb-1">Analytics is a Pro feature</h2>
          <p className="text-gray-500 text-sm mb-6">
            Upgrade to Pro or Agency to unlock your content performance dashboard.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto">
            {[
              { emoji: '📈', text: 'Posts per week breakdown' },
              { emoji: '🎯', text: 'Tone distribution pie chart' },
              { emoji: '🔥', text: 'Posting streak tracker' },
              { emoji: '✍️', text: 'Avg character count insights' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
                <span>{f.emoji}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Upgrade your plan
            </p>
            <PricingTable currentPlan={plan} onUpgrade={() => {}} loading={false} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [posts,   setPosts]   = useState<Post[]>([])
  const [plan,    setPlan]    = useState<PlanType>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/posts?limit=500').then(r => r.json()) as Promise<{ posts: Post[] }>,
      fetch('/api/user/profile').then(r => r.json()) as Promise<{ profile?: { plan?: PlanType } }>,
    ])
      .then(([postsData, profileData]) => {
        setPosts(postsData.posts ?? [])
        if (profileData.profile?.plan) setPlan(profileData.profile.plan)
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const isPro    = plan === 'pro' || plan === 'agency'
  const stats    = computeStats(posts)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0A2540]">Analytics</h1>
        <p className="text-gray-500 mt-1 text-sm">Track your LinkedIn content performance.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-28 mb-3" />
              <div className="h-8 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : !isPro ? (
        <UpgradeGate plan={plan} />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Posts this month"
              value={stats.postsThisMonth.toString()}
              sub="across all statuses"
            />
            <StatCard
              label="Avg char count"
              value={stats.avgCharCount.toLocaleString('en-IN')}
              sub="across all posts"
            />
            <StatCard
              label="Most used tone"
              value={stats.mostUsedTone
                ? stats.mostUsedTone.charAt(0).toUpperCase() + stats.mostUsedTone.slice(1)
                : '—'}
              sub={stats.mostUsedTone ? `${stats.toneDistribution[0]?.value ?? 0} posts` : 'No posts yet'}
            />
            <StatCard
              label="Current streak"
              value={`${stats.currentStreak}d`}
              sub="consecutive days posting"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Bar chart: posts per week */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="text-sm font-semibold text-[#0A2540] mb-5">Posts per week this month</p>
              {stats.postsThisMonth === 0 ? (
                <div className="h-44 flex items-center justify-center text-sm text-gray-400">
                  No posts this month yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={stats.weeklyBars} barCategoryGap="40%">
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                      axisLine={false}
                      tickLine={false}
                      width={24}
                    />
                    <Tooltip
                      cursor={{ fill: '#F0FDF9' }}
                      contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
                    />
                    <Bar dataKey="posts" fill="#1D9E75" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie chart: tone distribution */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="text-sm font-semibold text-[#0A2540] mb-5">Posts by tone</p>
              {stats.toneDistribution.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-sm text-gray-400">
                  No posts yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={stats.toneDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={40}
                    >
                      {stats.toneDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Coming soon placeholder */}
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
            <div className="text-3xl mb-2">🔗</div>
            <p className="font-semibold text-gray-500">LinkedIn impressions &amp; engagement coming soon</p>
            <p className="text-xs text-gray-400 mt-1">
              Connect your LinkedIn account to see views, likes, and comments directly in PostPika.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
