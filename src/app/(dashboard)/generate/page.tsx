'use client'

import {
  useState,
  useEffect,
  useRef,
  useTransition,
  useCallback,
  Suspense,
} from 'react'

import { useSearchParams } from 'next/navigation'
import {
  Sparkles,
  Loader2,
  RefreshCw,
  BookmarkPlus,
  ChevronDown,
} from 'lucide-react'
import ToneSelector from '@/components/features/ToneSelector'
import PostCard from '@/components/features/PostCard'
import UsageMeter from '@/components/features/UsageMeter'
import { cn } from '@/lib/utils'
import { NICHE_OPTIONS } from '@/lib/constants'
import type { ToneType, NicheType, GeneratedPost, UsageInfo, Profile } from '@/types'
import { useToast } from '@/components/ui/Toast'

// ── Constants ─────────────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  'Analysing your idea...',
  'Crafting your hooks...',
  'Adding Indian context...',
  'Polishing the copy...',
]

// ── Shimmer skeleton card ─────────────────────────────────────────────────────

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <div
      className="bg-white rounded-2xl border border-[#E5E4E0] p-5 overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="shimmer h-5 w-24 rounded-full" />
        <div className="shimmer h-4 w-16 rounded" />
      </div>
      <div className="space-y-2.5">
        <div className="shimmer h-3.5 rounded" />
        <div className="shimmer h-3.5 w-[90%] rounded" />
        <div className="shimmer h-3.5 w-[95%] rounded" />
        <div className="shimmer h-3.5 w-[85%] rounded" />
        <div className="shimmer h-3.5 w-[75%] rounded" />
      </div>
      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-50">
        <div className="shimmer h-7 w-16 rounded-lg" />
        <div className="shimmer h-7 w-24 rounded-lg" />
        <div className="shimmer h-7 w-20 rounded-lg ml-auto" />
      </div>
    </div>
  )
}

// ── Inner page (uses useSearchParams — must live inside a Suspense boundary) ──

