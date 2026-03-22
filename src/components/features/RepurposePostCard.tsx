'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, RefreshCw, CalendarPlus, Bookmark, BookmarkCheck, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RepurposedPost, CarouselSlide } from '@/types'

// ── Format labels ─────────────────────────────────────────────────────────────

const FORMAT_LABELS: Record<string, string> = {
  text:      'Text',
  carousel:  'Carousel',
  question:  'Question',
  poll:      'Poll',
}

const FORMAT_COLORS: Record<string, string> = {
  text:     'bg-blue-50 text-blue-700',
  carousel: 'bg-purple-50 text-purple-700',
  question: 'bg-teal-50 text-teal-700',
  poll:     'bg-amber-50 text-amber-700',
}

// ── Carousel slide view ───────────────────────────────────────────────────────

function SlideCard({ slide, index }: { slide: CarouselSlide; index: number }) {
  const typeBadge: Record<string, string> = {
    title:   'bg-[#1D9E75]/10 text-[#1D9E75]',
    content: 'bg-gray-100 text-gray-600',
    cta:     'bg-amber-50 text-amber-700',
  }
  return (
    <div className="rounded-xl border border-[#E5E4E0] p-3 bg-gray-50">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold text-gray-400">SLIDE {index + 1}</span>
        <span className={cn(
          'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide',
          typeBadge[slide.type] ?? typeBadge.content,
        )}>
          {slide.type}
        </span>
      </div>
      {slide.heading && (
        <p className="text-sm font-bold text-[#0A2540] mb-1">{slide.heading}</p>
      )}
      {slide.body && (
        <p className="text-xs text-gray-600 leading-relaxed">{slide.body}</p>
      )}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface RepurposePostCardProps {
  post:           RepurposedPost
  onSave:         (post: RepurposedPost) => void
  onCopy:         (post: RepurposedPost) => void
  onRegenerate:   (post: RepurposedPost) => void
  onAddToCalendar: (post: RepurposedPost) => void
  isSaving:       boolean
  isPaid:         boolean
  isRegenerating?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RepurposePostCard({
  post,
  onSave,
  onCopy,
  onRegenerate,
  onAddToCalendar,
  isSaving,
  isPaid,
  isRegenerating = false,
}: RepurposePostCardProps) {
  const [copied,        setCopied]        = useState(false)
  const [expanded,      setExpanded]      = useState(false)
  const [slidesOpen,    setSlidesOpen]    = useState(false)
  const [saved,         setSaved]         = useState(post.saved ?? false)

  // Sync saved state when parent updates post.saved (e.g. after save-all)
  useEffect(() => {
    if (post.saved) setSaved(true)
  }, [post.saved])

  const isCarousel    = post.format === 'carousel'
  const hasLongContent = post.content.length > 400
  const displayContent = !expanded && hasLongContent
    ? post.content.slice(0, 300) + '…'
    : post.content

  const handleCopy = async () => {
    onCopy(post)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    if (saved) return
    onSave(post)
  }

  return (
    <div className={cn(
      'bg-white rounded-2xl border border-[#E5E4E0] flex flex-col',
      'transition-all duration-150 hover:border-[#1D9E75]/30 hover:shadow-sm',
      isRegenerating && 'opacity-60 pointer-events-none',
    )}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#E5E4E0]">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Repurposed badge */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1D9E75] text-white">
            <RefreshCw className="w-2.5 h-2.5" />
            Repurposed
          </span>
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold',
            FORMAT_COLORS[post.format] ?? FORMAT_COLORS.text,
          )}>
            {FORMAT_LABELS[post.format] ?? post.format}
          </span>
          <span className="ml-auto text-[10px] text-gray-400 tabular-nums">
            {post.character_count.toLocaleString()} chars
          </span>
        </div>
        {post.angle_title && (
          <p className="text-[11px] text-gray-400 mt-1.5 leading-tight">{post.angle_title}</p>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-3 flex-1">
        {isRegenerating ? (
          <div className="flex items-center gap-2 py-8 justify-center">
            <RotateCw className="w-4 h-4 text-[#1D9E75] animate-spin" />
            <span className="text-sm text-gray-500">Regenerating…</span>
          </div>
        ) : isCarousel ? (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Carousel — {(post.carousel_slides ?? []).length} slides
            </p>
            {/* Preview first 2 slides */}
            <div className="space-y-2">
              {(post.carousel_slides ?? []).slice(0, 2).map((slide, i) => (
                <SlideCard key={i} slide={slide} index={i} />
              ))}
            </div>
            {(post.carousel_slides ?? []).length > 2 && (
              <button
                type="button"
                onClick={() => setSlidesOpen(v => !v)}
                className="mt-2 text-xs font-semibold text-[#1D9E75] hover:underline"
              >
                {slidesOpen
                  ? 'Show less ↑'
                  : `View all ${(post.carousel_slides ?? []).length} slides ↓`}
              </button>
            )}
            {slidesOpen && (
              <div className="space-y-2 mt-2">
                {(post.carousel_slides ?? []).slice(2).map((slide, i) => (
                  <SlideCard key={i + 2} slide={slide} index={i + 2} />
                ))}
              </div>
            )}
            {/* Post text */}
            {post.content && (
              <div className="mt-3 pt-3 border-t border-[#E5E4E0]">
                <p className="text-xs font-semibold text-gray-400 mb-1">Caption / post text</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {post.content.slice(0, 200)}
                  {post.content.length > 200 && '…'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {displayContent}
            </p>
            {hasLongContent && (
              <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                className="mt-1.5 text-xs font-semibold text-[#1D9E75] hover:underline"
              >
                {expanded ? 'Show less ↑' : 'Show more ↓'}
              </button>
            )}
            {/* Poll options */}
            {post.format === 'poll' && post.poll_options && (
              <div className="mt-3 pt-3 border-t border-[#E5E4E0]">
                <p className="text-xs font-semibold text-gray-400 mb-2">Poll options:</p>
                <div className="flex flex-wrap gap-1.5">
                  {post.poll_options.map((opt, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-gray-100 text-gray-700 border border-[#E5E4E0]"
                    >
                      {opt}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  Create the poll directly on LinkedIn when publishing
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-1 flex-wrap pt-3 border-t border-[#E5E4E0]">
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors',
              copied
                ? 'bg-[#1D9E75]/10 text-[#1D9E75]'
                : 'text-gray-500 hover:bg-gray-50 hover:text-[#0A2540]',
            )}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saved || isSaving}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors',
              saved
                ? 'text-[#1D9E75] bg-[#1D9E75]/8'
                : 'text-gray-500 hover:bg-gray-50 hover:text-[#0A2540]',
            )}
          >
            {saved
              ? <><BookmarkCheck className="w-3.5 h-3.5" /> Saved ✓</>
              : isSaving
                ? <><RotateCw className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                : <><Bookmark className="w-3.5 h-3.5" /> Save draft</>
            }
          </button>

          <button
            type="button"
            onClick={() => onAddToCalendar(post)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-gray-500 hover:bg-gray-50 hover:text-[#0A2540] transition-colors"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            Calendar
          </button>

          <button
            type="button"
            onClick={() => onRegenerate(post)}
            disabled={isRegenerating}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-gray-500 hover:bg-gray-50 hover:text-[#0A2540] transition-colors ml-auto"
            title="Regenerate with different approach"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate
          </button>
        </div>

        {/* Free plan watermark */}
        {!isPaid && (
          <p className="text-[10px] text-gray-300 text-center mt-2">
            Made with PostPika
          </p>
        )}
      </div>
    </div>
  )
}
