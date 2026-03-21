'use client'

import { useMemo } from 'react'
import type { PlannedPost, ContentPillar, PlannerSettings } from '@/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  posts:    PlannedPost[]
  pillars:  ContentPillar[]
  settings: PlannerSettings
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Signal = 'green' | 'amber' | 'red'

const SIGNAL_CLASSES: Record<Signal, string> = {
  green: 'bg-green-400',
  amber: 'bg-amber-400',
  red:   'bg-red-400',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlannerMonthStats({ posts, pillars, settings }: Props) {
  const stats = useMemo(() => {
    const planned   = posts.length
    const completed = posts.filter((p) => p.status === 'published').length
    const missed    = posts.filter((p) => p.status === 'missed').length

    // Streak — count consecutive days with published posts backwards from today
    const now     = new Date()
    let streak    = 0
    const checkDate = new Date(now)
    const publishedDates = new Set(
      posts.filter((p) => p.status === 'published').map((p) => p.planned_date.slice(0, 10)),
    )

    // Check posting days preference
    const dayMap: Record<number, string> = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' }
    const preferredSet = new Set(settings.preferred_days)

    for (let i = 0; i < 60; i++) {
      const ds      = checkDate.toISOString().slice(0, 10)
      const dayName = dayMap[checkDate.getDay()]
      if (preferredSet.has(dayName)) {
        if (publishedDates.has(ds)) {
          streak++
        } else if (checkDate < now) {
          break
        }
      }
      checkDate.setDate(checkDate.getDate() - 1)
    }

    // Pillar distribution
    const pillarDist: Record<string, number> = {}
    pillars.forEach((p) => { pillarDist[p.id] = 0 })
    posts.forEach((post) => {
      if (post.pillar_id) pillarDist[post.pillar_id] = (pillarDist[post.pillar_id] ?? 0) + 1
    })

    // Format distribution
    const fmtDist: Record<string, number> = {}
    posts.forEach((p) => { fmtDist[p.format] = (fmtDist[p.format] ?? 0) + 1 })

    // Scores
    const activePillars       = pillars.filter((p) => p.is_active)
    const pillarsWithPosts    = activePillars.filter((p) => (pillarDist[p.id] ?? 0) > 0)
    const pillarsWithoutPosts = activePillars.length - pillarsWithPosts.length

    const varietyScore: Signal =
      pillarsWithoutPosts === 0 ? 'green' :
      pillarsWithoutPosts === 1 ? 'amber' : 'red'

    const formatCount   = Object.keys(fmtDist).length
    const formatScore: Signal =
      formatCount >= 2 ? 'green' :
      formatCount === 1 ? 'amber' : 'red'

    const pct               = planned > 0 ? (completed / planned) * 100 : 0
    const consistencyScore: Signal =
      pct >= 80 ? 'green' :
      pct >= 60 ? 'amber' : 'red'

    return { planned, completed, missed, streak, pillarDist, fmtDist, varietyScore, formatScore, consistencyScore }
  }, [posts, pillars, settings])

  const totalPillarPosts = Object.values(stats.pillarDist).reduce((s, v) => s + v, 0)

  return (
    <div className="grid grid-cols-4 gap-3 mb-4">

      {/* Card 1: Posts progress */}
      <div className="bg-white rounded-xl border border-[#E5E4E0] p-4">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Posts planned</p>
        <p className="text-2xl font-bold text-[#0A2540]">
          <span className="text-[#1D9E75]">{stats.completed}</span>
          <span className="text-base font-normal text-gray-300"> / {stats.planned}</span>
        </p>
        <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-[#1D9E75] rounded-full"
            style={{ width: stats.planned > 0 ? `${(stats.completed / stats.planned) * 100}%` : '0%' }}
          />
        </div>
        {stats.missed > 0 && (
          <p className="text-[10px] text-red-400 mt-1">{stats.missed} missed</p>
        )}
      </div>

      {/* Card 2: Streak */}
      <div className="bg-white rounded-xl border border-[#E5E4E0] p-4">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Streak</p>
        <div className="flex items-end gap-1">
          <p className="text-3xl font-bold text-[#0A2540]">{stats.streak}</p>
          {stats.streak > 7 && <span className="text-xl mb-0.5">🔥</span>}
        </div>
        <p className="text-[10px] text-gray-400">day streak</p>
      </div>

      {/* Card 3: Pillar distribution */}
      <div className="bg-white rounded-xl border border-[#E5E4E0] p-4">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Pillar mix</p>
        <div className="flex h-3 rounded-full overflow-hidden gap-px mb-1">
          {pillars.filter((p) => p.is_active).map((p) => {
            const count = stats.pillarDist[p.id] ?? 0
            const pct   = totalPillarPosts > 0 ? (count / totalPillarPosts) * 100 : 0
            return pct > 0 ? (
              <div
                key={p.id}
                title={`${p.name}: ${count} posts`}
                style={{ width: `${pct}%`, backgroundColor: p.color }}
                className="cursor-help"
              />
            ) : null
          })}
        </div>
        <p className="text-[10px] text-gray-400">{totalPillarPosts} posts across pillars</p>
      </div>

      {/* Card 4: Content health */}
      <div className="bg-white rounded-xl border border-[#E5E4E0] p-4">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Content health</p>
        <div className="space-y-1.5">
          {([
            { label: 'Variety',     score: stats.varietyScore },
            { label: 'Formats',     score: stats.formatScore },
            { label: 'Consistency', score: stats.consistencyScore },
          ] as { label: string; score: Signal }[]).map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-[11px] text-gray-600">{item.label}</span>
              <span className={`w-2 h-2 rounded-full ${SIGNAL_CLASSES[item.score]}`} />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
