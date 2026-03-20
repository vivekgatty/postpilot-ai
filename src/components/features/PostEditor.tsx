'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Loader2, Save, X, ChevronDown } from 'lucide-react'
import ToneSelector from '@/components/features/ToneSelector'
import { cn } from '@/lib/utils'
import type { Post, ToneType, PostStatus, UpdatePostInput } from '@/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_CHARS   = 3000
const STATUS_OPTS: { value: PostStatus; label: string }[] = [
  { value: 'draft',     label: 'Draft'     },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'archived',  label: 'Archived'  },
]

function charColor(n: number) {
  if (n <= 1300) return 'text-[#1D9E75]'
  if (n <= 2000) return 'text-amber-500'
  return 'text-red-500'
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PostEditorProps {
  post:     Post
  onSave:   (updates: UpdatePostInput) => void | Promise<void>
  onCancel: () => void
  saving?:  boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PostEditor({ post, onSave, onCancel, saving = false }: PostEditorProps) {
  const [content,      setContent]      = useState(post.content)
  const [tone,         setTone]         = useState<ToneType>(post.tone)
  const [status,       setStatus]       = useState<PostStatus>(post.status)
  const [scheduledFor, setScheduledFor] = useState(
    post.scheduled_for
      ? new Date(post.scheduled_for).toISOString().slice(0, 16)  // "YYYY-MM-DDTHH:MM"
      : ''
  )
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Auto-resize textarea ─────────────────────────────────────────────────
  const adjust = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => { adjust() }, [content, adjust])

  const charCount   = content.length
  const overLimit   = charCount > MAX_CHARS
  const hasChanges  = (
    content      !== post.content       ||
    tone         !== post.tone          ||
    status       !== post.status        ||
    scheduledFor !== (post.scheduled_for
      ? new Date(post.scheduled_for).toISOString().slice(0, 16)
      : '')
  )

  const handleSave = () => {
    const updates: UpdatePostInput = {
      content,
      tone,
      status,
      scheduled_for: status === 'scheduled' && scheduledFor
        ? new Date(scheduledFor).toISOString()
        : null,
    }
    onSave(updates)
  }

  return (
    <div className="border-t border-[#E5E4E0] pt-4 space-y-4">

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); adjust() }}
          onInput={adjust}
          rows={4}
          disabled={saving}
          className={cn(
            'w-full rounded-xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 transition-colors disabled:opacity-60',
            'leading-relaxed',
            overLimit
              ? 'border-red-300 focus:ring-red-200'
              : 'border-[#E5E4E0] focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]',
          )}
          style={{ overflowY: 'hidden', minHeight: '96px' }}
        />
        <span className={cn(
          'absolute bottom-3 right-3 text-xs font-medium tabular-nums select-none pointer-events-none',
          charColor(charCount),
        )}>
          {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </span>
      </div>

      {/* Compact tone picker */}
      <div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tone</p>
        <ToneSelector value={tone} onChange={setTone} disabled={saving} compact />
      </div>

      {/* Status + datetime row */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Status select */}
        <div className="flex-shrink-0">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</p>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PostStatus)}
              disabled={saving}
              className="appearance-none border border-[#E5E4E0] rounded-lg px-3 py-1.5 pr-7 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] disabled:opacity-60 cursor-pointer"
            >
              {STATUS_OPTS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>

        {/* Datetime picker — only when scheduled */}
        {status === 'scheduled' && (
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Publish at
            </p>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              disabled={saving}
              min={new Date().toISOString().slice(0, 16)}
              className="border border-[#E5E4E0] rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] disabled:opacity-60"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E5E4E0] text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || overLimit || !content.trim() || !hasChanges}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#1D9E75] hover:bg-[#178a64] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
            : <><Save className="w-3.5 h-3.5" /> Save changes</>
          }
        </button>
      </div>
    </div>
  )
}
