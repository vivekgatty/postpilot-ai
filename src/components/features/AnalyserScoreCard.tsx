'use client'

import { useState, useEffect } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  ANALYSIS_DIMENSIONS,
  getGradeFromScore,
} from '@/lib/analyserConfig'
import type { PostAnalysis, AnalysisDimension } from '@/types'
import {
  Lock,
  TrendingUp,
  Zap,
  AlignLeft,
  Lightbulb,
  MessageSquare,
  Heart,
  Target,
  Smile,
  Clock,
  Crosshair,
} from 'lucide-react'

// ─── Lucide icon map ──────────────────────────────────────────────────────────

const _ICON_MAP: Record<string, React.ReactNode> = {
  Zap:        <Zap        className="w-3.5 h-3.5" />,
  AlignLeft:  <AlignLeft  className="w-3.5 h-3.5" />,
  Lightbulb:  <Lightbulb  className="w-3.5 h-3.5" />,
  MessageSquare: <MessageSquare className="w-3.5 h-3.5" />,
  Heart:      <Heart      className="w-3.5 h-3.5" />,
  Target:     <Target     className="w-3.5 h-3.5" />,
  Smile:      <Smile      className="w-3.5 h-3.5" />,
  TrendingUp: <TrendingUp className="w-3.5 h-3.5" />,
  Crosshair:  <Crosshair  className="w-3.5 h-3.5" />,
  Clock:      <Clock      className="w-3.5 h-3.5" />,
}

// ─── Grade badge colours ──────────────────────────────────────────────────────

const GRADE_BADGE: Record<AnalysisDimension['grade'], { bg: string; text: string; border: string; bar: string }> = {
  excellent: { bg: '#E1F5EE', text: '#0F6E56', border: '#1D9E7540', bar: '#1D9E75' },
  strong:    { bg: '#EEF2FF', text: '#3730A3', border: '#4F46E540', bar: '#4F46E5' },
  average:   { bg: '#FEF3C7', text: '#92400E', border: '#D9770640', bar: '#D97706' },
  weak:      { bg: '#FFEDD5', text: '#9A3412', border: '#EA580C40', bar: '#EA580C' },
  poor:      { bg: '#FEE2E2', text: '#991B1B', border: '#EF444440', bar: '#EF4444' },
}

// ─── Animated progress bar ────────────────────────────────────────────────────

