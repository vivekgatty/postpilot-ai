'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'
import {
  Sparkles,
  Search,
  ChevronDown,
  Copy,
  Check,
  CalendarPlus,
  Star,
  Trash2,
  Pencil,
  ChevronRight,
} from 'lucide-react'
import { usePosts } from '@/hooks/usePosts'
import PostEditor from '@/components/features/PostEditor'
import Modal from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import type { Post, ToneType, UpdatePostInput } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s    = Math.floor(diff / 1000)
  const m    = Math.floor(s / 60)
  const h    = Math.floor(m / 60)
  const d    = Math.floor(h / 24)
  const w    = Math.floor(d / 7)
  const mo   = Math.floor(d / 30)

  if (s < 60)   return 'just now'
  if (m < 60)   return `${m}m ago`
  if (h < 24)   return `${h}h ago`
  if (d < 7)    return `${d}d ago`
  if (w < 5)    return `${w}w ago`
  if (mo < 12)  return `${mo}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}

const TONE_PILL: Record<ToneType, string> = {
  professional:  'bg-slate-100    text-slate-700',
  storytelling:  'bg-purple-100   text-purple-700',
  controversial: 'bg-amber-100    text-amber-700',
  educational:   'bg-blue-100     text-blue-700',
  inspirational: 'bg-rose-100     text-rose-600',
}

type TabKey = 'all' | 'drafts' | 'scheduled' | 'published' | 'favourites'
type SortKey = 'newest' | 'oldest' | 'az'

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ post }: { post: Post }) {
  if (post.status === 'draft') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
        Draft
      </span>
    )
  }
  if (post.status === 'scheduled') {
    const date = post.scheduled_for
      ? new Date(post.scheduled_for).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : 'Scheduled'
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600">
        📅 {date}
      </span>
    )
  }
  if (post.status === 'published') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1D9E75]/10 text-[#1D9E75]">
        ✓ Published
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-600">
      Archived
    </span>
  )
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E4E0] p-5 space-y-3">
      <div className="flex gap-2">
        <div className="shimmer h-4 w-16 rounded-full" />
        <div className="shimmer h-4 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="shimmer h-3.5 rounded" />
        <div className="shimmer h-3.5 w-4/5 rounded" />
      </div>
      <div className="flex gap-3 pt-1">
        <div className="shimmer h-3 w-14 rounded" />
        <div className="shimmer h-3 w-10 rounded" />
      </div>
    </div>
  )
}

// ── Post list card ────────────────────────────────────────────────────────────

interface PostCardProps {
  post:         Post
  isExpanded:   boolean
  isSaving:     boolean
  isDeleting:   boolean
  copiedId:     string | null
  onToggleEdit: (id: string) => void
  onSave:       (id: string, updates: UpdatePostInput) => void
  onCancelEdit: () => void
  onCopy:       (post: Post) => void
  onFavourite:  (id: string) => void
  onDeleteAsk:  (id: string) => void
}

function PostListCard({
  post,
  isExpanded,
  isSaving,
  isDeleting,
  copiedId,
  onToggleEdit,
  onSave,
  onCancelEdit,
  onCopy,
  onFavourite,
  onDeleteAsk,
}: PostCardProps) {
  const preview = post.content.slice(0, 120) + (post.content.length > 120 ? '…' : '')

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-[#E5E4E0] overflow-hidden',
        'transition-all duration-150 hover:border-[#1D9E75]/30 hover:shadow-sm',
        isDeleting && 'card-exit',
      )}
    >
      {/* Card body */}
      <div className="p-5">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          <StatusBadge post={post} />
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold',
            TONE_PILL[post.tone],
          )}>
            {post.tone.charAt(0).toUpperCase() + post.tone.slice(1)}
          </span>
          {post.niche && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-50 text-gray-500 border border-gray-200">
              {post.niche}
            </span>
          )}
          {post.is_favourite && (
            <span className="text-amber-400 text-sm leading-none">★</span>
          )}
        </div>

        {/* Content preview */}
        <p className="text-sm text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap">
          {preview}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-4">
          {post.character_count !== null && (
            <span>{post.character_count.toLocaleString()} chars</span>
          )}
          <span>{timeAgo(post.created_at)}</span>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-1 flex-wrap">
          <ActionBtn
            onClick={() => onToggleEdit(post.id)}
            icon={<Pencil className="w-3.5 h-3.5" />}
            label={isExpanded ? 'Close' : 'Edit'}
            active={isExpanded}
          />
          <ActionBtn
            onClick={() => onCopy(post)}
            icon={copiedId === post.id
              ? <Check className="w-3.5 h-3.5" />
              : <Copy className="w-3.5 h-3.5" />
            }
            label={copiedId === post.id ? 'Copied!' : 'Copy'}
          />
          <ActionBtn
            onClick={() => {
              const encoded = encodeURIComponent(post.content)
              window.location.href = `/calendar?post=${encoded}`
            }}
            icon={<CalendarPlus className="w-3.5 h-3.5" />}
            label="Schedule"
          />
          <ActionBtn
            onClick={() => onFavourite(post.id)}
            icon={<Star className={cn('w-3.5 h-3.5', post.is_favourite && 'fill-amber-400 text-amber-400')} />}
            label={post.is_favourite ? 'Unfavourite' : 'Favourite'}
            active={post.is_favourite}
          />
          <ActionBtn
            onClick={() => onDeleteAsk(post.id)}
            icon={<Trash2 className="w-3.5 h-3.5" />}
            label="Delete"
            danger
          />
        </div>
      </div>

      {/* Inline editor — smooth height transition */}
      <div className={cn(
        'overflow-hidden transition-all duration-300 ease-in-out',
        isExpanded ? 'max-h-[720px] opacity-100' : 'max-h-0 opacity-0',
      )}>
        <div className="px-5 pb-5">
          <PostEditor
            post={post}
            onSave={(updates) => onSave(post.id, updates)}
            onCancel={onCancelEdit}
            saving={isSaving}
          />
        </div>
      </div>
    </div>
  )
}

// Small action button used inside card
function ActionBtn({
  onClick,
  icon,
  label,
  active = false,
  danger = false,
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  active?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors duration-150',
        danger
          ? 'text-red-500 hover:bg-red-50'
          : active
            ? 'text-[#1D9E75] bg-[#1D9E75]/8'
            : 'text-gray-500 hover:bg-gray-50 hover:text-[#0A2540]',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PostsPage() {
  const { posts, loading, updatePost, deletePost, toggleFavourite } = usePosts()
  const { toast } = useToast()

  // Filter / sort state
  const [activeTab,    setActiveTab]    = useState<TabKey>('all')
  const [searchQuery,  setSearchQuery]  = useState('')
  const [sortOrder,    setSortOrder]    = useState<SortKey>('newest')

  // UI state
  const [expandedId,   setExpandedId]   = useState<string | null>(null)
  const [savingId,     setSavingId]     = useState<string | null>(null)
  const [deletingIds,  setDeletingIds]  = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [copiedId,     setCopiedId]     = useState<string | null>(null)
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     posts.length,
    drafts:    posts.filter(p => p.status === 'draft').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    published: posts.filter(p => p.status === 'published').length,
  }), [posts])

  // ── Filtered + sorted list ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...posts]

    // Tab
    if      (activeTab === 'drafts')     result = result.filter(p => p.status === 'draft')
    else if (activeTab === 'scheduled')  result = result.filter(p => p.status === 'scheduled')
    else if (activeTab === 'published')  result = result.filter(p => p.status === 'published')
    else if (activeTab === 'favourites') result = result.filter(p => p.is_favourite)

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => p.content.toLowerCase().includes(q))
    }

    // Sort
    if      (sortOrder === 'oldest') result.sort((a, b) => a.created_at.localeCompare(b.created_at))
    else if (sortOrder === 'az')     result.sort((a, b) => a.content.localeCompare(b.content))
    // newest is default from API (already sorted desc)

    return result
  }, [posts, activeTab, searchQuery, sortOrder])

  const displayed = filtered.slice(0, displayCount)
  const hasMore   = filtered.length > displayCount

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleToggleEdit = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }, [])

  const handleSave = useCallback(async (id: string, updates: UpdatePostInput) => {
    setSavingId(id)
    await updatePost(id, updates)
    setSavingId(null)
    setExpandedId(null)
  }, [updatePost])

  const handleCopy = useCallback(async (post: Post) => {
    try {
      await navigator.clipboard.writeText(post.content)
    } catch {
      const el = document.createElement('textarea')
      el.value = post.content
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopiedId(post.id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    const id = deleteTarget
    setDeleteTarget(null)

    // Start exit animation
    setDeletingIds(prev => new Set(Array.from(prev).concat(id)))
    // After animation, let optimistic delete remove from state
    setTimeout(async () => {
      const { error } = await deletePost(id)
      setDeletingIds(prev => {
        const next = new Set(Array.from(prev))
        next.delete(id)
        return next
      })
      if (error) toast.error('Failed to delete post — please try again')
    }, 240)
  }, [deleteTarget, deletePost])

  // ── Render ────────────────────────────────────────────────────────────────

  const TABS: { key: TabKey; label: string; count?: number }[] = [
    { key: 'all',        label: 'All',       count: stats.total     },
    { key: 'drafts',     label: 'Drafts',    count: stats.drafts    },
    { key: 'scheduled',  label: 'Scheduled', count: stats.scheduled },
    { key: 'published',  label: 'Published', count: stats.published },
    { key: 'favourites', label: 'Favourites'                        },
  ]

  return (
    <div className="space-y-6 pb-16">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]">My Posts</h1>
          {/* Stat pills */}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <StatPill label={`${stats.total} total`} color="gray" />
            {stats.drafts    > 0 && <StatPill label={`${stats.drafts} draft${stats.drafts !== 1 ? 's' : ''}`}     color="gray"  />}
            {stats.scheduled > 0 && <StatPill label={`${stats.scheduled} scheduled`}                              color="blue"  />}
            {stats.published > 0 && <StatPill label={`${stats.published} published`}                              color="green" />}
          </div>
        </div>
        <Link
          href="/generate"
          className="inline-flex items-center gap-1.5 bg-[#1D9E75] hover:bg-[#178a64] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          New Post →
        </Link>
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-shrink-0 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setActiveTab(tab.key); setDisplayCount(PAGE_SIZE) }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                activeTab === tab.key
                  ? 'bg-white text-[#0A2540] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums',
                  activeTab === tab.key ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500',
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setDisplayCount(PAGE_SIZE) }}
            placeholder="Search posts…"
            className="w-full pl-9 pr-4 py-2 border border-[#E5E4E0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] transition-colors"
          />
        </div>

        {/* Sort */}
        <div className="relative flex-shrink-0">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortKey)}
            className="appearance-none border border-[#E5E4E0] rounded-xl px-3 py-2 pr-8 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="az">A–Z</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg
            width="80" height="80" viewBox="0 0 80 80" fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mb-5 opacity-60"
            aria-hidden="true"
          >
            <circle cx="40" cy="40" r="38" fill="#E1F5EE" stroke="#1D9E75" strokeWidth="1.5" />
            <ellipse cx="40" cy="44" rx="17" ry="14" fill="#1D9E75" opacity="0.15" />
            <circle cx="32" cy="36" r="4.5" fill="#0A2540" />
            <circle cx="48" cy="36" r="4.5" fill="#0A2540" />
            <circle cx="33.5" cy="34.5" r="1.5" fill="white" />
            <circle cx="49.5" cy="34.5" r="1.5" fill="white" />
            {/* Neutral/sad mouth */}
            <path d="M33 47 Q40 44 47 47" stroke="#0A2540" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M26 23 L21 13" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M54 23 L59 13" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <h2 className="text-lg font-bold text-[#0A2540] mb-1">
            {posts.length === 0 ? 'No posts saved yet' : 'No posts match your filter'}
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            {posts.length === 0
              ? 'Generate your first post and save it as a draft'
              : 'Try a different tab, search term, or sort order'}
          </p>
          {posts.length === 0 && (
            <Link
              href="/generate"
              className="inline-flex items-center gap-1.5 bg-[#1D9E75] hover:bg-[#178a64] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Generate your first post →
            </Link>
          )}
        </div>
      )}

      {/* Post list */}
      {!loading && displayed.length > 0 && (
        <div className="space-y-3">
          {displayed.map(post => (
            <PostListCard
              key={post.id}
              post={post}
              isExpanded={expandedId === post.id}
              isSaving={savingId === post.id}
              isDeleting={deletingIds.has(post.id)}
              copiedId={copiedId}
              onToggleEdit={handleToggleEdit}
              onSave={handleSave}
              onCancelEdit={() => setExpandedId(null)}
              onCopy={handleCopy}
              onFavourite={toggleFavourite}
              onDeleteAsk={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setDisplayCount(c => c + PAGE_SIZE)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E5E4E0] text-sm font-semibold text-gray-600 hover:border-[#1D9E75]/50 hover:text-[#0A2540] bg-white transition-all duration-150"
          >
            Load more
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Showing count hint */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Showing {Math.min(displayCount, filtered.length)} of {filtered.length} post{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* ── Delete confirmation modal ──────────────────────────────────────── */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete post?"
      >
        <p className="text-sm text-gray-600 mb-6">
          This will permanently delete the post. This action cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="px-4 py-2 rounded-xl border border-[#E5E4E0] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
          >
            Delete post
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ── Stat pill helper ──────────────────────────────────────────────────────────

function StatPill({ label, color }: { label: string; color: 'gray' | 'blue' | 'green' }) {
  const cls = {
    gray:  'bg-gray-100 text-gray-600',
    blue:  'bg-blue-50  text-blue-600',
    green: 'bg-[#1D9E75]/10 text-[#1D9E75]',
  }[color]
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', cls)}>
      {label}
    </span>
  )
}
