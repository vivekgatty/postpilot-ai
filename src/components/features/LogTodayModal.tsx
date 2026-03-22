'use client'

import { useState } from 'react'
import { X, Check, Flame, MessageSquare, PenLine, Plus, Minus } from 'lucide-react'
import { STREAK_LIMITS } from '@/lib/streakConfig'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen:             boolean
  onClose:            () => void
  onLog:              (
    logType: 'publish' | 'engage' | 'plan',
    data: { comment_urls?: string[]; notes?: string; post_id?: string },
  ) => Promise<void>
  postedTodayPublish: boolean
  postedTodayEngage:  boolean
  postedTodayPlan:    boolean
  plan:               string
  currentStreak:      number
  isLogging:          boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function AlreadyLogged() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-[12px] font-semibold">
      <Check size={11} />
      Already logged ✓
    </span>
  )
}

function Divider() {
  return <div className="border-t border-gray-100 my-4" />
}

// ─── Section 1 — Publish ─────────────────────────────────────────────────────

interface PublishSectionProps {
  postedToday: boolean
  isLogging:   boolean
  onLog:       () => void
}

function PublishSection({ postedToday, isLogging, onLog }: PublishSectionProps) {
  return (
    <div className={postedToday ? 'opacity-60' : ''}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-[#1D9E75]" />
          <span className="text-sm font-semibold text-gray-800">
            I published a LinkedIn post today
          </span>
        </div>
        {postedToday && <AlreadyLogged />}
      </div>
      {!postedToday && (
        <button
          onClick={onLog}
          disabled={isLogging}
          className="w-full py-2.5 rounded-xl bg-[#1D9E75] hover:bg-[#18876A] disabled:opacity-50 text-white font-semibold text-sm transition-colors"
        >
          {isLogging ? 'Logging…' : 'Log published post'}
        </button>
      )}
    </div>
  )
}

// ─── Section 2 — Engage ──────────────────────────────────────────────────────

interface EngageSectionProps {
  postedToday: boolean
  locked:      boolean
  isLogging:   boolean
  onLog:       (urls: string[]) => void
}

function EngageSection({ postedToday, locked, isLogging, onLog }: EngageSectionProps) {
  const [urls, setUrls] = useState<string[]>([''])

  function setUrl(i: number, val: string) {
    setUrls(prev => prev.map((u, idx) => (idx === i ? val : u)))
  }

  function addUrl() {
    if (urls.length < 5) setUrls(prev => [...prev, ''])
  }

  function removeUrl(i: number) {
    if (urls.length > 1) setUrls(prev => prev.filter((_, idx) => idx !== i))
  }

  function isValidUrl(u: string) {
    try { return Boolean(new URL(u.trim())) } catch { return false }
  }
  const hasValid = urls.some(u => isValidUrl(u))

  return (
    <div className="relative">
      {/* Starter lock overlay */}
      {locked && (
        <div className="absolute inset-0 rounded-xl bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 gap-1">
          <span className="text-[11px] font-semibold text-gray-400">Starter plan required</span>
        </div>
      )}

      <div className={locked || postedToday ? 'opacity-60' : ''}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-500" />
            <span className="text-sm font-semibold text-gray-800">
              I left comments on LinkedIn today
            </span>
          </div>
          {postedToday && <AlreadyLogged />}
        </div>

        {!postedToday && !locked && (
          <>
            <p className="text-[12px] text-gray-500 mb-2">
              Paste the URLs of posts you commented on (at least 1 required)
            </p>

            <div className="space-y-2 mb-2">
              {urls.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(i, e.target.value)}
                    placeholder="https://linkedin.com/feed/update/..."
                    className={`flex-1 text-[13px] border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] transition ${
                      url.trim() && !isValidUrl(url) ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                  <button
                    onClick={() => removeUrl(i)}
                    disabled={urls.length === 1}
                    className="text-gray-300 hover:text-gray-500 disabled:opacity-30 transition-colors"
                  >
                    <Minus size={15} />
                  </button>
                </div>
              ))}
            </div>

            {urls.length < 5 && (
              <button
                onClick={addUrl}
                className="inline-flex items-center gap-1 text-[12px] text-[#1D9E75] font-semibold mb-3 hover:text-[#0F6E56] transition-colors"
              >
                <Plus size={13} />
                Add another URL
              </button>
            )}

            <button
              onClick={() => onLog(urls.filter(u => isValidUrl(u)))}
              disabled={!hasValid || isLogging}
              className="w-full py-2 rounded-xl border border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75]/5 disabled:opacity-40 font-semibold text-sm transition-colors"
            >
              {isLogging ? 'Logging…' : 'Log comment activity'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Section 3 — Plan ────────────────────────────────────────────────────────

interface PlanSectionProps {
  postedToday: boolean
  locked:      boolean
  isLogging:   boolean
  onLog:       () => void
}

function PlanSection({ postedToday, locked, isLogging, onLog }: PlanSectionProps) {
  return (
    <div className="relative">
      {locked && (
        <div className="absolute inset-0 rounded-xl bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 gap-1">
          <span className="text-[11px] font-semibold text-gray-400">Starter plan required</span>
        </div>
      )}

      <div className={locked || postedToday ? 'opacity-60' : ''}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PenLine size={16} className="text-purple-500" />
            <span className="text-sm font-semibold text-gray-800">
              I created content in PostPika today
            </span>
          </div>
          {postedToday && <AlreadyLogged />}
        </div>

        {!postedToday && !locked && (
          <>
            <p className="text-[12px] text-gray-500 mb-3">
              Logged automatically when you generate, plan, or analyse posts.
              Or log manually:
            </p>
            <button
              onClick={onLog}
              disabled={isLogging}
              className="py-2 px-4 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 font-semibold text-sm transition-colors"
            >
              {isLogging ? 'Logging…' : 'Log planning activity'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function LogTodayModal({
  isOpen,
  onClose,
  onLog,
  postedTodayPublish,
  postedTodayEngage,
  postedTodayPlan,
  plan,
  currentStreak,
  isLogging,
}: Props) {
  if (!isOpen) return null

  const isStarter = plan !== 'free'
  const limits    = STREAK_LIMITS[plan as keyof typeof STREAK_LIMITS] ?? STREAK_LIMITS.free
  const _hasEngage = Array.isArray(limits.streak_types) && limits.streak_types.includes('engage')

  const headingStreak = currentStreak > 0
    ? `Keep your ${currentStreak}-day streak alive`
    : 'Start your streak today'

  async function handleLog(
    logType: 'publish' | 'engage' | 'plan',
    data: { comment_urls?: string[]; notes?: string; post_id?: string },
  ) {
    await onLog(logType, data)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl select-none">🔥</span>
            <div>
              <h2 className="text-base font-bold text-gray-900">Log today&apos;s activity</h2>
              <p className="text-[12px] text-gray-500 mt-0.5">{headingStreak}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Section 1 — Publish */}
        <PublishSection
          postedToday={postedTodayPublish}
          isLogging={isLogging}
          onLog={() => handleLog('publish', {})}
        />

        <Divider />

        {/* Section 2 — Engage */}
        <EngageSection
          postedToday={postedTodayEngage}
          locked={!isStarter}
          isLogging={isLogging}
          onLog={urls => handleLog('engage', { comment_urls: urls })}
        />

        <Divider />

        {/* Section 3 — Plan */}
        <PlanSection
          postedToday={postedTodayPlan}
          locked={!isStarter}
          isLogging={isLogging}
          onLog={() => handleLog('plan', {})}
        />

        {/* Bottom note */}
        <p className="text-[11px] text-gray-400 mt-5 leading-relaxed">
          Activity is self-reported and on the honour system.
          This is for your own growth tracking.
        </p>
      </div>
    </div>
  )
}