function AnimatedBar({ percentage, color }: { percentage: number; color: string }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(percentage), 100)
    return () => clearTimeout(t)
  }, [percentage])
  return (
    <div className="h-1.5 rounded-full overflow-hidden w-full" style={{ background: '#F0F0EE' }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${width}%`, backgroundColor: color, transition: 'width 0.6s ease' }}
      />
    </div>
  )
}

// ─── Grade badge ──────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: AnalysisDimension['grade'] }) {
  const c = GRADE_BADGE[grade]
  const labels: Record<AnalysisDimension['grade'], string> = {
    excellent: 'Excellent', strong: 'Strong', average: 'Average', weak: 'Weak', poor: 'Poor',
  }
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {labels[grade]}
    </span>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  analysis: PostAnalysis
  plan: string
  onViewDimension: (dimensionId: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnalyserScoreCard({ analysis, plan, onViewDimension }: Props) {
  const gradeObj = getGradeFromScore(analysis.overall_score)

  // Radar data
  const radarData = Object.values(analysis.dimension_scores).map(d => ({
    dimension: d.label.split(' ')[0],
    score: d.percentage,
    fullMark: 100,
  }))

  // Sorted dimensions — weakest first
  const sortedDimensions = Object.values(analysis.dimension_scores)
    .slice()
    .sort((a, b) => a.percentage - b.percentage)

  // Free plan — only show hook + readability unlocked
  const FREE_UNLOCKED = new Set(['hook', 'readability'])

  // Character count colour
  const cc = analysis.dimension_scores['algorithm']
  const charCount = Object.values(analysis.dimension_scores).length > 0
    ? (analysis.post_content?.length ?? 0)
    : 0
  const charColor =
    charCount >= 800 && charCount <= 1500 ? '#1D9E75'
    : charCount >= 500 ? '#D97706'
    : '#EF4444'

  const hashtagDim = analysis.dimension_scores['algorithm']
  const hashtags = hashtagDim ? 0 : 0 // populated from actual content; show via det data if available
  void cc
  void hashtags

  return (
    <div className="space-y-5">

      {/* ── Section A — Score hero ──────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 text-center space-y-2"
        style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
      >
        <div
          className="font-extrabold leading-none"
          style={{ fontSize: 80, color: gradeObj.color }}
        >
          {gradeObj.grade}
        </div>

        <div className="text-2xl font-bold text-gray-700">
          {analysis.overall_score}/100
        </div>

        <p className="text-sm font-semibold" style={{ color: gradeObj.color }}>
          {gradeObj.label}
        </p>

        <p className="text-xs text-gray-400 max-w-xs mx-auto">{gradeObj.description}</p>

        {analysis.improved_score !== undefined &&
          analysis.improved_score > analysis.overall_score && (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mx-auto"
            style={{ background: '#E1F5EE', color: '#0F6E56', border: '1px solid #1D9E75' }}
          >
            <TrendingUp className="w-3.5 h-3.5" style={{ animation: 'pulse 2s infinite' }} />
            {analysis.overall_score} → {analysis.improved_score}
            <span className="ml-1 text-gray-500 font-normal">Score after improvements</span>
          </div>
        )}
      </div>

      {/* ── Section B — Radar chart ─────────────────────────────────────────── */}
      {plan === 'free' ? (
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-2 px-2">Score breakdown</h3>
          {/* Blurred placeholder */}
          <div className="h-[300px] rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: '#F5F5F3', border: '1px solid #E5E4E0' }}
              >
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">
                Score breakdown — Starter plan
              </p>
              <a
                href="/pricing"
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                style={{ background: '#1D9E75' }}
              >
                Upgrade to unlock
              </a>
            </div>
            <div className="opacity-10 pointer-events-none filter blur-sm h-full w-full">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid gridType="polygon" stroke="#E5E4E0" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} />
                  <Radar dataKey="score" stroke="#1D9E75" fill="#1D9E75" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-4"
          style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-2 px-2">Score breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
              <PolarGrid gridType="polygon" stroke="#E5E4E0" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: '#6B7280' }} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#1D9E75"
                fill="#1D9E75"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Score']}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Section C — Dimension bars ──────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 space-y-1"
        style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
      >
        <h3 className="text-sm font-semibold text-gray-700 mb-3 px-2">Dimension breakdown</h3>

        {sortedDimensions.map(d => {
          const dimCfg = ANALYSIS_DIMENSIONS[d.id as keyof typeof ANALYSIS_DIMENSIONS]
          const locked = plan === 'free' && !FREE_UNLOCKED.has(d.id)
          const barColor = locked ? '#D1D5DB' : GRADE_BADGE[d.grade].bar
          const dotColor = dimCfg?.color ?? '#9CA3AF'

          return (
            <button
              key={d.id}
              type="button"
              onClick={() => !locked && onViewDimension(d.id)}
              disabled={locked}
              className="w-full flex flex-col gap-1 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: locked ? '#D1D5DB' : dotColor }}
                />
                <span className="text-xs font-medium text-gray-700 flex-1 truncate">
                  {d.label}
                </span>
                <span className="text-xs text-gray-400">{d.score}/{d.max_score}</span>
                {locked ? (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: '#F3F4F6', color: '#9CA3AF', border: '1px solid #E5E7EB' }}
                  >
                    Starter
                  </span>
                ) : (
                  <GradeBadge grade={d.grade} />
                )}
              </div>
              <AnimatedBar percentage={locked ? 0 : d.percentage} color={barColor} />
            </button>
          )
        })}
      </div>

      {/* ── Section D — Quick stats strip ──────────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
      >
        <h3 className="text-sm font-semibold text-gray-700 mb-3 px-2">Post signals</h3>
        <div className="flex flex-wrap gap-2 px-2">
          {/* Character count */}
          <span
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: `${charColor}18`, color: charColor, border: `1px solid ${charColor}40` }}
          >
            {charCount} chars
          </span>

          {/* Hashtags — derive from content */}
          {(() => {
            const count = (analysis.post_content?.match(/#\w+/g) ?? []).length
            const hColor = count >= 3 && count <= 5 ? '#1D9E75' : count === 0 ? '#9CA3AF' : '#D97706'
            return (
              <span
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: `${hColor}18`, color: hColor, border: `1px solid ${hColor}40` }}
              >
                #{count} hashtags
              </span>
            )
          })()}

          {/* External link */}
          {(() => {
            const hasLink = /https?:\/\/(?!linkedin\.com\/in\/)/.test(analysis.post_content ?? '')
            const lColor = hasLink ? '#EF4444' : '#1D9E75'
            return (
              <span
                className="px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: `${lColor}18`, color: lColor, border: `1px solid ${lColor}40` }}
              >
                {hasLink ? '⚠ External link' : 'No external links'}
              </span>
            )
          })()}
        </div>
      </div>

    </div>
  )
}
