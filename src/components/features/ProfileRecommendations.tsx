'use client'

import { useState, useCallback } from 'react'
import {
  CheckCircle2, Circle, Copy, Check, RefreshCw,
  TrendingUp, Eye, MessageSquare, ChevronDown,
  ChevronUp, ExternalLink, Zap,
} from 'lucide-react'
import type { ProfileAuditData, ProfileRecommendation } from '@/types'
import { DIMENSION_CONFIG, DIMENSION_TIER_COLORS } from '@/lib/profileOptimizerConfig'
import { useToast } from '@/components/ui/Toast'

// Imported per spec — DIMENSION_TIER_COLORS used below in type-badge colours
void DIMENSION_TIER_COLORS

// ─── Local types ──────────────────────────────────────────────────────────────

type FilterType = 'all' | 'quick' | 'rewrites' | 'keywords' | 'actions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<ProfileRecommendation['priority'], number> = {
  high: 0, medium: 1, low: 2,
}

const PRIORITY_COLOR: Record<ProfileRecommendation['priority'], string> = {
  high: '#E24B4A', medium: '#BA7517', low: '#9CA3AF',
}

const PRIORITY_LABEL: Record<ProfileRecommendation['priority'], string> = {
  high: 'High Impact', medium: 'Medium', low: 'Low',
}

const TYPE_LABEL: Record<ProfileRecommendation['type'], string> = {
  rewrite: 'Rewrite', keyword: 'Keyword',
  structural: 'Action', seo: 'SEO', action: 'Action',
}

function getDimCfg(dimensionId: string) {
  return Object.values(DIMENSION_CONFIG).find((c) => c.id === dimensionId)
}

function verifyPlaceholder(dimensionId: string): string {
  if (dimensionId === 'headline')   return 'Paste your new headline here'
  if (dimensionId === 'about')      return 'Paste your updated About section'
  if (dimensionId === 'experience') return 'Paste your updated description'
  return 'Describe what you changed'
}

