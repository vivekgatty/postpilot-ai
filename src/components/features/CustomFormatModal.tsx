'use client'

import { useState } from 'react'
import { X, Loader2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FORMAT_SKELETONS, SKELETON_SECTION_DEFAULTS } from '@/lib/constants'
import type { CustomFormat, PlanType } from '@/types'

// ── Build format_prompt from sections ─────────────────────────────────────────

function buildFormatPrompt(sections: { label: string; instruction: string }[]) {
  const body = sections.map(s => `${s.label}: ${s.instruction}`).join('. ')
  return `Structure this LinkedIn post as follows: ${body}. Maintain clear visual separation between sections using line breaks.`
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  isOpen:       boolean
  onClose:      () => void
  onSaved:      (format: CustomFormat) => void
  userPlan:     PlanType
  editFormat?:  CustomFormat
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CustomFormatModal({ isOpen, onClose, onSaved, userPlan, editFormat }: Props) {
  const initSkeleton = editFormat
    ? FORMAT_SKELETONS.find(s => s.id === editFormat.config_json?.skeleton) ?? FORMAT_SKELETONS[0]
    : FORMAT_SKELETONS[0]

  const [step, setSkeleton_step] = useState(1)
  const [skeleton, setSkeleton]  = useState(initSkeleton)
  const [sections, setSections]  = useState<{ label: string; instruction: string }[]>(
    editFormat?.config_json?.sections ?? SKELETON_SECTION_DEFAULTS[initSkeleton.id]
  )
  const [name, setName]                 = useState(editFormat?.name ?? '')
  const [promptEditable, setPromptEditable] = useState(false)
  const [customPrompt, setCustomPrompt]     = useState('')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

  if (!isOpen) return null

  if (userPlan === 'free') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-3">📐</div>
          <h2 className="text-lg font-bold text-[#0A2540] mb-2">Custom formats — Starter+</h2>
          <p className="text-sm text-gray-500 mb-6">Custom formats are available on the Starter plan and above. Upgrade to create post structures that match your style.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Maybe later</button>
            <a href="/settings" className="flex-1 py-2.5 rounded-xl bg-[#1D9E75] text-white text-sm font-bold text-center hover:bg-[#178a63]">Upgrade →</a>
          </div>
        </div>
      </div>
    )
  }

  const assembledPrompt = buildFormatPrompt(sections)
  const finalPrompt     = promptEditable ? customPrompt : assembledPrompt

  const goTo = (s: number) => { setError(''); setSkeleton_step(s) }

  const handleSkeletonSelect = (sk: typeof FORMAT_SKELETONS[0]) => {
    setSkeleton(sk)
    setSections(SKELETON_SECTION_DEFAULTS[sk.id])
  }

  const updateSection = (i: number, instruction: string) =>
    setSections(prev => prev.map((s, idx) => idx === i ? { ...s, instruction } : s))

  const handleNext = () => {
    if (step === 2) { setCustomPrompt(assembledPrompt); setPromptEditable(false) }
    goTo(step + 1)
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Please enter a name for this format.'); return }
    setSaving(true)
    setError('')
    try {
      const url    = editFormat ? `/api/custom-formats/${editFormat.id}` : '/api/custom-formats'
      const method = editFormat ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          structure_type: skeleton.id,
          format_prompt: finalPrompt,
          config_json: { skeleton: skeleton.id, sections },
        }),
      })
      const data = await res.json() as { format?: CustomFormat; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      onSaved(data.format!)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const Dots = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1,2,3].map(s => (
        <div key={s} className={cn(
          'w-2 h-2 rounded-full transition-all',
          s === step ? 'bg-[#1D9E75] w-4' : s < step ? 'bg-[#1D9E75]/40' : 'bg-gray-200',
        )} />
      ))}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-[#0A2540]">
            {editFormat ? 'Edit custom format' : 'Create custom format'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <Dots />

          {/* Step 1 — Pick skeleton */}
          {step === 1 && (
            <div>
              <p className="text-sm font-semibold text-[#0A2540] mb-4">Choose your post structure</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {FORMAT_SKELETONS.map(sk => (
                  <button
                    key={sk.id}
                    onClick={() => handleSkeletonSelect(sk)}
                    className={cn(
                      'text-left p-3.5 rounded-xl border transition-all',
                      skeleton.id === sk.id
                        ? 'border-[#1D9E75] bg-[#E1F5EE]'
                        : 'border-gray-200 bg-white hover:border-[#1D9E75]/50',
                    )}
                  >
                    <p className={cn('text-xs font-semibold mb-2', skeleton.id === sk.id ? 'text-[#1D9E75]' : 'text-[#0A2540]')}>{sk.label}</p>
                    <pre className="text-[9px] text-gray-400 font-mono whitespace-pre-wrap leading-relaxed">{sk.preview}</pre>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Edit sections */}
          {step === 2 && (
            <div>
              <p className="text-sm font-semibold text-[#0A2540] mb-1">Describe what goes in each section</p>
              <p className="text-xs text-gray-400 mb-4">Based on your <span className="font-semibold">{skeleton.label}</span> structure</p>
              <div className="space-y-3">
                {sections.map((sec, i) => (
                  <div key={i}>
                    <label className="block text-xs font-semibold text-[#0A2540] mb-1">{sec.label}</label>
                    <input
                      value={sec.instruction}
                      onChange={e => updateSection(i, e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Review & name */}
          {step === 3 && (
            <div>
              <p className="text-sm font-semibold text-[#0A2540] mb-3">Name your format</p>
              <div className="relative mb-4">
                <textarea
                  readOnly={!promptEditable}
                  value={promptEditable ? customPrompt : assembledPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  rows={6}
                  className={cn(
                    'w-full rounded-xl border text-xs p-3 resize-none focus:outline-none',
                    promptEditable
                      ? 'border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 bg-white'
                      : 'border-gray-200 bg-gray-50 text-gray-600',
                  )}
                />
                <button
                  onClick={() => { setCustomPrompt(assembledPrompt); setPromptEditable(e => !e) }}
                  className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-[#1D9E75] hover:underline"
                >
                  <Pencil className="w-3 h-3" />
                  {promptEditable ? 'Lock prompt' : 'Edit prompt'}
                </button>
              </div>
              <label className="block text-xs font-semibold text-[#0A2540] mb-1.5">Format name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={30}
                placeholder="Name your format (e.g. My case study format)"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
              />
              <p className="text-[10px] text-gray-400 mt-1 text-right">{name.length}/30</p>
            </div>
          )}

          {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={() => goTo(step - 1)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                Back
              </button>
            )}
            <div className="flex-1" />
            {step === 2 && (
              <button onClick={() => { setCustomPrompt(assembledPrompt); setPromptEditable(false); goTo(3) }} className="text-xs text-gray-400 hover:text-[#1D9E75]">
                Skip to finish
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-[#1D9E75] text-white text-sm font-semibold hover:bg-[#178a63] transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#1D9E75] text-white text-sm font-semibold hover:bg-[#178a63] disabled:opacity-60 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Saving…' : 'Save custom format'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
