'use client'

import { useState, useEffect, useCallback } from 'react'
import { Anchor, Loader2, Copy, Check, ChevronDown, RefreshCw, Lock, Bookmark, ExternalLink, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HOOK_STYLES, HOOK_CATEGORIES, HOOK_GOALS, NICHE_OPTIONS } from '@/lib/constants'
import type { HookResult, SavedHook, NicheType, Profile } from '@/types'
import { useToast } from '@/components/ui/Toast'

// ── Skeleton ──────────────────────────────────────────────────────────────────

function HookSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E5E4E0] p-4 space-y-2 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-4 w-20 bg-gray-100 rounded-full" />
        <div className="h-3.5 w-14 bg-gray-100 rounded" />
      </div>
      <div className="h-4 w-full bg-gray-100 rounded" />
      <div className="h-4 w-3/4 bg-gray-100 rounded" />
    </div>
  )
}

// ── Hook result card ──────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Curiosity:  'bg-purple-50 text-purple-700',
  Value:      'bg-blue-50 text-blue-700',
  Story:      'bg-amber-50 text-amber-700',
  Engagement: 'bg-[#E1F5EE] text-[#0F6E56]',
  Urgency:    'bg-red-50 text-red-700',
  Authority:  'bg-indigo-50 text-indigo-700',
}

function HookCard({
  hook, onCopy, onSave, saving,
}: {
  hook: HookResult
  onCopy: (text: string) => void
  onSave: (hook: HookResult) => void
  saving: boolean
}) {
  const [copied, setCopied] = useState(false)
  const colorClass = CATEGORY_COLORS[hook.category] ?? 'bg-gray-100 text-gray-600'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hook.content)
      setCopied(true)
      onCopy(hook.content)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      onCopy(hook.content)
    }
  }

  const writePostUrl = `/generate?hook=${encodeURIComponent(hook.content)}`

  return (
    <div className="group bg-white rounded-xl border border-[#E5E4E0] p-4 hover:border-[#1D9E75]/40 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide', colorClass)}>
          {hook.category}
        </span>
        <span className="text-xs text-gray-400 font-medium">{hook.styleLabel}</span>
        <span className="ml-auto text-[10px] text-gray-300">{hook.characterCount}ch</span>
      </div>

      <p className="text-sm text-[#0A2540] font-medium leading-snug mb-3">{hook.content}</p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
            copied
              ? 'bg-[#1D9E75] text-white'
              : 'border border-[#E5E4E0] text-gray-600 hover:border-[#1D9E75]/50 hover:text-[#0A2540] bg-white',
          )}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>

        <button
          type="button"
          onClick={() => onSave(hook)}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E5E4E0] text-gray-600 hover:border-[#1D9E75]/50 hover:text-[#0A2540] bg-white transition-all duration-150 disabled:opacity-50"
        >
          <Bookmark className="w-3.5 h-3.5" />
          Save
        </button>

        <a
          href={writePostUrl}
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-[#1D9E75] hover:underline"
        >
          Write full post <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}

// ── Saved hook card ────────────────────────────────────────────────────────────

function SavedHookCard({ hook, onDelete }: { hook: SavedHook; onDelete: (id: string) => void }) {
  const [copied, setCopied]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const colorClass = CATEGORY_COLORS['Value'] ?? 'bg-gray-100 text-gray-600'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hook.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await fetch(`/api/hooks/saved/${hook.id}`, { method: 'DELETE' })
      onDelete(hook.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E4E0] p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide', colorClass)}>
          {hook.style_label}
        </span>
        <span className="text-[10px] text-gray-300 ml-auto">{hook.niche}</span>
      </div>
      <p className="text-sm text-[#0A2540] font-medium leading-snug mb-3">{hook.content}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
            copied ? 'bg-[#1D9E75] text-white' : 'border border-[#E5E4E0] text-gray-600 hover:border-[#1D9E75]/50 bg-white',
          )}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <a
          href={`/generate?hook=${encodeURIComponent(hook.content)}`}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1D9E75] hover:underline"
        >
          Write post <ExternalLink className="w-3 h-3" />
        </a>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="ml-auto text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
          aria-label="Delete saved hook"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Style toggle pill ─────────────────────────────────────────────────────────