function GeneratePageInner() {
  const searchParams          = useSearchParams()
  const [, startTransition]   = useTransition()
  const textareaRef           = useRef<HTMLTextAreaElement>(null)

  // Form state
  const [topic, setTopic]     = useState('')
  const [tone, setTone]       = useState<ToneType>('professional')
  const [niche, setNiche]     = useState<NicheType>('Tech/SaaS')

  // Results
  const [posts, setPosts]     = useState<GeneratedPost[]>([])
  const [generating, setGenerating] = useState(false)
  const [msgIdx, setMsgIdx]   = useState(0)
  const [savedSet, setSavedSet] = useState(new Set<number>())
  const [savingIdx, setSavingIdx] = useState<number | null>(null)

  // Profile / usage
  const [usage, setUsage]     = useState<UsageInfo | null>(null)

  const { toast } = useToast()

  // ── Pre-fill from ?topic= ────────────────────────────────────────────────
  useEffect(() => {
    const t = searchParams.get('topic')
    if (t) setTopic(decodeURIComponent(t))
  }, [searchParams])

  // ── Load profile (niche pre-fill) + usage ────────────────────────────────
  const refreshUsage = useCallback(() => {
    fetch('/api/user/usage')
      .then(r => r.json())
      .then((d: UsageInfo) => { if (d?.plan) setUsage(d) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then((d: { profile?: Profile }) => {
        if (d?.profile?.niche) setNiche(d.profile.niche)
      })
      .catch(() => {})
    refreshUsage()
  }, [refreshUsage])

  // ── Auto-expanding textarea ──────────────────────────────────────────────
  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const lh   = parseFloat(getComputedStyle(el).lineHeight) || 22
    const maxH = lh * 10
    el.style.height   = `${Math.min(el.scrollHeight, maxH)}px`
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden'
  }, [])

  // ── Derived values ───────────────────────────────────────────────────────
  const wordCount   = topic.trim() === '' ? 0 : topic.trim().split(/\s+/).length
  const isPaid      = !!(usage && (usage.plan !== 'free' || usage.limit === -1))
  const atLimit     = !!(usage && usage.limit !== -1 && usage.used >= usage.limit)
  const canGenerate = topic.trim().length >= 20 && !generating && !atLimit

  const wordCountLabel = (() => {
    if (wordCount === 0) return 'Start typing your idea...'
    if (wordCount < 50)  return `${wordCount} word${wordCount !== 1 ? 's' : ''} — aim for 50+ for best results`
    return `${wordCount} words — great detail!`
  })()

  // ── Rotate loading messages while generating ─────────────────────────────
  useEffect(() => {
    if (!generating) return
    setMsgIdx(0)
    const iv = setInterval(
      () => setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length),
      1500,
    )
    return () => clearInterval(iv)
  }, [generating])

  // ── Generate ─────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!canGenerate) return
    setGenerating(true)
    setSavedSet(new Set())
    setPosts([])

    try {
      const res  = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ topic, tone, niche, variations: 3 }),
      })
      const data = await res.json() as { posts?: GeneratedPost[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setPosts(data.posts ?? [])
      refreshUsage()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed — please try again')
    } finally {
      setGenerating(false)
    }
  }

  // ── Save one post ─────────────────────────────────────────────────────────
  const handleSave = useCallback(async (post: GeneratedPost) => {
    if (savingIdx !== null) return
    setSavingIdx(post.variation)
    try {
      const res = await fetch('/api/posts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          content:          post.content,
          tone,
          niche,
          topic_input:      topic,
          status:           'draft',
          character_count:  post.content.length,
          generation_index: post.variation,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      startTransition(() => {
        setSavedSet(prev => new Set(Array.from(prev).concat(post.variation)))
      })
      toast.success('Post saved to drafts')
    } catch {
      toast.error('Failed to save — please try again')
    } finally {
      setSavingIdx(null)
    }
  }, [savingIdx, tone, niche, topic, startTransition, toast])

  // ── Copy callback ─────────────────────────────────────────────────────────
  const handleCopy = useCallback(() => toast.info('Copied to clipboard'), [toast])

  // ── Save all 3 sequentially ───────────────────────────────────────────────
  const handleSaveAll = async () => {
    for (const post of posts) {
      if (!savedSet.has(post.variation)) await handleSave(post)
    }
  }

  // ── Render states ─────────────────────────────────────────────────────────
  const showEmpty   = !generating && posts.length === 0
  const showLoading = generating
  const showResults = !generating && posts.length > 0

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-20">

      {/* ─────────────────── LEFT PANEL ──────────────────────────────────── */}
      <div className="w-full lg:w-[380px] lg:flex-shrink-0 space-y-5">

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]">Generate LinkedIn posts</h1>
          <p className="text-sm text-gray-400 mt-0.5">3 scroll-stopping variations in seconds.</p>
        </div>

        {/* Topic textarea */}
        <div>
          <label
            htmlFor="topic"
            className="block text-sm font-semibold text-[#0A2540] mb-1.5"
          >
            What do you want to post about?
          </label>
          <textarea
            id="topic"
            ref={textareaRef}
            value={topic}
            onChange={(e) => { setTopic(e.target.value); adjustTextarea() }}
            onInput={adjustTextarea}
            placeholder="E.g. I just landed our first 10 paying customers without spending ₹1 on ads. Here's exactly what worked..."
            rows={4}
            disabled={generating}
            className="w-full border border-[#E5E4E0] rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] transition-colors placeholder:text-gray-400 disabled:opacity-50"
            style={{ minHeight: '104px', overflowY: 'hidden' }}
          />
          <p className={cn(
            'text-xs mt-1.5 transition-colors',
            wordCount === 0  ? 'text-gray-400'
            : wordCount < 50 ? 'text-amber-500'
            :                  'text-[#1D9E75]',
          )}>
            {wordCountLabel}
          </p>
        </div>

        {/* Tone selector */}
        <div>
          <label className="block text-sm font-semibold text-[#0A2540] mb-2">Tone</label>
          <ToneSelector value={tone} onChange={setTone} disabled={generating} />
        </div>

        {/* Niche dropdown */}
        <div>
          <label htmlFor="niche" className="block text-sm font-semibold text-[#0A2540] mb-1.5">
            Niche
          </label>
          <div className="relative">
            <select
              id="niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value as NicheType)}
              disabled={generating}
              className="w-full appearance-none border border-[#E5E4E0] rounded-xl px-4 py-2.5 pr-9 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {NICHE_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Helps tailor examples and context to your audience
          </p>
        </div>

        {/* Usage meter — free plan only */}
        {usage && usage.plan === 'free' && usage.limit !== -1 && (
          <div className="bg-gray-50 rounded-xl px-4 py-3.5 border border-[#E5E4E0] space-y-2">
            <p className="text-xs font-semibold text-gray-600">
              {usage.used} of {usage.limit} free generations used
            </p>
            <UsageMeter
              used={usage.used}
              plan={usage.plan}
              resetDate={usage.resetDate}
              variant="bar"
            />
          </div>
        )}

        {/* Generate / Upgrade CTA */}
        {atLimit ? (
          <a
            href="/settings"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-[#1D9E75] text-white text-sm font-bold shadow hover:opacity-90 transition-opacity"
          >
            Upgrade for unlimited →
          </a>
        ) : (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={cn(
              'w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2',
              'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30',
              canGenerate
                ? 'bg-[#1D9E75] hover:bg-[#178a64] text-white shadow-sm hover:shadow'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            )}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                <span key={msgIdx}>{LOADING_MESSAGES[msgIdx]}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate 3 posts
              </>
            )}
          </button>
        )}
      </div>

      {/* ─────────────────── RIGHT PANEL ─────────────────────────────────── */}
      <div className="flex-1 min-w-0">

        {/* Empty state */}
        {showEmpty && (
          <div className="flex flex-col items-center justify-center h-full min-h-[420px] text-center px-8">
            <svg
              width="80" height="80" viewBox="0 0 80 80" fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mb-5"
              aria-hidden="true"
            >
              <circle cx="40" cy="40" r="38" fill="#E1F5EE" stroke="#1D9E75" strokeWidth="1.5" />
              <ellipse cx="40" cy="44" rx="17" ry="14" fill="#1D9E75" opacity="0.18" />
              <circle cx="32" cy="36" r="4.5" fill="#0A2540" />
              <circle cx="48" cy="36" r="4.5" fill="#0A2540" />
              <circle cx="33.5" cy="34.5" r="1.5" fill="white" />
              <circle cx="49.5" cy="34.5" r="1.5" fill="white" />
              <path d="M33 46 Q40 53 47 46" stroke="#0A2540" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M26 23 L21 13" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M54 23 L59 13" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="65" cy="22" r="2" fill="#1D9E75" opacity="0.5" />
              <circle cx="16" cy="28" r="1.5" fill="#1D9E75" opacity="0.4" />
            </svg>
            <h2 className="text-lg font-bold text-[#0A2540] mb-1.5">
              Your posts will appear here
            </h2>
            <p className="text-sm text-gray-400">Fill in your idea and hit Generate →</p>
          </div>
        )}

        {/* Loading — shimmer skeletons staggered */}
        {showLoading && (
          <div className="space-y-4">
            <SkeletonCard delay={0} />
            <SkeletonCard delay={150} />
            <SkeletonCard delay={300} />
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm font-semibold text-[#0A2540]">
                {posts.length} variations generated
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E5E4E0] text-gray-600 hover:border-[#1D9E75]/50 hover:text-[#0A2540] bg-white transition-all duration-150 disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate variations
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={savingIdx !== null || savedSet.size === posts.length}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1D9E75] hover:bg-[#178a64] text-white transition-all duration-150 disabled:opacity-60"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  {savedSet.size === posts.length ? 'All saved ✓' : 'Save all 3 drafts'}
                </button>
              </div>
            </div>

            {posts.map(post => (
              <PostCard
                key={post.variation}
                post={post}
                tone={tone}
                onSave={() => handleSave(post)}
                onCopy={handleCopy}
                isSaving={savingIdx === post.variation}
                isSaved={savedSet.has(post.variation)}
                isPaid={isPaid}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// ── Page export — Suspense required for useSearchParams in Next.js App Router ─

export default function GeneratePage() {
  return (
    <Suspense fallback={null}>
      <GeneratePageInner />
    </Suspense>
  )
}
