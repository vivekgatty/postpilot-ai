'use client'

import { useState } from 'react'
import { X, Loader2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BASE_PERSONALITIES } from '@/lib/constants'
import type { CustomTone, PlanType } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const FORMALITY_LABELS = ['', 'very casual', 'casual', 'balanced', 'professional', 'very formal']
const EMOTION_LABELS   = ['', 'purely logical', 'mostly analytical', 'balanced', 'emotionally aware', 'deeply heartfelt']
const LENGTH_LABELS    = ['', 'very punchy', 'concise', 'balanced', 'detailed', 'comprehensive']
const PERSP_LABELS     = ['', 'very humble', 'grounded', 'balanced', 'self-assured', 'highly authoritative']

const AUDIENCE_OPTIONS = [
  'Founders','Investors','Job Seekers','Sales Teams','Consultants',
  'HR Leaders','Marketing Teams','Engineers','C-Suite','General Professionals','Students','Recruiters',
]

function buildSystemPrompt(personality: string, audience: string[], formality: number, emotion: number, length: number, perspective: number) {
  return `You write LinkedIn posts with a ${personality} communication style for an audience of ${audience.join(' and ')}. Your formality level is ${FORMALITY_LABELS[formality]} (${formality}/5). Your emotional register is ${EMOTION_LABELS[emotion]} (${emotion}/5). Your posts are ${LENGTH_LABELS[length]} (${length}/5). Your perspective is ${PERSP_LABELS[perspective]} (${perspective}/5). Write with these characteristics consistently and authentically.`
}

// ── Slider ────────────────────────────────────────────────────────────────────