function StylePill({
  label, category, isPremium, isLocked, selected, onToggle,
}: {
  label: string; category: string; isPremium: boolean
  isLocked: boolean; selected: boolean; onToggle: () => void
}) {
  const CATEGORY_BORDER: Record<string, string> = {
    Curiosity:  'border-purple-200 data-[active=true]:bg-purple-600 data-[active=true]:border-purple-600',
    Value:      'border-blue-200 data-[active=true]:bg-blue-600 data-[active=true]:border-blue-600',
    Story:      'border-amber-200 data-[active=true]:bg-amber-600 data-[active=true]:border-amber-600',
    Engagement: 'border-emerald-200 data-[active=true]:bg-[#1D9E75] data-[active=true]:border-[#1D9E75]',
    Urgency:    'border-red-200 data-[active=true]:bg-red-600 data-[active=true]:border-red-600',
  }

  const borderClass = CATEGORY_BORDER[category] ?? 'border-gray-200 data-[active=true]:bg-gray-600'

  return (
    <button
      type="button"
      data-active={selected}
      onClick={isLocked ? undefined : onToggle}
      disabled={isLocked}
      className={cn(
        'relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150',
        borderClass,
        selected ? 'text-white shadow-sm' : 'text-gray-600 bg-white hover:text-[#0A2540]',
        isLocked && 'opacity-50 cursor-not-allowed',
      )}
    >
      {label}
      {isPremium && (
        <Lock className="w-3 h-3 flex-shrink-0" />
      )}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HooksPage() {
  const [idea,           setIdea]           = useState('')
  const [niche,          setNiche]          = useState<NicheType>('Tech/SaaS')
  const [goal,           setGoal]           = useState('comments')
  const [selectedStyles, setSelectedStyles] = useState<Set<string>>(new Set(['curiosity-gap', 'number-hook', 'failure-story']))
  const [hooks,          setHooks]          = useState<HookResult[]>([])
  const [generating,     setGenerating]     = useState(false)
  const [isPaid,         setIsPaid]         = useState(false)
  const [savedHooks,     setSavedHooks]     = useState<SavedHook[]>([])
  const [savingId,       setSavingId]       = useState<string | null>(null)

  const { toast } = useToast()

  // Pre-fill niche + plan from profile; load saved hooks
  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then((d: { profile?: Profile }) => {
        if (d.profile?.niche) setNiche(d.profile.niche)
        if (d.profile?.plan && d.profile.plan !== 'free') setIsPaid(true)
      })
      .catch(() => {})

    fetch('/api/hooks/saved')
      .then(r => r.json())
      .then((d: { savedHooks?: SavedHook[] }) => {
        if (d.savedHooks) setSavedHooks(d.savedHooks)
      })
      .catch(() => {})
  }, [])

  const toggleStyle = useCallback((id: string) => {
    setSelectedStyles(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size > 1) next.delete(id)  // always keep at least 1
      } else {
        if (next.size < 8) next.add(id)     // cap at 8
        else toast.info('You can select up to 8 hook styles at a time')
      }
      return next
    })
  }, [toast])

  const canGenerate = idea.trim().length >= 10 && selectedStyles.size > 0 && !generating

  const handleGenerate = async () => {
    if (!canGenerate) return
    setGenerating(true)
    setHooks([])

    try {
      const res = await fetch('/api/generate/hooks', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          niche,
          goal,
          selectedStyles: Array.from(selectedStyles),
        }),
      })
      const data = await res.json() as { hooks?: HookResult[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setHooks(data.hooks ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed — please try again')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = useCallback(() => toast.info('Copied to clipboard'), [toast])

  const handleSave = useCallback(async (hook: HookResult) => {
    setSavingId(hook.id)
    try {
      const res = await fetch('/api/hooks/saved', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content:     hook.content,
          style_id:    hook.styleId,
          style_label: hook.styleLabel,
          idea_input:  idea,
          niche,
        }),
      })
      const data = await res.json() as { savedHook?: SavedHook; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      if (data.savedHook) setSavedHooks(prev => [data.savedHook!, ...prev])
      toast.success('Hook saved to library')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save hook')
    } finally {
      setSavingId(null)
    }
  }, [idea, niche, toast])

  const handleDeleteSaved = useCallback((id: string) => {
    setSavedHooks(prev => prev.filter(h => h.id !== id))
    toast.info('Hook removed')
  }, [toast])

  const showEmpty   = !generating && hooks.length === 0
  const showLoading = generating
  const showResults = !generating && hooks.length > 0

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-20">

      {/* ─── LEFT PANEL ──────────────────────────────────────────────── */}
      <div className="w-full lg:w-[400px] lg:flex-shrink-0 space-y-5">

        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]">Hook Writer</h1>
          <p className="text-sm text-gray-400 mt-0.5">Generate scroll-stopping opening lines in any style.</p>
        </div>

        {/* Post idea */}
        <div>
          <label htmlFor="idea" className="block text-sm font-semibold text-[#0A2540] mb-1.5">
            What is your post about?
          </label>
          <textarea
            id="idea" value={idea}
            onChange={e => setIdea(e.target.value)}
            placeholder="E.g. I grew my LinkedIn to 5k followers in 60 days without paid ads..."
            rows={3}
            className="w-full border border-[#E5E4E0] rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] transition-colors placeholder:text-gray-400"
            style={{ minHeight: '80px' }}
          />
          <p className={cn(
            'text-xs mt-1 transition-colors',
            idea.trim().length === 0 ? 'text-gray-400' : idea.trim().length < 10 ? 'text-amber-500' : 'text-[#1D9E75]',
          )}>
            {idea.trim().length === 0 ? 'Describe the main point or story of your post' : idea.trim().length < 10 ? 'Add a bit more detail' : 'Good — ready to generate'}
          </p>
        </div>

        {/* Niche */}
        <div>
          <label htmlFor="niche" className="block text-sm font-semibold text-[#0A2540] mb-1.5">Niche</label>
          <div className="relative">
            <select id="niche" value={niche}
              onChange={e => setNiche(e.target.value as NicheType)}
              className="w-full appearance-none border border-[#E5E4E0] rounded-xl px-4 py-2.5 pr-9 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] transition-colors cursor-pointer"
            >
              {NICHE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Goal */}
        <div>
          <label className="block text-sm font-semibold text-[#0A2540] mb-2">Hook goal</label>
          <div className="grid grid-cols-2 gap-2">
            {HOOK_GOALS.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGoal(g.id)}
                className={cn(
                  'flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all duration-150 focus:outline-none',
                  goal === g.id
                    ? 'border-[#1D9E75] bg-[#E1F5EE] text-[#0F6E56]'
                    : 'border-[#E5E4E0] bg-white text-gray-600 hover:border-gray-300',
                )}
              >
                <span className="text-xs font-semibold leading-none mb-0.5">{g.label}</span>
                <span className="text-[10px] leading-tight text-gray-400">{g.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Style selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-[#0A2540]">Hook styles</label>
            <span className="text-xs text-gray-400">{selectedStyles.size} selected</span>
          </div>

          <div className="space-y-3">
            {HOOK_CATEGORIES.map(cat => (
              <div key={cat}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">{cat}</p>
                <div className="flex flex-wrap gap-1.5">
                  {HOOK_STYLES.filter(s => s.category === cat).map(s => (
                    <StylePill
                      key={s.id}
                      label={s.label}
                      category={s.category}
                      isPremium={s.isPremium}
                      isLocked={s.isPremium && !isPaid}
                      selected={selectedStyles.has(s.id)}
                      onToggle={() => toggleStyle(s.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {!isPaid && (
            <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Styles with a lock icon require a paid plan.
              <a href="/settings" className="text-[#1D9E75] underline">Upgrade →</a>
            </p>
          )}
        </div>

        {/* Generate CTA */}
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
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" />Generating hooks...</>
            : <><Anchor className="w-4 h-4" />Generate {selectedStyles.size} hook{selectedStyles.size !== 1 ? 's' : ''}</>
          }
        </button>
      </div>

      {/* ─── RIGHT PANEL ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">

        {showEmpty && (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-8">
            <div className="w-16 h-16 rounded-full bg-[#E1F5EE] flex items-center justify-center mb-4">
              <Anchor className="w-7 h-7 text-[#1D9E75]" />
            </div>
            <h2 className="text-lg font-bold text-[#0A2540] mb-1.5">Your hooks will appear here</h2>
            <p className="text-sm text-gray-400">Select your styles and hit Generate →</p>
          </div>
        )}

        {showLoading && (
          <div className="space-y-3">
            {Array.from(selectedStyles).map((_, i) => (
              <HookSkeleton key={i} />
            ))}
          </div>
        )}

        {showResults && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#0A2540]">
                {hooks.length} hook{hooks.length !== 1 ? 's' : ''} generated
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E5E4E0] text-gray-600 hover:border-[#1D9E75]/50 hover:text-[#0A2540] bg-white transition-all duration-150 disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />Regenerate
              </button>
            </div>

            {/* Group by category */}
            {HOOK_CATEGORIES.filter(cat => hooks.some(h => h.category === cat)).map(cat => (
              <div key={cat}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">{cat}</p>
                <div className="space-y-2">
                  {hooks.filter(h => h.category === cat).map(hook => (
                    <HookCard
                      key={hook.id}
                      hook={hook}
                      onCopy={handleCopy}
                      onSave={handleSave}
                      saving={savingId === hook.id}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Tip */}
            <div className="rounded-xl bg-gray-50 border border-[#E5E4E0] px-4 py-3">
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-[#0A2540]">Tip:</span> Copy your favourite hook, then click{' '}
                <span className="font-medium text-[#0A2540]">&quot;Write full post&quot;</span> to build the complete post around it.
              </p>
            </div>
          </div>
        )}

        {/* ─── SAVED HOOKS ──────────────────────────────────────────── */}
        {savedHooks.length > 0 && (
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#0A2540]">
                Saved hooks
                <span className="ml-1.5 text-xs font-normal text-gray-400">({savedHooks.length})</span>
              </p>
            </div>
            {savedHooks.map(h => (
              <SavedHookCard key={h.id} hook={h} onDelete={handleDeleteSaved} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
