'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { FORMAT_ICONS } from '@/lib/plannerConfig'
import { SYSTEM_TONES } from '@/lib/constants'
import type { PlannedPost, ContentPillar } from '@/types'
import Spinner from '@/components/ui/Spinner'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  idea:      { label: 'Idea',      color: 'bg-gray-100 text-gray-600',      icon: '💡' },
  draft:     { label: 'Draft',     color: 'bg-amber-50 text-amber-700',     icon: '✏️' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-50 text-blue-700',       icon: '🕐' },
  published: { label: 'Published', color: 'bg-green-50 text-green-700',     icon: '✅' },
  missed:    { label: 'Missed',    color: 'bg-red-50 text-red-600',         icon: '❌' },
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  post:              PlannedPost | null
  pillars:           ContentPillar[]
  linkedInConnected: boolean
  onClose:           () => void
  onUpdate:          (post: PlannedPost) => void
  onDelete:          (postId: string) => void
  onWritePost:       (post: PlannedPost) => void
  onPublishNow:      (post: PlannedPost) => void
  onSchedule:        (post: PlannedPost, scheduledFor: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PostDetailPanel({
  post, pillars, linkedInConnected,
  onClose, onUpdate, onDelete, onWritePost, onPublishNow, onSchedule,
}: Props) {
  const router = useRouter()

  const [editTitle, setEditTitle]       = useState(false)
  const [titleVal, setTitleVal]         = useState(post?.title ?? '')
  const [editTopic, setEditTopic]       = useState(false)
  const [topicVal, setTopicVal]         = useState(post?.topic ?? '')
  const [showRegen, setShowRegen]       = useState(false)
  const [isRegen, setIsRegen]           = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleVal, setScheduleVal]   = useState('')
  const [showStatuses, setShowStatuses] = useState(false)
  const [isDeleting, setIsDeleting]     = useState(false)

  if (!post) return null

  const pillarColor = post.pillar?.color ?? '#E5E4E0'
  const planned     = new Date(post.planned_date + 'T00:00:00')
  const dateLabel   = planned.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const statusCfg   = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.idea

  // ── Inline save helpers ───────────────────────────────────────────────────────

  const saveTitle = async () => {
    const res  = await fetch(`/api/planner/posts/${post.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: titleVal }),
    })
    const data = await res.json() as { post: PlannedPost }
    if (data.post) onUpdate(data.post)
    setEditTitle(false)
  }

  const saveTopic = async () => {
    const res  = await fetch(`/api/planner/posts/${post.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ topic: topicVal }),
    })
    const data = await res.json() as { post: PlannedPost }
    if (data.post) onUpdate(data.post)
    setEditTopic(false)
  }

  const updateField = async (patch: Partial<PlannedPost>) => {
    const res  = await fetch(`/api/planner/posts/${post.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(patch),
    })
    const data = await res.json() as { post: PlannedPost }
    if (data.post) onUpdate(data.post)
  }

  const regenerate = async () => {
    setIsRegen(true)
    try {
      const res  = await fetch('/api/planner/regenerate-post', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ postId: post.id }),
      })
      const data = await res.json() as { post: PlannedPost }
      if (data.post) onUpdate(data.post)
    } finally {
      setIsRegen(false)
      setShowRegen(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this planned post?')) return
    setIsDeleting(true)
    await fetch(`/api/planner/posts/${post.id}`, { method: 'DELETE' })
    onDelete(post.id)
  }

  const handleWritePost = () => {
    const params = new URLSearchParams({
      topic:         post.topic,
      tone:          post.tone_id,
      format:        post.format,
      plannedPostId: post.id,
    })
    router.push(`/generate?${params.toString()}`)
    onWritePost(post)
  }

  const handleSchedule = () => {
    if (!scheduleVal) return
    onSchedule(post, scheduleVal)
    setShowSchedule(false)
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/10"
        onClick={onClose}
      />

      {/* Panel */}
      <aside className="fixed right-0 top-0 bottom-0 z-40 w-[360px] bg-white shadow-2xl flex flex-col overflow-y-auto"
        style={{ borderTop: `4px solid ${pillarColor}` }}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-400">{FORMAT_ICONS[post.format]} {post.format}</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">{dateLabel}</span>
            </div>
            {post.pillar && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
                style={{ backgroundColor: pillarColor }}
              >
                {post.pillar.name}
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none mt-0.5">✕</button>
        </div>

        {/* Content */}
        <div className="px-5 flex-1 space-y-4">

          {/* Title */}
          <div>
            {editTitle ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={titleVal}
                  onChange={(e) => setTitleVal(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                  className="flex-1 text-base font-bold text-[#0A2540] border-b border-[#1D9E75] focus:outline-none bg-transparent"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setTitleVal(post.title); setEditTitle(true) }}
                className="text-left text-base font-bold text-[#0A2540] hover:text-[#1D9E75] transition-colors w-full"
              >
                {post.title}
              </button>
            )}
          </div>

          {/* Topic */}
          <div>
            {editTopic ? (
              <textarea
                autoFocus
                value={topicVal}
                onChange={(e) => setTopicVal(e.target.value)}
                onBlur={saveTopic}
                rows={3}
                className="w-full text-sm text-gray-700 border border-[#1D9E75] rounded-lg p-2 focus:outline-none resize-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => { setTopicVal(post.topic); setEditTopic(true) }}
                className="text-left text-sm text-gray-700 hover:text-[#0A2540] transition-colors w-full leading-relaxed"
              >
                {post.topic}
              </button>
            )}
          </div>

          {/* Hook suggestion */}
          {post.hook_suggestion && (
            <div className="border-l-2 border-[#1D9E75] pl-3 py-1">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Hook suggestion</p>
              <p className="text-sm text-gray-600 italic leading-relaxed">{post.hook_suggestion}</p>
            </div>
          )}

          {/* Why this week */}
          {post.why_this_week && (
            <p className="text-xs text-gray-400 italic">{post.why_this_week}</p>
          )}

          {/* Pillar + format + tone selectors */}
          <div className="space-y-3">
            {/* Pillar */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Pillar</p>
              <div className="flex flex-wrap gap-1.5">
                {pillars.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => updateField({ pillar_id: p.id })}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[11px] font-medium transition-all text-white',
                      post.pillar_id === p.id ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-70 hover:opacity-100',
                    )}
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Format</p>
              <div className="flex gap-1.5">
                {(['text', 'carousel', 'poll', 'question'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => updateField({ format: fmt })}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all',
                      post.format === fmt
                        ? 'bg-[#0A2540] text-white border-[#0A2540]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400',
                    )}
                  >
                    {FORMAT_ICONS[fmt]}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Tone</p>
              <select
                value={post.tone_id}
                onChange={(e) => updateField({ tone_id: e.target.value })}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
              >
                {Object.values(SYSTEM_TONES).map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status badge */}
          <div>
            <button
              type="button"
              onClick={() => setShowStatuses(!showStatuses)}
              className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium', statusCfg.color)}
            >
              <span>{statusCfg.icon}</span>
              <span>{statusCfg.label}</span>
              <span className="text-xs opacity-60">▼</span>
            </button>
            {showStatuses && (
              <div className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { updateField({ status: key as PlannedPost['status'] }); setShowStatuses(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <span>{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            {/* idea / draft */}
            {(post.status === 'idea' || post.status === 'draft') && (
              <>
                <button
                  type="button"
                  onClick={handleWritePost}
                  className="w-full py-2.5 rounded-xl bg-[#1D9E75] text-white font-semibold text-sm hover:bg-[#178a64] transition-colors"
                >
                  Write this post →
                </button>
                {linkedInConnected ? (
                  <>
                    {post.post_id ? (
                      <button
                        type="button"
                        onClick={() => onPublishNow(post)}
                        className="w-full py-2.5 rounded-xl bg-[#0A66C2] text-white font-semibold text-sm hover:bg-[#0858a8] transition-colors flex items-center justify-center gap-2"
                      >
                        <LinkedInIcon /> Post to LinkedIn now
                      </button>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-1">Write the full post first, then publish from here.</p>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowSchedule(!showSchedule)}
                      className="w-full py-2 rounded-xl border border-[#1D9E75] text-[#1D9E75] text-sm font-medium hover:bg-[#E1F5EE] transition-colors"
                    >
                      Schedule for {post.planned_date} {post.planned_time}
                    </button>
                    {showSchedule && (
                      <div className="flex gap-2">
                        <input
                          type="datetime-local"
                          value={scheduleVal}
                          onChange={(e) => setScheduleVal(e.target.value)}
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
                        />
                        <button type="button" onClick={handleSchedule} className="px-3 py-1.5 bg-[#1D9E75] text-white text-sm rounded-lg">Set</button>
                      </div>
                    )}
                  </>
                ) : (
                  <a
                    href="/api/linkedin/connect"
                    className="w-full py-2.5 rounded-xl border-2 border-[#0A66C2] text-[#0A66C2] text-sm font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <LinkedInIcon /> Connect LinkedIn to post directly
                  </a>
                )}
              </>
            )}

            {/* scheduled */}
            {post.status === 'scheduled' && (
              <>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-600 font-medium">Scheduled for</p>
                  <p className="text-sm font-bold text-blue-800">{post.planned_date} at {post.planned_time}</p>
                </div>
                <button type="button" onClick={() => setShowSchedule(true)} className="w-full py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">Reschedule</button>
                <button type="button" onClick={() => updateField({ status: 'draft' })} className="w-full py-2 rounded-xl border border-red-200 text-red-500 text-sm hover:bg-red-50 transition-colors">Cancel schedule</button>
              </>
            )}

            {/* published */}
            {post.status === 'published' && (
              <>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-green-600 font-medium">Published</p>
                  {post.linkedin_posted_at && (
                    <p className="text-sm text-green-800">{new Date(post.linkedin_posted_at).toLocaleString('en-IN')}</p>
                  )}
                </div>
                {post.linkedin_post_url && (
                  <a href={post.linkedin_post_url} target="_blank" rel="noreferrer"
                    className="w-full py-2 rounded-xl border border-[#0A66C2] text-[#0A66C2] text-sm font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5">
                    <LinkedInIcon /> View on LinkedIn →
                  </a>
                )}
                <button type="button" onClick={() => updateField({ status: 'draft', linkedin_post_id: null, linkedin_posted_at: null, linkedin_post_url: null })}
                  className="w-full py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">
                  Post again
                </button>
              </>
            )}

            {/* missed */}
            {post.status === 'missed' && (
              <>
                <button
                  type="button"
                  onClick={() => updateField({ planned_date: new Date().toISOString().slice(0, 10), status: 'idea' })}
                  className="w-full py-2.5 rounded-xl bg-[#1D9E75] text-white font-semibold text-sm hover:bg-[#178a64] transition-colors"
                >
                  Reschedule to today
                </button>
                <button type="button" onClick={() => onDelete(post.id)} className="w-full py-2 rounded-xl border border-red-200 text-red-500 text-sm hover:bg-red-50 transition-colors">
                  Skip this post
                </button>
              </>
            )}
          </div>

          {/* Regenerate section */}
          <div className="border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setShowRegen(!showRegen)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showRegen ? '▼' : '▶'} Not happy with this topic?
            </button>
            {showRegen && (
              <button
                type="button"
                onClick={regenerate}
                disabled={isRegen}
                className="mt-2 w-full py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                {isRegen ? <><Spinner /> Regenerating...</> : '🔄 Regenerate this post idea'}
              </button>
            )}
          </div>

          {/* Recurring */}
          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={post.is_recurring}
                onChange={(e) => updateField({ is_recurring: e.target.checked })}
                className="rounded accent-[#1D9E75]"
              />
              Make this a recurring post
            </label>
            {post.is_recurring && (
              <input
                type="text"
                placeholder="e.g. Every Monday"
                value={post.recurring_pattern ?? ''}
                onChange={(e) => updateField({ recurring_pattern: e.target.value })}
                className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
              />
            )}
          </div>

          {/* Delete */}
          <div className="border-t border-gray-100 pt-4 pb-6">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              {isDeleting ? 'Deleting…' : 'Delete this post'}
            </button>
          </div>

        </div>
      </aside>
    </>
  )
}

// ── LinkedIn icon ─────────────────────────────────────────────────────────────

function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}