function sortRecs(recs: ProfileRecommendation[]) {
  return [...recs].sort((a, b) => {
    if (a.is_done !== b.is_done) return a.is_done ? 1 : -1
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  })
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  audit:                ProfileAuditData
  plan:                 string
  onRecommendationDone: (id: string, dimensionId: string, updatedText: string) => Promise<void>
  onAuditUpdate:        (updates: Partial<ProfileAuditData>) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileRecommendations({
  audit, plan, onRecommendationDone, onAuditUpdate,
}: Props) {
  const { toast } = useToast()

  const [activeFilter,  setActiveFilter]  = useState<FilterType>('all')
  const [expandedIds,   setExpandedIds]   = useState<Set<string>>(new Set())
  const [copiedIds,     setCopiedIds]     = useState<Set<string>>(new Set())
  const [verifyingId,   setVerifyingId]   = useState<string | null>(null)
  const [verifyTexts,   setVerifyTexts]   = useState<Record<string, string>>({})
  const [rescoringId,   setRescoringId]   = useState<string | null>(null)
  const [rewriteOpen,   setRewriteOpen]   = useState({ headline: true, about: false, experiences: false })

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const toggleExpanded = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })

  const handleCopy = useCallback((copyId: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedIds((prev) => { const s = new Set(Array.from(prev)); s.add(copyId); return s })
    setTimeout(() => {
      setCopiedIds((prev) => {
        const next = new Set(prev)
        next.delete(copyId)
        return next
      })
    }, 2000)
  }, [])

  const handleCircleClick = (rec: ProfileRecommendation) => {
    if (rec.is_done) return
    setExpandedIds((prev) => { const s = new Set(Array.from(prev)); s.add(rec.id); return s })
    setVerifyingId(rec.id)
  }

  const handleSkip = (rec: ProfileRecommendation) => {
    const updated = [...audit.completed_recommendations, rec.id]
    onAuditUpdate({ completed_recommendations: updated })
    setVerifyingId(null)
  }

  const handleVerify = useCallback(async (rec: ProfileRecommendation) => {
    setRescoringId(rec.id)
    try {
      await onRecommendationDone(rec.id, rec.dimension_id, verifyTexts[rec.id] ?? '')
      const cfg = getDimCfg(rec.dimension_id)
      toast.success(`Score updated for ${cfg?.label ?? rec.dimension_id}`)
    } finally {
      setVerifyingId(null)
      setRescoringId(null)
    }
  }, [onRecommendationDone, verifyTexts, toast])

  // ── Filter + sort ────────────────────────────────────────────────────────────

  // Derive is_done from completed_recommendations so card state is always in
  // sync with the audit's completion tracking (which is updated client-side).
  const completedSet = new Set(audit.completed_recommendations)
  const allRecs = audit.recommendations.map((r) =>
    completedSet.has(r.id) ? { ...r, is_done: true } : r,
  )
  const filtered = sortRecs(
    activeFilter === 'quick'    ? allRecs.filter((r) => r.priority === 'high') :
    activeFilter === 'rewrites' ? allRecs.filter((r) => r.type === 'rewrite') :
    activeFilter === 'keywords' ? allRecs.filter((r) => r.type === 'keyword') :
    activeFilter === 'actions'  ? allRecs.filter((r) => r.type === 'action' || r.type === 'structural') :
    allRecs,
  )
  const isFree    = plan === 'free'
  const displayed = isFree ? filtered.slice(0, 3) : filtered
  const isPaid    = !isFree

  // ── CopyButton helper ────────────────────────────────────────────────────────

  const CopyButton = ({ copyId, text, small = false }: { copyId: string; text: string; small?: boolean }) => {
    const copied = copiedIds.has(copyId)
    return (
      <button
        type="button"
        onClick={() => handleCopy(copyId, text)}
        className={`flex items-center gap-1.5 rounded-lg font-medium transition-all ${small ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs'}`}
        style={{
          background: copied ? '#E1F5EE' : '#F5F5F3',
          color:      copied ? '#0F6E56' : '#6B7280',
          border:     '1px solid #E5E4E0',
        }}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Header + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-800">
          Recommendations ({allRecs.length})
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {([
            { id: 'all',      label: 'All',        icon: null },
            { id: 'quick',    label: 'Quick wins',  icon: <Zap className="w-3 h-3" /> },
            { id: 'rewrites', label: 'Rewrites',    icon: null },
            { id: 'keywords', label: 'Keywords',    icon: null },
            { id: 'actions',  label: 'Actions',     icon: null },
          ] as { id: FilterType; label: string; icon: React.ReactNode }[]).map((f) => {
            const active = activeFilter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: active ? '#1D9E75' : '#F5F5F3',
                  color:      active ? '#FFFFFF' : '#6B7280',
                  border:     active ? '1px solid #1D9E75' : '1px solid #E5E4E0',
                }}
              >
                {f.icon}
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Recommendation cards */}
      <div className="space-y-2">
        {displayed.map((rec) => {
          const dimCfg    = getDimCfg(rec.dimension_id)
          const dimColor  = dimCfg?.color ?? '#9CA3AF'
          const isExpanded = expandedIds.has(rec.id)
          const isVerifying = verifyingId === rec.id
          const isRescoring = rescoringId === rec.id

          return (
            <div
              key={rec.id}
              className="rounded-lg border bg-white overflow-hidden transition-opacity"
              style={{
                borderLeft: `3px solid ${dimColor}`,
                borderTop: '1px solid #E5E4E0',
                borderRight: '1px solid #E5E4E0',
                borderBottom: '1px solid #E5E4E0',
                opacity: rec.is_done ? 0.55 : 1,
              }}
            >
              {/* Collapsed header row */}
              <div className="flex items-center gap-2 px-3 py-2.5 flex-wrap">

                {/* Done toggle */}
                <button
                  type="button"
                  onClick={() => handleCircleClick(rec)}
                  className="flex-shrink-0"
                  title={rec.is_done ? 'Done' : 'Mark as done'}
                >
                  {rec.is_done
                    ? <CheckCircle2 className="w-5 h-5" style={{ color: '#1D9E75' }} />
                    : <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400 transition-colors" />}
                </button>

                {/* Priority badge */}
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ color: PRIORITY_COLOR[rec.priority], background: `${PRIORITY_COLOR[rec.priority]}1A` }}
                >
                  {PRIORITY_LABEL[rec.priority]}
                </span>

                {/* Dimension badge */}
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:inline"
                  style={{ color: dimColor, background: `${dimColor}18` }}
                >
                  {dimCfg?.label ?? rec.dimension_id}
                </span>

                {/* Title */}
                <span className="flex-1 text-xs font-medium text-gray-700 min-w-0 truncate">
                  {rec.title}
                </span>

                {/* Type badge */}
                <span className="text-xs text-gray-400 flex-shrink-0 hidden md:block">
                  {TYPE_LABEL[rec.type]}
                </span>

                {/* Points pill */}
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: '#E1F5EE', color: '#0F6E56' }}
                >
                  +{rec.estimated_points} pts
                </span>

                {/* Expand toggle */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(rec.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4" />
                    : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">

                  {/* Current state */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current state</p>
                    <p className="text-xs italic text-gray-600 bg-gray-50 rounded-lg px-3 py-2.5">
                      {rec.current_state}
                    </p>
                  </div>

                  {/* Why weak */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Why this is holding you back
                    </p>
                    <p className="text-xs text-gray-600">{rec.why_weak}</p>
                  </div>

                  {/* What to do */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">What to do</p>
                    <p className="text-xs font-semibold text-gray-800">{rec.recommended_action}</p>
                  </div>

                  {/* Rewritten content */}
                  {rec.rewritten_content && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Ready to paste into LinkedIn
                      </p>
                      <div className="relative rounded-lg border border-gray-200 bg-white px-3 py-3 pr-16">
                        <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {rec.rewritten_content}
                        </p>
                        <div className="absolute top-2 right-2">
                          <CopyButton copyId={`rc-${rec.id}`} text={rec.rewritten_content} small />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alternatives */}
                  {rec.alternatives && rec.alternatives.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Alternative versions
                      </p>
                      {rec.alternatives.map((alt, i) => (
                        <div key={i} className="relative rounded-lg border border-gray-200 bg-white px-3 py-3 pr-16">
                          <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{alt}</p>
                          <div className="absolute top-2 right-2">
                            <CopyButton copyId={`alt-${rec.id}-${i}`} text={alt} small />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SEO impact */}
                  <div
                    className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs"
                    style={{ background: '#E1F5EE', borderLeft: '3px solid #1D9E75' }}
                  >
                    <TrendingUp className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#1D9E75' }} />
                    <p className="text-gray-700">{rec.seo_impact}</p>
                  </div>

                  {/* Projected impact */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Projected impact</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { icon: <Eye className="w-3.5 h-3.5" />,           label: 'Views',    value: rec.projected_views_increase    },
                        { icon: <TrendingUp className="w-3.5 h-3.5" />,    label: 'Reach',    value: rec.projected_reach_increase    },
                        { icon: <MessageSquare className="w-3.5 h-3.5" />, label: 'Messages', value: rec.projected_messages_increase },
                      ].map(({ icon, label, value }) => (
                        <div
                          key={label}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
                          style={{ background: '#F5F5F3', border: '1px solid #E5E4E0' }}
                        >
                          <span className="text-gray-400">{icon}</span>
                          <span className="text-gray-500 font-medium">{label}:</span>
                          <span className="text-gray-700">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Where to apply */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    {rec.linkedin_where_to_apply}
                  </div>

                  {/* Verification panel */}
                  {isVerifying && (
                    <div
                      className="rounded-xl p-4 space-y-3 mt-2"
                      style={{ background: '#F0FDF9', border: '1.5px solid #1D9E75' }}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Confirm your update</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Paste your updated {dimCfg?.label ?? rec.dimension_id} below so PostPika
                          can verify your improvement and update your score.
                        </p>
                      </div>
                      <textarea
                        rows={4}
                        value={verifyTexts[rec.id] ?? ''}
                        onChange={(e) => setVerifyTexts((prev) => ({ ...prev, [rec.id]: e.target.value }))}
                        placeholder={verifyPlaceholder(rec.dimension_id)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!verifyTexts[rec.id]?.trim() || isRescoring}
                          onClick={() => handleVerify(rec)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: !verifyTexts[rec.id]?.trim() || isRescoring ? '#E5E4E0' : '#1D9E75',
                            color:      !verifyTexts[rec.id]?.trim() || isRescoring ? '#9CA3AF' : '#FFFFFF',
                          }}
                        >
                          {isRescoring
                            ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating score...</>
                            : 'Verify and update score'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSkip(rec)}
                          className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
                        >
                          Skip verification
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Free plan upgrade banner */}
      {isFree && allRecs.length > 3 && (
        <div
          className="rounded-xl px-5 py-4 flex items-center justify-between gap-4"
          style={{ background: '#FFFBEB', border: '1.5px solid #BA7517' }}
        >
          <p className="text-sm text-amber-800">
            See all <strong>{allRecs.length}</strong> recommendations with full rewritten copy
            and keyword research
          </p>
          <a
            href="/pricing"
            className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: '#BA7517' }}
          >
            Upgrade to Starter →
          </a>
        </div>
      )}

      {/* ── Rewritten sections (Starter+) ─────────────────────────────────────── */}
      {isPaid && (
        <div className="space-y-3 pt-2">

          {/* Rewritten headline options */}
          {audit.rewritten_headline.length > 0 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setRewriteOpen((p) => ({ ...p, headline: !p.headline }))}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Your rewritten headline options
                {rewriteOpen.headline ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {rewriteOpen.headline && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-4">
                  {audit.rewritten_headline.map((h, i) => (
                    <div key={i} className="relative rounded-lg border border-gray-200 bg-white px-3 py-3 pr-20">
                      <p className="text-sm text-gray-800">{h}</p>
                      <div className="absolute top-2 right-2">
                        <CopyButton copyId={`hl-${i}`} text={h} small />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rewritten About section */}
          {audit.rewritten_about && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setRewriteOpen((p) => ({ ...p, about: !p.about }))}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Your rewritten About section
                {rewriteOpen.about ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {rewriteOpen.about && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-4">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 max-h-64 overflow-y-auto">
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed select-text">
                      {audit.rewritten_about}
                    </p>
                  </div>
                  <CopyButton copyId="about-rewrite" text={audit.rewritten_about} />
                </div>
              )}
            </div>
          )}

          {/* Rewritten experiences */}
          {audit.rewritten_experiences.length > 0 && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setRewriteOpen((p) => ({ ...p, experiences: !p.experiences }))}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Your rewritten experience descriptions
                {rewriteOpen.experiences ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {rewriteOpen.experiences && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                  {audit.rewritten_experiences.map((exp, i) => (
                    <div key={i} className="space-y-2">
                      <p className="text-xs font-semibold text-gray-600">
                        {exp.title} — {exp.company}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-400">Before</p>
                          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                            <p className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">{exp.original}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-400">After</p>
                          <div className="rounded-lg border border-teal-200 bg-white px-3 py-2.5">
                            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{exp.rewritten}</p>
                          </div>
                        </div>
                      </div>
                      <CopyButton copyId={`exp-${i}`} text={exp.rewritten} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Keyword recommendations (Starter+) ─────────────────────────────────── */}
      {isPaid && audit.keyword_recommendations.length > 0 && (
        <div className="space-y-3 pt-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Your {audit.keyword_recommendations.length} LinkedIn search keywords
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Add these to specific profile sections for maximum search visibility
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: '#F5F5F3' }}>
                  <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Keyword</th>
                  <th className="text-left px-3 py-2.5 text-gray-500 font-semibold hidden sm:table-cell">Monthly Searches</th>
                  <th className="text-left px-3 py-2.5 text-gray-500 font-semibold hidden md:table-cell">Where to Add</th>
                  <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Status</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {audit.keyword_recommendations.map((kw, i) => (
                  <tr
                    key={kw.keyword}
                    className="border-t border-gray-100"
                    style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAFAF9' }}
                  >
                    <td className="px-3 py-2.5 font-medium text-gray-800">{kw.keyword}</td>
                    <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell">
                      {kw.estimated_monthly_searches}
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {kw.placement.map((p) => (
                          <span
                            key={p}
                            className="px-1.5 py-0.5 rounded text-xs"
                            style={{ background: '#F0F0EE', color: '#6B7280' }}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {kw.current_in_profile
                        ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                            Already in profile
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: '#FFFBEB', color: '#BA7517' }}>
                            Missing
                          </span>
                        )}
                    </td>
                    <td className="px-2 py-2.5">
                      <CopyButton copyId={`kw-${kw.keyword}`} text={kw.keyword} small />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
