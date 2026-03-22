'use client'

import { useState } from 'react'
import { Calendar, ChevronDown, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import type { PostAnalysis } from '@/types'

interface Props {
  analysis: PostAnalysis
}

export default function AnalyserTimingCard({ analysis }: Props) {
  const { toast } = useToast()
  const timing = analysis.timing_recommendation

  const [showInputs, setShowInputs] = useState(
    analysis.actual_reactions !== undefined
  )
  const [reactions, setReactions] = useState(
    analysis.actual_reactions?.toString() ?? ''
  )
  const [comments, setComments] = useState(
    analysis.actual_comments?.toString() ?? ''
  )
  const [impressions, setImpressions] = useState(
    analysis.actual_impressions?.toString() ?? ''
  )
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!analysis.id) return
    setSaving(true)
    try {
      const body: Record<string, number> = {}
      if (reactions !== '')   body.actual_reactions   = Number(reactions)
      if (comments !== '')    body.actual_comments    = Number(comments)
      if (impressions !== '') body.actual_impressions = Number(impressions)

      const res = await fetch(`/api/analyse/${analysis.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Engagement data saved')
    } catch {
      toast.error('Failed to save engagement data')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* ── Timing card ──────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 space-y-3"
        style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Best time to post</span>
        </div>

        {timing ? (
          <>
            <p className="text-xl font-bold text-gray-900 leading-tight">
              {timing.best_day}
            </p>
            <p
              className="text-base font-semibold"
              style={{ color: '#1D9E75' }}
            >
              {timing.best_time}
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">{timing.reason}</p>
            <p
              className="text-xs px-2.5 py-1 rounded-full inline-block font-medium"
              style={{ background: '#E1F5EE', color: '#0F6E56' }}
            >
              {timing.post_type_note}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-400">No timing data available</p>
        )}
      </div>

      {/* ── Engagement tracking ───────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
      >
        {analysis.actual_reactions !== undefined ? (
          <>
            <p className="text-sm font-semibold text-gray-700">Actual performance</p>
            <EngagementFields
              reactions={reactions}
              comments={comments}
              impressions={impressions}
              setReactions={setReactions}
              setComments={setComments}
              setImpressions={setImpressions}
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: '#1D9E75' }}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save engagement data
            </button>
          </>
        ) : showInputs ? (
          <>
            <p className="text-sm font-semibold text-gray-700">Track actual performance</p>
            <EngagementFields
              reactions={reactions}
              comments={comments}
              impressions={impressions}
              setReactions={setReactions}
              setComments={setComments}
              setImpressions={setImpressions}
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: '#1D9E75' }}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save engagement data
            </button>
          </>
        ) : analysis.id ? (
          <button
            type="button"
            onClick={() => setShowInputs(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            Track actual performance
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

    </div>
  )
}

// ─── Shared input fields ──────────────────────────────────────────────────────

function EngagementFields({
  reactions, comments, impressions,
  setReactions, setComments, setImpressions,
}: {
  reactions: string; comments: string; impressions: string
  setReactions: (v: string) => void
  setComments: (v: string) => void
  setImpressions: (v: string) => void
}) {
  return (
    <div className="space-y-3">
      {[
        { label: 'Reactions', value: reactions, setter: setReactions, required: true },
        { label: 'Comments', value: comments, setter: setComments, required: true },
        { label: 'Impressions (optional)', value: impressions, setter: setImpressions, required: false },
      ].map(({ label, value, setter }) => (
        <div key={label}>
          <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
          <input
            type="number"
            min="0"
            value={value}
            onChange={e => setter(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E4E0',
            }}
          />
        </div>
      ))}
    </div>
  )
}
