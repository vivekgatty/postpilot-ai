'use client'

import { useState } from 'react'
import {
  Copy, Check, ChevronDown, ChevronUp, Zap,
  RefreshCw, CheckCircle2, Circle, MessageSquare,
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import type { PostAnalysis, AnalysisSuggestion } from '@/types'
import { ANALYSIS_DIMENSIONS } from '@/lib/analyserConfig'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  analysis: PostAnalysis
  plan: string
  onApplySuggestion: (suggestion: AnalysisSuggestion, newContent: string) => void
  onReanalyse: () => void
  isReanalysing: boolean
  currentContent: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function replaceFirstLine(content: string, newLine: string): string {
  const lines = content.split('\n')
  const firstNonEmpty = lines.findIndex(l => l.trim() !== '')
  if (firstNonEmpty === -1) return content
  lines[firstNonEmpty] = newLine
  return lines.join('\n')
}

function replaceLastLine(content: string, newLine: string): string {
  const lines = content.split('\n')
  let lastNonEmpty = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() !== '') { lastNonEmpty = i; break }
  }
  if (lastNonEmpty === -1) return content
  lines[lastNonEmpty] = newLine
  return lines.join('\n')
}

async function copyToClipboard(text: string) {
  try { await navigator.clipboard.writeText(text) } catch { /* noop */ }
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text, id, copiedId, setCopiedId }: {
  text: string
  id: string
  copiedId: string | null
  setCopiedId: (id: string | null) => void
}) {
  const copied = copiedId === id
  return (
    <button
      type="button"
      onClick={async () => {
        await copyToClipboard(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
      style={
        copied
          ? { background: '#E1F5EE', color: '#0F6E56', borderColor: '#1D9E7540' }
          : { background: '#F5F5F3', color: '#6B7280', borderColor: '#E5E4E0' }
      }
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnalyserSuggestions({
  analysis,
  plan,
  onApplySuggestion,
  onReanalyse,
  isReanalysing,
  currentContent,
}: Props) {
  const { toast } = useToast()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [appliedLocally, setAppliedLocally] = useState<Set<string>>(new Set())

  function toggleExpanded(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function isApplied(s: AnalysisSuggestion) {
    return s.is_applied || appliedLocally.has(s.id)
  }

  // Hook alternatives visibility
  const hookDim = analysis.dimension_scores['hook']
  const showHookAlts =
    analysis.hook_alternatives.length > 0 &&
    hookDim !== undefined &&
    hookDim.percentage < 70

  // CTA alternatives visibility
  const ctaDim = analysis.dimension_scores['cta']
  const showCtaAlts =
    analysis.cta_alternatives.length > 0 &&
    ctaDim !== undefined &&
    ctaDim.percentage < 70

  // Suggestions split
  const allSuggestions = analysis.suggestions ?? []
  const visibleSuggestions =
    plan === 'free' ? allSuggestions.slice(0, 1) : allSuggestions
  const hasLockedSuggestions = plan === 'free' && allSuggestions.length > 1

  // Sort: not-applied first, applied last
  const sorted = [...visibleSuggestions].sort((a, b) => {
    const aApplied = isApplied(a) ? 1 : 0
    const bApplied = isApplied(b) ? 1 : 0
    return aApplied - bApplied
  })

  // Re-analyse button visibility
  const anyApplied =
    allSuggestions.some(s => s.is_applied) || appliedLocally.size > 0
  const showReanalyse = anyApplied

  function handleApplySuggestion(s: AnalysisSuggestion, newContent: string) {
    setAppliedLocally(prev => new Set(prev).add(s.id))
    onApplySuggestion(s, newContent)
  }

  function buildNewContent(s: AnalysisSuggestion): string | null {
    if (!s.rewritten_content) return null
    if (s.type === 'hook_rewrite') return replaceFirstLine(currentContent, s.rewritten_content)
    if (s.type === 'cta_rewrite') return replaceLastLine(currentContent, s.rewritten_content)
    if (s.type === 'format_fix') return s.rewritten_content
    return null // general / others — copy only
  }

  return (
    <div className="space-y-5">

      {/* ── Section A — Hook alternatives ───────────────────────────────────── */}
      {showHookAlts && (
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: '#1D9E75' }} />
            <span className="text-sm font-semibold text-gray-700">Alternative hooks</span>
          </div>
          <p className="text-xs text-gray-400">Replace your first line with one of these:</p>

          <div className="space-y-3">
            {analysis.hook_alternatives.map((alt, i) => {
              const copyId = `hook-alt-${i}`
              return (
                <div
                  key={i}
                  className="rounded-xl p-3 space-y-2"
                  style={{
                    background: '#FFFBEB',
                    borderLeft: '2px solid #D97706',
                    border: '1px solid #FEF3C7',
                    borderLeftWidth: '3px',
                    borderLeftColor: '#D97706',
                  }}
                >
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{alt}</p>
                  <div className="flex gap-2">
                    <CopyButton text={alt} id={copyId} copiedId={copiedId} setCopiedId={setCopiedId} />
                    <button
                      type="button"
                      onClick={() => {
                        const newContent = replaceFirstLine(currentContent, alt)
                        const fakeSuggestion: AnalysisSuggestion = {
                          id: copyId,
                          dimension_id: 'hook',
                          type: 'hook_rewrite',
                          title: 'Alternative hook applied',
                          problem: '',
                          suggestion: alt,
                          rewritten_content: alt,
                          estimated_points_gain: 0,
                          is_applied: false,
                        }
                        handleApplySuggestion(fakeSuggestion, newContent)
                        toast.success('Hook applied to post')
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                      style={{ background: 'transparent', color: '#1D9E75', borderColor: '#1D9E7540' }}
                    >
                      Apply this hook
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Section B — CTA alternatives ────────────────────────────────────── */}
      {showCtaAlts && (
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" style={{ color: '#185FA5' }} />
            <span className="text-sm font-semibold text-gray-700">Alternative CTAs</span>
          </div>
          <p className="text-xs text-gray-400">Replace your closing question with one of these:</p>

          <div className="space-y-3">
            {analysis.cta_alternatives.map((alt, i) => {
              const copyId = `cta-alt-${i}`
              return (
                <div
                  key={i}
                  className="rounded-xl p-3 space-y-2"
                  style={{
                    background: '#EFF6FF',
                    border: '1px solid #DBEAFE',
                    borderLeftWidth: '3px',
                    borderLeftColor: '#185FA5',
                  }}
                >
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{alt}</p>
                  <div className="flex gap-2">
                    <CopyButton text={alt} id={copyId} copiedId={copiedId} setCopiedId={setCopiedId} />
                    <button
                      type="button"
                      onClick={() => {
                        const newContent = replaceLastLine(currentContent, alt)
                        const fakeSuggestion: AnalysisSuggestion = {
                          id: copyId,
                          dimension_id: 'cta',
                          type: 'cta_rewrite',
                          title: 'Alternative CTA applied',
                          problem: '',
                          suggestion: alt,
                          rewritten_content: alt,
                          estimated_points_gain: 0,
                          is_applied: false,
                        }
                        handleApplySuggestion(fakeSuggestion, newContent)
                        toast.success('CTA applied to post')
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                      style={{ background: 'transparent', color: '#185FA5', borderColor: '#185FA540' }}
                    >
                      Apply this CTA
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Section C — Improvement suggestions ─────────────────────────────── */}
      <div
        className="rounded-2xl p-5 space-y-3"
        style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-0.5">
          <span className="text-sm font-semibold text-gray-700">
            Improvements
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: '#E1F5EE', color: '#0F6E56' }}
          >
            {allSuggestions.length}
          </span>
        </div>

        {/* Suggestion cards */}
        <div className="space-y-2">
          {sorted.map(s => {
            const applied = isApplied(s)
            const expanded = expandedIds.has(s.id) && !applied
            const dimCfg = ANALYSIS_DIMENSIONS[s.dimension_id as keyof typeof ANALYSIS_DIMENSIONS]
            const dotColor = dimCfg?.color ?? '#9CA3AF'
            const newContent = buildNewContent(s)
            const canAutoApply = newContent !== null

            return (
              <div
                key={s.id}
                className="rounded-xl overflow-hidden"
                style={{
                  border: '1px solid #E5E4E0',
                  opacity: applied ? 0.5 : 1,
                }}
              >
                {/* Collapsed row */}
                <button
                  type="button"
                  disabled={applied}
                  onClick={() => !applied && toggleExpanded(s.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors disabled:cursor-default"
                >
                  {applied
                    ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#1D9E75' }} />
                    : <Circle className="w-4 h-4 flex-shrink-0 text-gray-300" />
                  }

                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: dotColor }}
                  />

                  <span className="text-xs font-medium text-gray-700 flex-1 truncate">
                    {s.title}
                  </span>

                  {/* Dimension badge */}
                  {dimCfg && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap hidden sm:inline"
                      style={{
                        background: `${dotColor}18`,
                        color: dotColor,
                        border: `1px solid ${dotColor}40`,
                      }}
                    >
                      {dimCfg.label.split(' ')[0]}
                    </span>
                  )}

                  {/* Points gain */}
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0"
                    style={{ background: '#E1F5EE', color: '#0F6E56' }}
                  >
                    +{s.estimated_points_gain} pts
                  </span>

                  {applied ? (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: '#E1F5EE', color: '#0F6E56' }}
                    >
                      Applied
                    </span>
                  ) : (
                    expanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* Expanded content */}
                {expanded && (
                  <div className="px-3 pb-4 space-y-3 border-t border-gray-100 pt-3">
                    {/* Problem */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">The problem:</p>
                      <p
                        className="text-xs text-gray-500 italic leading-relaxed rounded-lg px-3 py-2"
                        style={{ background: '#F5F5F3' }}
                      >
                        {s.problem}
                      </p>
                    </div>

                    {/* What to do */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">What to do:</p>
                      <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                        {s.suggestion}
                      </p>
                    </div>

                    {/* Rewritten content */}
                    {s.rewritten_content && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Ready to apply:</p>
                        <div
                          className="text-xs text-gray-700 leading-relaxed rounded-lg px-3 py-2 mb-2 whitespace-pre-wrap font-mono"
                          style={{ background: '#F5F5F3', border: '1px solid #E5E4E0' }}
                        >
                          {s.rewritten_content}
                        </div>
                        <div className="flex gap-2">
                          <CopyButton
                            text={s.rewritten_content}
                            id={`rewrite-${s.id}`}
                            copiedId={copiedId}
                            setCopiedId={setCopiedId}
                          />
                          {canAutoApply ? (
                            <button
                              type="button"
                              onClick={() => {
                                handleApplySuggestion(s, newContent!)
                                toast.success('Applied to post')
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                              style={{ background: '#1D9E75' }}
                            >
                              Apply to post
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 self-center">
                              Copy and paste manually
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Alternatives */}
                    {s.alternatives && s.alternatives.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">More options:</p>
                        <div className="flex flex-wrap gap-2">
                          {s.alternatives.map((alt, ai) => {
                            const altId = `alt-${s.id}-${ai}`
                            return (
                              <div
                                key={ai}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-600"
                                style={{ background: '#F5F5F3', border: '1px solid #E5E4E0' }}
                              >
                                <span className="truncate max-w-[200px]">{alt}</span>
                                <CopyButton
                                  text={alt}
                                  id={altId}
                                  copiedId={copiedId}
                                  setCopiedId={setCopiedId}
                                />
                              </div>
                            )
                          })}
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
        {hasLockedSuggestions && (
          <div
            className="rounded-xl p-4 text-center space-y-2"
            style={{ background: '#FAFAF9', border: '1px dashed #D1D5DB' }}
          >
            <p className="text-xs font-semibold text-gray-600">
              +{allSuggestions.length - 1} more improvements locked
            </p>
            <p className="text-xs text-gray-400">
              Upgrade to Starter to see all suggestions and apply them to your post.
            </p>
            <a
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white"
              style={{ background: '#1D9E75' }}
            >
              Upgrade to Starter
            </a>
          </div>
        )}
      </div>

      {/* ── Section D — Re-analyse button ───────────────────────────────────── */}
      {showReanalyse && (
        <button
          type="button"
          onClick={() => {
            if (plan === 'free') {
              window.location.href = '/pricing'
              return
            }
            onReanalyse()
          }}
          disabled={isReanalysing}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-60"
          style={{ background: 'transparent', color: '#1D9E75', borderColor: '#1D9E7540' }}
        >
          <RefreshCw className={`w-4 h-4 ${isReanalysing ? 'animate-spin' : ''}`} />
          {isReanalysing ? 'Re-analysing…' : 'Re-analyse with improvements'}
        </button>
      )}

    </div>
  )
}
