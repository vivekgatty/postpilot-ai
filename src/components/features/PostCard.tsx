'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, CalendarPlus, Loader2, BookmarkPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GeneratedPost, ToneType } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const VARIATION_COLORS: Record<number, string> = {
  1: 'bg-purple-50 text-purple-600',
  2: 'bg-blue-50  text-blue-600',
  3: 'bg-[#1D9E75]/10 text-[#1D9E75]',
}

function variationColor(n: number) {
  return VARIATION_COLORS[n] ?? 'bg-gray-100 text-gray-600'
}

const TONE_LABEL: Record<ToneType, string> = {
  professional:  'Professional',
  storytelling:  'Storytelling',
  controversial: 'Controversial',
  educational:   'Educational',
  inspirational: 'Inspirational',
}

function charCountColor(n: number) {
  if (n <= 1300) return 'text-[#1D9E75]'
  if (n <= 2000) return 'text-amber-500'
  return 'text-red-500'
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PostCardProps {
  post:      GeneratedPost
  tone:      ToneType
  onSave:    () => void
  onCopy:    () => void
  isSaving:  boolean
  isPaid:    boolean
  /** If true the save button shows a "Saved ✓" confirmation */
  isSaved?:  boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PostCard({
  post,
  tone,
  onSave,
  onCopy,
  isSaving,
  isPaid,
  isSaved = false,
}: PostCardProps) {
  const router        = useRouter()
  const [copied, setCopied] = useState(false)

  const charCount = post.content.length

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(post.content)
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea')
      el.value = post.content
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    onCopy()
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSchedule = () => {
    const encoded = encodeURIComponent(post.content)
    router.push(`/calendar?post=${encoded}`)
  }

  return (
    <div className={cn(
      'group bg-white rounded-2xl border border-[#E5E4E0] overflow-hidden',
      'transition-all duration-150 hover:border-[#1D9E75]/40 hover:shadow-sm',
    )}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#E5E4E0]">
        {/* Variation pill */}
        <span className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold',
          variationColor(post.variation),
        )}>
          Variation {post.variation}
        </span>

        {/* Tone badge */}
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-500">
          {TONE_LABEL[tone]}
        </span>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="px-5 py-4">
        <p
          className="text-sm text-gray-800 whitespace-pre-wrap"
          style={{ lineHeight: 1.7 }}
        >
          {post.content}
        </p>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pb-4 space-y-3">

        {/* Character counter */}
        <div className="flex items-center justify-between">
          <span className={cn('text-xs font-medium tabular-nums', charCountColor(charCount))}>
            {charCount.toLocaleString()} / 3,000 chars
          </span>
          {charCount > 3000 && (
            <span className="text-[10px] text-red-500 font-medium">Over LinkedIn limit</span>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2">

          {/* Copy */}
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 focus:outline-none',
              copied
                ? 'bg-[#1D9E75]/10 border-[#1D9E75]/30 text-[#1D9E75]'
                : 'bg-white border-[#E5E4E0] text-gray-600 hover:border-[#1D9E75]/50 hover:text-[#0A2540]',
            )}
          >
            {copied
              ? <><Check className="w-3.5 h-3.5" /> Copied</>
              : <><Copy className="w-3.5 h-3.5" /> Copy</>
            }
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || isSaved}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 focus:outline-none',
              isSaved
                ? 'bg-[#1D9E75] text-white border border-[#1D9E75] cursor-default'
                : 'bg-[#1D9E75] hover:bg-[#178a64] text-white border border-[#1D9E75] disabled:opacity-60 disabled:cursor-not-allowed',
            )}
          >
            {isSaving ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
            ) : isSaved ? (
              <><Check className="w-3.5 h-3.5" /> Saved ✓</>
            ) : (
              <><BookmarkPlus className="w-3.5 h-3.5" /> Save Draft</>
            )}
          </button>

          {/* Schedule */}
          <button
            type="button"
            onClick={handleSchedule}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E5E4E0] text-gray-600 hover:border-[#1D9E75]/50 hover:text-[#0A2540] bg-white transition-all duration-150 focus:outline-none ml-auto"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Schedule
          </button>
        </div>

        {/* Watermark — free plan only */}
        {!isPaid && (
          <p className="text-[10px] text-gray-300 text-right select-none pt-0.5">
            Made with PostPika
          </p>
        )}
      </div>
    </div>
  )
}
