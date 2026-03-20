'use client'

import { useState, useEffect } from 'react'
import IdeaCard, { type WeeklyIdea } from '@/components/features/IdeaCard'
import { NICHE_OPTIONS }             from '@/lib/constants'
import type { NicheType }            from '@/types'

// ── Shimmer skeleton ──────────────────────────────────────────────────────────

function IdeaSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 animate-pulse">
      <div className="w-20 h-6 bg-gray-100 rounded-full" />
      <div className="space-y-1.5">
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-4/5" />
      </div>
      <div className="space-y-1">
        <div className="h-3 bg-gray-100 rounded w-20" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
      <div className="w-28 h-4 bg-gray-100 rounded mt-auto" />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IdeasPage() {
  const [niche,     setNiche]     = useState<NicheType>('Tech/SaaS')
  const [ideas,     setIdeas]     = useState<WeeklyIdea[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)

  // Pre-fill niche from profile
  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then((d: { profile?: { niche?: NicheType } }) => {
        if (d.profile?.niche) setNiche(d.profile.niche)
      })
      .catch(() => null)
  }, [])

  async function handleGenerate() {
    setLoading(true)
    setError(null)

    try {
      const res  = await fetch('/api/generate/ideas', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ niche }),
      })
      const data = await res.json() as {
        ideas?:      WeeklyIdea[]
        remaining?:  number
        error?:      string
        message?:    string
      }

      if (!res.ok) throw new Error(data.message ?? data.error ?? 'Failed to generate ideas')

      setIdeas(data.ideas ?? [])
      if (data.remaining !== undefined) setRemaining(data.remaining)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0A2540]">Idea Lab</h1>
        <p className="text-gray-500 mt-1 text-sm">Never run out of things to post about.</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Your niche
        </label>
        <select
          value={niche}
          onChange={e => setNiche(e.target.value as NicheType)}
          disabled={loading}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white
                     focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10
                     mb-4 disabled:opacity-50"
        >
          {NICHE_OPTIONS.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#1D9E75] text-white text-sm font-semibold
                     hover:bg-[#178a63] active:scale-[0.98] transition-all
                     disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating…
            </>
          ) : (
            'Generate 7 ideas for this week'
          )}
        </button>

        {remaining !== null && (
          <p className="text-xs text-gray-400 text-center mt-2">
            {remaining} idea generation{remaining !== 1 ? 's' : ''} remaining today
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <IdeaSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && ideas.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[#0A2540]">
              This week&rsquo;s ideas for <span className="text-[#1D9E75]">{niche}</span>
            </p>
            <button
              onClick={handleGenerate}
              className="text-xs text-gray-400 hover:text-[#1D9E75] transition-colors"
            >
              Regenerate ↻
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ideas.map((idea, i) => (
              <IdeaCard key={i} idea={idea} />
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && ideas.length === 0 && !error && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">💡</div>
          <p className="font-semibold text-gray-600">Your weekly ideas will appear here</p>
          <p className="text-sm mt-1">
            Select your niche above and click Generate — takes about 5 seconds.
          </p>
        </div>
      )}
    </div>
  )
}