function Slider({ label, leftLabel, rightLabel, value, onChange }: {
  label: string; leftLabel: string; rightLabel: string
  value: number; onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-[#0A2540]">{label}</span>
        <span className="text-xs text-[#1D9E75] font-bold">{value}/5</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-400 w-16 text-right">{leftLabel}</span>
        <input
          type="range" min={1} max={5} step={1} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 h-1.5 rounded-full accent-[#1D9E75] cursor-pointer"
        />
        <span className="text-[10px] text-gray-400 w-16">{rightLabel}</span>
      </div>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  isOpen:    boolean
  onClose:   () => void
  onSaved:   (tone: CustomTone) => void
  userPlan:  PlanType
  editTone?: CustomTone   // if provided → edit mode
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CustomToneModal({ isOpen, onClose, onSaved, userPlan, editTone }: Props) {
  const [step, setStep]               = useState(1)
  const [personality, setPersonality] = useState(editTone?.config_json?.base_personality ?? '')
  const [audience, setAudience]       = useState<string[]>(editTone?.config_json?.audience ?? [])
  const [formality, setFormality]     = useState(editTone?.config_json?.formality ?? 3)
  const [emotion, setEmotion]         = useState(editTone?.config_json?.emotion ?? 3)
  const [length, setLength]           = useState(editTone?.config_json?.length ?? 3)
  const [perspective, setPerspective] = useState(editTone?.config_json?.perspective ?? 3)
  const [name, setName]               = useState(editTone?.name ?? '')
  const [promptEditable, setPromptEditable] = useState(false)
  const [customPrompt, setCustomPrompt]     = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  if (!isOpen) return null

  const assembledPrompt = buildSystemPrompt(personality || 'professional', audience.length ? audience : ['professionals'], formality, emotion, length, perspective)
  const finalPrompt     = promptEditable ? customPrompt : assembledPrompt

  // Upgrade gate for free plan
  if (userPlan === 'free') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-3">🎨</div>
          <h2 className="text-lg font-bold text-[#0A2540] mb-2">Custom tones — Starter+</h2>
          <p className="text-sm text-gray-500 mb-6">Custom tones are available on the Starter plan and above. Upgrade to create tones that match your unique voice.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Maybe later</button>
            <a href="/settings" className="flex-1 py-2.5 rounded-xl bg-[#1D9E75] text-white text-sm font-bold text-center hover:bg-[#178a63]">Upgrade →</a>
          </div>
        </div>
      </div>
    )
  }

  const toggleAudience = (opt: string) =>
    setAudience(prev => prev.includes(opt) ? prev.filter(a => a !== opt) : prev.length < 3 ? [...prev, opt] : prev)

  const goTo = (s: number) => {
    setError('')
    setStep(s)
  }

  const handleNext = () => {
    if (step === 1 && !personality) { setError('Please select a base personality.'); return }
    if (step === 2 && audience.length === 0) { setError('Please select at least one audience.'); return }
    if (step === 3) { setCustomPrompt(assembledPrompt); setPromptEditable(false) }
    goTo(step + 1)
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Please enter a name for this tone.'); return }
    setSaving(true)
    setError('')
    try {
      const url    = editTone ? `/api/custom-tones/${editTone.id}` : '/api/custom-tones'
      const method = editTone ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          system_prompt: finalPrompt,
          config_json: { base_personality: personality, audience, formality, emotion, length, perspective },
        }),
      })
      const data = await res.json() as { tone?: CustomTone; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      onSaved(data.tone!)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // ── Progress dots ────────────────────────────────────────────────────────
  const Dots = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1,2,3,4].map(s => (
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
            {editTone ? 'Edit custom tone' : 'Create custom tone'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <Dots />

          {/* Step 1 — Base personality */}
          {step === 1 && (
            <div>
              <p className="text-sm font-semibold text-[#0A2540] mb-4">What is your natural communication style?</p>
              <div className="grid grid-cols-2 gap-2.5">
                {BASE_PERSONALITIES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPersonality(p.id)}
                    className={cn(
                      'text-left p-3.5 rounded-xl border transition-all',
                      personality === p.id
                        ? 'border-[#1D9E75] bg-[#E1F5EE]'
                        : 'border-gray-200 bg-white hover:border-[#1D9E75]/50',
                    )}
                  >
                    <p className={cn('text-xs font-semibold', personality === p.id ? 'text-[#1D9E75]' : 'text-[#0A2540]')}>{p.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Audience */}
          {step === 2 && (
            <div>
              <p className="text-sm font-semibold text-[#0A2540] mb-1">Who do you mainly write for?</p>
              <p className="text-xs text-gray-400 mb-4">Select up to 3</p>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => toggleAudience(opt)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                      audience.includes(opt)
                        ? 'bg-[#1D9E75] border-[#1D9E75] text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-[#1D9E75]/50',
                      !audience.includes(opt) && audience.length >= 3 && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Sliders */}
          {step === 3 && (
            <div>
              <p className="text-sm font-semibold text-[#0A2540] mb-5">Fine-tune your voice</p>
              <div className="space-y-5">
                <Slider label="Formality" leftLabel="Casual" rightLabel="Formal" value={formality} onChange={setFormality} />
                <Slider label="Emotion" leftLabel="Logical" rightLabel="Heartfelt" value={emotion} onChange={setEmotion} />
                <Slider label="Length" leftLabel="Punchy" rightLabel="Detailed" value={length} onChange={setLength} />
                <Slider label="Perspective" leftLabel="Humble" rightLabel="Authoritative" value={perspective} onChange={setPerspective} />
              </div>
            </div>
          )}

          {/* Step 4 — Review & name */}
          {step === 4 && (
            <div>
              <p className="text-sm font-semibold text-[#0A2540] mb-3">Your custom tone is ready</p>
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
              <label className="block text-xs font-semibold text-[#0A2540] mb-1.5">Tone name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={30}
                placeholder="Name your tone (e.g. My founder voice)"
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
            {step < 4 && step > 1 && (
              <button onClick={() => { setCustomPrompt(assembledPrompt); setPromptEditable(false); goTo(4) }} className="text-xs text-gray-400 hover:text-[#1D9E75]">
                Skip to finish
              </button>
            )}
            {step < 4 ? (
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
                {saving ? 'Saving…' : 'Save custom tone'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
