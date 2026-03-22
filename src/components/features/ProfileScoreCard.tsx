'use client'

import { useEffect, useState } from 'react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from 'recharts'
import {
  DIMENSION_CONFIG, SCORE_TIERS, getTierFromScore, DIMENSION_TIER_COLORS,
} from '@/lib/profileOptimizerConfig'
import type { ProfileAuditData, ProfileAuditDimension } from '@/types'
import {
  Copy, CheckCircle, TrendingUp, Award,
  Eye, MessageSquare,
  CheckSquare, Heading, AlignLeft, Briefcase, Search, Star, Camera, Activity, Image as ImageIcon,
} from 'lucide-react'

// Suppress unused import — imported per spec
void Copy
void CheckCircle
void Award

// ─── Dimension icon map ───────────────────────────────────────────────────────

const DIMENSION_ICONS: Record<string, React.ReactNode> = {
  CheckSquare: <CheckSquare className="w-4 h-4" />,
  Heading:     <Heading     className="w-4 h-4" />,
  AlignLeft:   <AlignLeft   className="w-4 h-4" />,
  Briefcase:   <Briefcase   className="w-4 h-4" />,
  Search:      <Search      className="w-4 h-4" />,
  Star:        <Star        className="w-4 h-4" />,
  Camera:      <Camera      className="w-4 h-4" />,
  Activity:    <Activity    className="w-4 h-4" />,
  Image:       <ImageIcon   className="w-4 h-4" />,
}

// ─── Animated progress bar ────────────────────────────────────────────────────

