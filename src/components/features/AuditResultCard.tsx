'use client'

import { useRef, useState, useEffect } from 'react'
import { SHARE_COPY, getTierFromLevel } from '@/lib/auditConfig'
import { getInitials } from '@/lib/utils'
import type { AuditResult } from '@/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AuditResultCardProps {
  result:     AuditResult
  isUnlocked: boolean
  onReAudit?: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreBar({ earned, max, color }: { earned: number; max: number; color: string }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.round((earned / max) * 100)), 100)
    return () => clearTimeout(t)
  }, [earned, max])

  return (
    <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex-1">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ─── Section A — The shareable score card ─────────────────────────────────────

interface ScoreCardProps {
  result: AuditResult
  cardRef: React.RefObject<HTMLDivElement>
}

function ScoreCardSection({ result, cardRef }: ScoreCardProps) {
  const tier    = getTierFromLevel(result.tier_key)
  const tierColor = tier?.color ?? '#1D9E75'
  const tierBg    = tier?.bg ?? '#E1F5EE'

  const displayName = result.full_name || result.linkedin_username || 'LinkedIn User'
  const profileUrl  = `https://linkedin.com/in/${result.linkedin_username}`

  return (
    <div
      ref={cardRef}
      id="audit-score-card"
      style={{ width: '100%', maxWidth: 600, background: '#fff', borderRadius: 16,
               border: '1px solid #E5E4E0', overflow: 'hidden',
               boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
    >
      {/* Teal accent strip */}
      <div style={{ height: 8, background: '#1D9E75' }} />

      <div style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>

          {/* Profile section (left) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {result.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.profile_photo_url}
                alt={displayName}
                style={{ width: 64, height: 64, borderRadius: '50%', border: `3px solid ${tierColor}`, objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: tierBg, border: `3px solid ${tierColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 800, color: tierColor,
              }}>
                {getInitials(displayName)}
              </div>
            )}
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 700, color: '#0A2540' }}>
                {displayName}
              </p>
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}
              >
                linkedin.com/in/{result.linkedin_username}
              </a>
            </div>
          </div>

          {/* PostPika badge (top-right) */}
          <div style={{ fontSize: 11, fontWeight: 800, color: '#1D9E75', letterSpacing: '-0.5px', flexShrink: 0 }}>
            PostPika
          </div>
        </div>

        {/* Score section */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
            <span style={{ fontSize: 56, fontWeight: 800, color: tierColor, lineHeight: 1 }}>
              {result.total_score}
            </span>
            <span style={{ fontSize: 24, color: '#9ca3af', fontWeight: 400 }}>/100</span>
          </div>

          <div style={{
            display: 'inline-block', marginTop: 10,
            background: tierBg, color: tierColor,
            fontSize: 15, fontWeight: 700, padding: '6px 20px',
            borderRadius: 99, border: `1.5px solid ${tierColor}`,
          }}>
            {result.level_name}
          </div>

          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af' }}>
            {result.tier_label}
          </p>
        </div>
      </div>

      {/* Bottom strip */}
      <div style={{ background: '#1D9E75', padding: '10px 28px' }}>
        <p style={{ margin: 0, fontSize: 11, color: '#fff', textAlign: 'center' }}>
          linkedin.com/in/{result.linkedin_username} · PostPika Personal Brand Audit · postpika.com/audit
        </p>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuditResultCard({
  result,
  isUnlocked,
  onReAudit,
}: AuditResultCardProps) {
  const cardRef        = useRef<HTMLDivElement>(null)
  const [copied, setCopied]               = useState(false)
  const [expandedAction, setExpandedAction] = useState<number | null>(null)
  const [improvementOpen, setImprovementOpen] = useState(false)
  const [improvement, setImprovement]      = useState<{
    current_score: number
    target_score: number
    current_level: string
    next_level: string
    suggestions: { title: string; detail: string; dimension: string; points_gain: string }[]
  } | null>(null)
  const [loadingImprove, setLoadingImprove] = useState(false)

  const tier      = getTierFromLevel(result.tier_key)
  const tierColor = tier?.color ?? '#1D9E75'

  // ── Share copy ──────────────────────────────────────────────────────────────
  const shareCopyTemplate = SHARE_COPY[result.tier_key] ?? SHARE_COPY.ghost_mode
  const shareCopyText = shareCopyTemplate
    .replace('[LEVEL]', result.level_name)
    .replace('[SCORE]', String(result.total_score))

  async function copyLinkedInPost() {
    await navigator.clipboard.writeText(shareCopyText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function downloadCardImage() {
    if (!cardRef.current) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, logging: false })
      const link = document.createElement('a')
      link.download = `my-linkedin-audit-${result.total_score}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('html2canvas error', err)
    }
  }

  async function handleImprove() {
    if (improvement) { setImprovementOpen(true); return }
    setLoadingImprove(true)
    try {
      const res  = await fetch('/api/audit/improve', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ auditId: result.id }),
      })
      const data = await res.json()
      if (data.improvement) {
        setImprovement(data.improvement)
        setImprovementOpen(true)
      }
    } catch (err) {
      console.error('improve error', err)
    } finally {
      setLoadingImprove(false)
    }
  }

  // ── Blur overlay for locked sections ───────────────────────────────────────
  function BlurGate({ children }: { children: React.ReactNode }) {
    if (isUnlocked) return <>{children}</>
    return (
      <div className="relative">
        <div className="pointer-events-none select-none" style={{ filter: 'blur(8px)', userSelect: 'none' }}>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">

      {/* ── SECTION A: Score Card ─────────────────────────────────────────── */}
      <ScoreCardSection result={result} cardRef={cardRef} />

      {/* ── SECTION B: Dimension Breakdown ───────────────────────────────── */}
      <BlurGate>
        <div className="bg-white rounded-2xl border border-[#E5E4E0] p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
            Score Breakdown
          </h3>
          <div className="space-y-4">
            {result.dimension_scores.map((dim) => (
              <div key={dim.dimension}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-[#0A2540]">{dim.label}</span>
                  <span className="text-sm font-bold" style={{ color: tierColor }}>
                    {dim.earned} / {dim.max}
                  </span>
                </div>
                <ScoreBar earned={dim.earned} max={dim.max} color={tierColor} />
                {dim.feedback && (
                  <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{dim.feedback}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </BlurGate>

      {/* ── SECTION C: Top 3 Actions ──────────────────────────────────────── */}
      <BlurGate>
        <div className="bg-white rounded-2xl border border-[#E5E4E0] p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
            Your Top 3 Actions This Week
          </h3>
          <div className="space-y-3">
            {result.ai_top_actions.map((action, i) => (
              <div
                key={i}
                className="border border-gray-100 rounded-xl p-4 hover:border-[#1D9E75]/30 transition-colors cursor-pointer"
                onClick={() => setExpandedAction(expandedAction === i ? null : i)}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: tierColor }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#0A2540] leading-snug">{action}</p>
                    {expandedAction === i && (
                      <p className="mt-2 text-xs text-gray-500">
                        Take this action within the next 3 days for maximum impact on your score.
                      </p>
                    )}
                  </div>
                  <span className="text-gray-300 text-sm">{expandedAction === i ? '▲' : '▼'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </BlurGate>

      {/* ── SECTION D: Share Buttons ─────────────────────────────────────── */}
      <BlurGate>
        <div className="bg-white rounded-2xl border border-[#E5E4E0] p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-1">
            Share Your Score
          </h3>
          <p className="text-sm text-gray-500 mb-5">Challenge your network to beat your score.</p>

          <div className="space-y-4">
            {/* Copy LinkedIn post */}
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-bold text-[#0A2540] mb-2">
                📋 Copy LinkedIn Post
              </p>
              <textarea
                readOnly
                value={shareCopyText}
                rows={6}
                className="w-full text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 resize-none font-mono leading-relaxed"
              />
              <div className="mt-2 space-y-1">
                <button
                  onClick={copyLinkedInPost}
                  className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: copied ? '#0F6E56' : '#1D9E75' }}
                >
                  {copied ? '✓ Copied!' : 'Copy to clipboard'}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Paste directly into a new LinkedIn post
                </p>
              </div>
            </div>

            {/* Download card image */}
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-bold text-[#0A2540] mb-2">
                🖼 Download Score Card
              </p>
              <button
                onClick={downloadCardImage}
                className="w-full py-2 rounded-lg text-sm font-semibold bg-[#F1EFE8] text-[#0A2540] hover:bg-gray-200 transition-colors"
              >
                Download card as PNG
              </button>
              <p className="mt-1 text-xs text-gray-400 text-center">
                Upload this image to your LinkedIn post for maximum engagement
              </p>
            </div>

            {/* Get +5 points */}
            <button
              onClick={handleImprove}
              disabled={loadingImprove}
              className="w-full py-3 rounded-xl text-sm font-semibold border-2 transition-colors"
              style={{ borderColor: tierColor, color: tierColor }}
            >
              {loadingImprove ? 'Generating your plan...' : '⬆ Get +5 points — See my personalised plan'}
            </button>
          </div>
        </div>
      </BlurGate>

      {/* ── Improvement Modal ─────────────────────────────────────────────── */}
      {improvementOpen && improvement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setImprovementOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0A2540]">
                Your 5-Point Improvement Plan
              </h3>
              <button onClick={() => setImprovementOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-400">{improvement.current_score}</p>
                <p className="text-xs text-gray-400">Now</p>
              </div>
              <div className="flex-1 text-center text-[#1D9E75] font-bold">→</div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#1D9E75]">{improvement.target_score}</p>
                <p className="text-xs text-gray-400">Target</p>
              </div>
            </div>

            <div className="space-y-3">
              {improvement.suggestions.map((s, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <p className="text-sm font-bold text-[#0A2540] mb-1">{s.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">{s.detail}</p>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E6F1FB] text-[#185FA5]">
                      {s.dimension}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E1F5EE] text-[#0F6E56]">
                      +{s.points_gain} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION E: Re-audit ───────────────────────────────────────────── */}
      {isUnlocked && onReAudit && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Improvement tips will be sent to your email in 30 days. Want to re-audit now?
          </p>
          <button
            onClick={onReAudit}
            className="px-5 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600 hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors"
          >
            Re-audit my profile
          </button>
        </div>
      )}
    </div>
  )
}
