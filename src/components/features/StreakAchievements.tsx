'use client'

import { useRef, useState } from 'react'
import { Share2, Lock, X, Download, Copy, Check } from 'lucide-react'
import { PUBLISH_MILESTONES, COMBO_ACHIEVEMENTS } from '@/lib/streakConfig'
import type { StreakAchievement } from '@/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  achievements:       StreakAchievement[]
  currentStreak:      number
  plan:               string
  onShareAchievement: (achievement: StreakAchievement) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_MILESTONES = [...PUBLISH_MILESTONES, ...COMBO_ACHIEVEMENTS]

function getIcon(key: string): string {
  return ALL_MILESTONES.find(m => m.key === key)?.icon ?? '🏅'
}

function getDescription(key: string): string {
  return ALL_MILESTONES.find(m => m.key === key)?.description ?? ''
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ─── Share card modal ─────────────────────────────────────────────────────────

interface ShareModalProps {
  achievement: StreakAchievement
  onClose:     () => void
}

function ShareModal({ achievement, onClose }: ShareModalProps) {
  const cardRef          = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const icon        = getIcon(achievement.achievement_key)
  const description = getDescription(achievement.achievement_key)

  // LinkedIn post copy text
  const postText = [
    `Just earned '${achievement.achievement_label}' on PostPika!`,
    `${achievement.milestone_value ?? ''} days of consistent LinkedIn presence. The streak continues. 🔥`,
    `What's your longest LinkedIn streak?`,
    `#LinkedInConsistency #PostPika`,
  ].filter(Boolean).join('\n')

  async function handleDownload() {
    if (!cardRef.current) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas      = await html2canvas(cardRef.current, { scale: 2, useCORS: true })
      const link        = document.createElement('a')
      link.download     = `${achievement.achievement_key}.png`
      link.href         = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('[ShareModal] html2canvas error', err)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(postText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-base">Share your achievement</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Shareable card preview */}
        <div className="p-6">
          <div
            ref={cardRef}
            className="rounded-xl overflow-hidden border border-gray-100"
            style={{ width: '100%', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
          >
            {/* Card body */}
            <div className="bg-white px-8 py-8 text-center">
              {/* Logo top-right */}
              <div className="flex justify-end mb-2">
                <span className="text-[11px] font-bold text-[#1D9E75] tracking-wide uppercase">
                  PostPika
                </span>
              </div>

              {/* Icon */}
              <div className="text-[80px] leading-none mb-4 select-none">{icon}</div>

              {/* Label */}
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {achievement.achievement_label}
              </div>

              {/* Description */}
              {description && (
                <div className="text-base text-gray-500 mb-4 leading-snug max-w-xs mx-auto">
                  {description}
                </div>
              )}

              <div className="text-sm text-gray-400 mb-4">Maintained on LinkedIn</div>

              {/* Streak badge */}
              {achievement.milestone_value ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FEF3C7] rounded-full">
                  <span className="text-lg">🔥</span>
                  <span className="text-lg font-bold text-gray-900">
                    {achievement.milestone_value} days
                  </span>
                </div>
              ) : null}
            </div>

            {/* Bottom teal strip */}
            <div className="bg-[#1D9E75] px-6 py-3 text-center">
              <p className="text-white text-[12px] font-medium">
                PostPika Streak Tracker · postpika.com/streak
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={handleDownload}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1D9E75] text-white text-sm font-semibold hover:bg-[#18876A] transition-colors"
          >
            <Download size={15} />
            Download card
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy LinkedIn post'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-[#1D9E75] transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function StreakAchievements({
  achievements,
  currentStreak,
  plan,
  onShareAchievement,
}: Props) {
  const [shareTarget, setShareTarget] = useState<StreakAchievement | null>(null)
  const canShare   = ['pro', 'agency'].includes(plan)
  const earnedKeys = new Set(achievements.map(a => a.achievement_key))

  // Sort earned: newest first
  const sorted = [...achievements].sort(
    (a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime(),
  )

  // Next 3 unearned publish milestones for locked section
  const lockedMilestones = PUBLISH_MILESTONES
    .filter(m => !earnedKeys.has(m.key))
    .slice(0, 3)

  function handleShare(ach: StreakAchievement) {
    setShareTarget(ach)
    onShareAchievement(ach)
  }

  return (
    <>
      {/* ── Earned achievements ─────────────────────────────────────── */}
      <section className="mb-8">
        <h3 className="text-base font-bold text-gray-900 mb-4">
          Your achievements ({achievements.length})
        </h3>

        {sorted.length === 0 ? (
          <p className="text-sm text-gray-400">
            No achievements yet — keep your streak alive to earn your first!
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {sorted.map(ach => {
              const icon        = getIcon(ach.achievement_key)
              const description = getDescription(ach.achievement_key)
              return (
                <div
                  key={ach.id}
                  className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm flex flex-col relative"
                >
                  {/* Icon */}
                  <span className="text-3xl mb-2 select-none">{icon}</span>

                  {/* Label */}
                  <span className="text-[13px] font-bold text-gray-900 mb-0.5 leading-tight">
                    {ach.achievement_label}
                  </span>

                  {/* Earned date */}
                  <span className="text-[11px] text-gray-400 mb-1">
                    {formatDate(ach.earned_at)}
                  </span>

                  {/* Description */}
                  {description && (
                    <span className="text-[11px] text-gray-400 leading-snug flex-1">
                      {description}
                    </span>
                  )}

                  {/* Share button */}
                  <div className="flex justify-end mt-3">
                    {canShare ? (
                      <button
                        onClick={() => handleShare(ach)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1D9E75] hover:text-[#0F6E56] transition-colors"
                      >
                        <Share2 size={12} />
                        Share
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-300">
                        <Lock size={12} />
                        Share
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Locked / upcoming milestones ────────────────────────────── */}
      {lockedMilestones.length > 0 && (
        <section>
          <h3 className="text-base font-bold text-gray-900 mb-4">Upcoming milestones</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {lockedMilestones.map(m => (
              <div
                key={m.key}
                className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm opacity-60"
              >
                <span className="text-3xl mb-2 block select-none grayscale">{m.icon}</span>
                <span className="text-[13px] font-bold text-gray-400 block mb-0.5 leading-tight">
                  {m.label}
                </span>
                <span className="text-[11px] text-gray-400 block mb-2">
                  Reach day {m.days}
                </span>
                <ProgressBar value={currentStreak} max={m.days} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Share modal ─────────────────────────────────────────────── */}
      {shareTarget && (
        <ShareModal
          achievement={shareTarget}
          onClose={() => setShareTarget(null)}
        />
      )}
    </>
  )
}