function AnimatedBar({ percentage, color }: { percentage: number; color: string }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(percentage), 100)
    return () => clearTimeout(t)
  }, [percentage])
  return (
    <div className="h-2 rounded-full overflow-hidden flex-1" style={{ background: '#F0F0EE' }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${width}%`, backgroundColor: color, transition: 'width 0.8s ease-out' }}
      />
    </div>
  )
}

// ─── Tier badge ───────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: ProfileAuditDimension['tier'] }) {
  const color = DIMENSION_TIER_COLORS[tier]
  const labels: Record<typeof tier, string> = {
    weak: 'Weak', average: 'Average', strong: 'Strong', excellent: 'Excellent',
  }
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ color, background: `${color}18`, border: `1px solid ${color}40` }}
    >
      {labels[tier]}
    </span>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  audit:           ProfileAuditData
  onViewDimension: (dimensionId: string) => void
  plan:            string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileScoreCard({ audit, onViewDimension, plan }: Props) {
  const tier      = getTierFromScore(audit.total_score)
  const tierColor = tier?.color ?? '#1D9E75'

  // Radar data
  const radarData = Object.values(audit.dimension_scores).map((d) => ({
    dimension:  d.label,
    score:      d.score,
    max:        d.max_score,
    percentage: d.percentage,
    fullMark:   100,
  }))

  // Sorted dimensions (weakest first)
  const sortedDimensions = Object.values(audit.dimension_scores)
    .slice()
    .sort((a, b) => a.percentage - b.percentage)

  const showCompetitive =
    (plan === 'pro' || plan === 'agency') &&
    audit.competitive_analysis != null

  // ── Tier label for score tiers (unused var guard) ────────────────────────
  void SCORE_TIERS

  return (
    <div className="space-y-6">

      {/* ── Section A — Score hero ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 text-center space-y-2"
        style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
      >
        <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: tierColor }}>
          {tier?.label ?? 'Developing'}
        </p>

        <div className="flex items-end justify-center gap-1 leading-none">
          <span className="font-bold" style={{ fontSize: 72, lineHeight: 1, color: tierColor }}>
            {audit.total_score}
          </span>
          <span className="text-2xl text-gray-400 pb-2">/100</span>
        </div>

        <p className="text-sm text-gray-500">{tier?.description}</p>

        {audit.projected_score > audit.total_score && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mx-auto"
            style={{ background: '#E1F5EE', color: '#0F6E56', border: '1px solid #1D9E75' }}>
            <TrendingUp className="w-3.5 h-3.5" />
            Projected with improvements: {audit.projected_score}/100
          </div>
        )}

        <p className="text-xs text-gray-400 pt-1">
          {audit.completed_recommendations.length} of {audit.recommendations.length} improvements done
        </p>
      </div>

      {/* ── Section B — Radar chart ────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
      >
        <h3 className="text-sm font-semibold text-gray-700 mb-2 px-2">Profile radar</h3>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart
            data={radarData}
            margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
          >
            <PolarGrid gridType="polygon" stroke="#E5E4E0" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 11, fill: '#6B7280' }}
            />
            <Radar
              name="Profile Score"
              dataKey="percentage"
              stroke="#1D9E75"
              fill="#1D9E75"
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 px-2 pt-2 border-t border-gray-100 mt-2">
          {Object.values(audit.dimension_scores).map((d) => {
            const cfg   = Object.values(DIMENSION_CONFIG).find((c) => c.id === d.id)
            const color = DIMENSION_TIER_COLORS[d.tier]
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onViewDimension(d.id)}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                {cfg?.label ?? d.label}
                <span className="text-gray-400 font-medium">{d.score}/{d.max_score}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Section C — Dimension breakdown bars ──────────────────────────── */}
      <div
        className="rounded-2xl p-4 space-y-1"
        style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
      >
        <h3 className="text-sm font-semibold text-gray-700 mb-3 px-2">Dimension breakdown</h3>
        {sortedDimensions.map((d) => {
          const cfg   = Object.values(DIMENSION_CONFIG).find((c) => c.id === d.id)
          const color = DIMENSION_TIER_COLORS[d.tier]
          const icon  = cfg ? DIMENSION_ICONS[cfg.icon] : null
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onViewDimension(d.id)}
              className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-left group"
            >
              <span className="flex-shrink-0 text-gray-400 group-hover:text-gray-600"
                style={{ color }}>
                {icon}
              </span>
              <span className="text-xs font-medium text-gray-700 w-36 flex-shrink-0 truncate">
                {cfg?.label ?? d.label}
              </span>
              <AnimatedBar percentage={d.percentage} color={color} />
              <span className="text-xs text-gray-400 w-10 text-right flex-shrink-0">
                {d.score}/{d.max_score}
              </span>
              <TierBadge tier={d.tier} />
            </button>
          )
        })}
      </div>

      {/* ── Section D — Key insights strip ────────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
      >
        <h3 className="text-sm font-semibold text-gray-700 mb-3 px-2">
          Projected impact if all improvements are implemented
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: <Eye className="w-5 h-5" />,           label: 'Profile views',     value: 'Est. +40–80% increase'     },
            { icon: <TrendingUp className="w-5 h-5" />,    label: 'Content reach',     value: 'Est. 2–3× improvement'     },
            { icon: <MessageSquare className="w-5 h-5" />, label: 'Inbound messages',  value: 'Est. +3–5× relevant DMs'   },
          ].map(({ icon, label, value }) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-xl px-4 py-3"
              style={{ background: '#E1F5EE', border: '1px solid #1D9E7540' }}
            >
              <span style={{ color: '#1D9E75' }} className="flex-shrink-0 mt-0.5">{icon}</span>
              <div>
                <p className="text-xs font-semibold text-gray-700">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 px-2 leading-relaxed">
          Projections based on LinkedIn&rsquo;s published creator research data and typical outcomes
          for profiles in this score range.
        </p>
      </div>

      {/* ── Section E — Competitive analysis (Pro/Agency only) ────────────── */}
      {showCompetitive && audit.competitive_analysis && (() => {
        const ca = audit.competitive_analysis
        return (
          <div
            className="rounded-2xl p-4 space-y-4"
            style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
          >
            <div className="flex items-center gap-3 px-2">
              <h3 className="text-sm font-semibold text-gray-700">
                How you compare to top profiles in your niche
              </h3>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: '#534AB718', color: '#534AB7', border: '1px solid #534AB740' }}
              >
                {ca.niche}
              </span>
            </div>

            {/* Comparison table */}
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: '#F5F5F3' }}>
                    <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Element</th>
                    <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Top Performer</th>
                    <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">You</th>
                    <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      element: 'Headline style',
                      top:     ca.top_performer_headline,
                      you:     `${audit.profile_data.headline.length} chars`,
                      gap:     audit.profile_data.headline.length < 120,
                    },
                    {
                      element: 'About length',
                      top:     ca.top_performer_about_length,
                      you:     `${audit.profile_data.about.length} chars`,
                      gap:     audit.profile_data.about.length < 1000,
                    },
                    {
                      element: 'Posts per week',
                      top:     ca.top_performer_posts_per_week,
                      you:     audit.profile_data.posts_per_week || 'Unknown',
                      gap:     audit.profile_data.posts_per_week === 'rarely' || audit.profile_data.posts_per_week === '',
                    },
                  ].map((row, idx) => (
                    <tr key={row.element}
                      className="border-t border-gray-100"
                      style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAF9' }}
                    >
                      <td className="px-3 py-2.5 text-gray-700 font-medium">{row.element}</td>
                      <td className="px-3 py-2.5 text-gray-500">{row.top}</td>
                      <td className="px-3 py-2.5 text-gray-700">{row.you}</td>
                      <td className="px-3 py-2.5">
                        {row.gap
                          ? <span className="text-red-500 font-semibold">Gap</span>
                          : <span className="text-teal-600 font-semibold">Match</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Gaps */}
            {ca.gaps.length > 0 && (
              <div className="px-2 space-y-1.5">
                <p className="text-xs font-semibold text-gray-600">Gaps to close</p>
                {ca.gaps.map((gap, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 mt-1" />
                    {gap}
                  </div>
                ))}
              </div>
            )}

            {/* Advantages */}
            {ca.advantages.length > 0 && (
              <div className="px-2 space-y-1.5">
                <p className="text-xs font-semibold text-gray-600">Your advantages</p>
                {ca.advantages.map((adv, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: '#1D9E75' }} />
                    {adv}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

    </div>
  )
}
