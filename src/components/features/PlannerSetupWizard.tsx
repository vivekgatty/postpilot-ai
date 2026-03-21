'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PLANNER_GOALS, PILLAR_COLORS, PILLAR_SUGGESTIONS, POSTING_DAYS } from '@/lib/plannerConfig'
import { SYSTEM_TONES } from '@/lib/constants'
import type { ContentPillar, PlannerSettings } from '@/types'
import Spinner from '@/components/ui/Spinner'

// ─── Goal icons ───────────────────────────────────────────────────────────────

const GOAL_ICONS: Record<string, string> = {
  clients:    '🤝',
  authority:  '🏆',
  investors:  '💰',
  job:        '💼',
  network:    '🌐',
  speaking:   '🎤',
  traffic:    '📣',
  visibility: '✨',
}

// ─── Draft pillar shape for wizard ───────────────────────────────────────────

interface DraftPillar {
  name:        string
  description: string
  color:       string
  weight:      'high' | 'medium' | 'low'
  tone_id:     string
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  userNiche: string
  onComplete: (settings: PlannerSettings, pillars: ContentPillar[]) => void
}

export default function PlannerSetupWizard({ userNiche, onComplete }: Props) {
  const [step, setStep]       = useState(1)
  const TOTAL_STEPS           = 5

  // Step 1 — Goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])

  // Step 2 — Pillars
  const [pillars, setPillars]             = useState<DraftPillar[]>([])
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null)

  // Step 3 — Frequency
  const [frequency, setFrequency]         = useState(3)
  const [selectedDays, setSelectedDays]   = useState<string[]>(['Tuesday', 'Wednesday', 'Thursday'])
  const [preferredTime, setPreferredTime] = useState('08:00')

  // Step 4 — Format mix
  const [formatMix, setFormatMix]         = useState({ text: 60, carousel: 20, poll: 10, question: 10 })

  // Saving state
  const [isSaving, setIsSaving]           = useState(false)
  const [saveError, setSaveError]         = useState<string | null>(null)

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id)
        ? prev.filter((g) => g !== id)
        : prev.length < 4 ? [...prev, id] : prev,
    )
  }

  const autoGeneratePillars = () => {
    const suggestions = PILLAR_SUGGESTIONS[userNiche] ?? PILLAR_SUGGESTIONS['Other']
    setPillars(
      suggestions.map((s, i) => ({
        name:        s.name,
        description: s.description,
        color:       PILLAR_COLORS[i % PILLAR_COLORS.length],
        weight:      i === 0 ? 'high' : 'medium',
        tone_id:     s.tone_id,
      })),
    )
  }

  const addPillar = () => {
    if (pillars.length >= 4) return
    setPillars((prev) => [...prev, {
      name:        '',
      description: '',
      color:       PILLAR_COLORS[prev.length % PILLAR_COLORS.length],
      weight:      'medium',
      tone_id:     'professional',
    }])
  }

  const updatePillar = (i: number, patch: Partial<DraftPillar>) => {
    setPillars((prev) => prev.map((p, idx) => idx === i ? { ...p, ...patch } : p))
  }

  const removePillar = (i: number) => {
    setPillars((prev) => prev.filter((_, idx) => idx !== i))
  }

  // Auto-select default days based on frequency
  const applyFrequency = (n: number) => {
    setFrequency(n)
    const defaults: Record<number, string[]> = {
      1: ['Wednesday'],
      2: ['Tuesday', 'Thursday'],
      3: ['Tuesday', 'Wednesday', 'Thursday'],
      4: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
      5: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      6: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      7: POSTING_DAYS,
    }
    setSelectedDays(defaults[n] ?? ['Tuesday', 'Wednesday', 'Thursday'])
  }

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  // Format mix: when a non-text slider changes, compensate via text
  const updateFormatMix = (key: keyof typeof formatMix, value: number) => {
    const others = (Object.keys(formatMix) as (keyof typeof formatMix)[]).filter((k) => k !== key && k !== 'text')
    const otherSum = others.reduce((s, k) => s + formatMix[k], 0)
    const text = Math.max(0, 100 - value - otherSum)
    setFormatMix((prev) => ({ ...prev, [key]: value, text }))
  }

  const frequencyLabel = (n: number) => {
    if (n === 1) return '1x per week — good start'
    if (n <= 3)  return `${n}x per week — ideal for most`
    if (n <= 5)  return `${n}x per week — serious growth mode`
    return `${n}x per week — full commitment`
  }

  const recommendedFrequency = () => {
    if (selectedGoals.includes('investors') || selectedGoals.includes('clients')) return '3-4x per week'
    if (selectedGoals.includes('authority') || selectedGoals.includes('visibility')) return '4-5x per week'
    if (selectedGoals.includes('job')) return '3x per week'
    return '3-4x per week'
  }

  // ── Save and complete ─────────────────────────────────────────────────────────

  const handleComplete = async (skipGenerate = false) => {
    setIsSaving(true)
    setSaveError(null)

    try {
      const settings: Omit<PlannerSettings, 'user_id'> = {
        goals:             selectedGoals,
        posting_frequency: frequency,
        preferred_days:    selectedDays,
        preferred_time:    preferredTime,
        format_mix:        formatMix,
        setup_completed:   true,
      }

      // Save settings
      const settingsRes = await fetch('/api/planner/settings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(settings),
      })
      const settingsData = await settingsRes.json() as { settings: PlannerSettings }

      // Save each pillar
      const savedPillars: ContentPillar[] = []
      for (let i = 0; i < pillars.length; i++) {
        const pillar = pillars[i]
        const res = await fetch('/api/planner/pillars', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ ...pillar, position: i }),
        })
        const d = await res.json() as { pillar: ContentPillar }
        if (d.pillar) savedPillars.push(d.pillar)
      }

      if (!skipGenerate) {
        const now = new Date()
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        await fetch('/api/planner/generate', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ month, regenerateAll: false }),
        })
      }

      onComplete(settingsData.settings, savedPillars)
    } catch {
      setSaveError('Something went wrong. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Validation ────────────────────────────────────────────────────────────────

  const canProceed = () => {
    if (step === 1) return selectedGoals.length >= 1
    if (step === 2) return pillars.length >= 2 && pillars.every((p) => p.name.trim())
    if (step === 3) return selectedDays.length >= 1
    return true
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-full transition-all',
                i + 1 === step ? 'w-6 h-2.5 bg-[#1D9E75]' :
                i + 1 < step  ? 'w-2.5 h-2.5 bg-[#1D9E75]/40' :
                                 'w-2.5 h-2.5 bg-gray-200',
              )}
            />
          ))}
        </div>

        {/* ── Step 1: Goals ────────────────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-[#0A2540] text-center mb-2">
              What are you trying to achieve on LinkedIn?
            </h1>
            <p className="text-sm text-gray-500 text-center mb-8">Select up to 4 goals</p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {PLANNER_GOALS.map((goal) => {
                const selected = selectedGoals.includes(goal.id)
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all',
                      selected
                        ? 'border-[#1D9E75] bg-[#E1F5EE] text-[#0A2540]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                    )}
                  >
                    <span className="text-xl flex-shrink-0">{GOAL_ICONS[goal.id]}</span>
                    <span className="text-sm font-medium leading-tight">{goal.label}</span>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canProceed()}
              className="w-full py-3 rounded-xl bg-[#1D9E75] text-white font-semibold disabled:opacity-40 hover:bg-[#178a64] transition-colors"
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── Step 2: Pillars ──────────────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-[#0A2540] text-center mb-2">
              Define your content pillars
            </h1>
            <p className="text-sm text-gray-500 text-center mb-6 max-w-md mx-auto">
              Content pillars are the 2–4 main themes you post about. They keep your content focused and your audience engaged.
            </p>

            {pillars.length === 0 && (
              <div className="flex gap-3 mb-6">
                <button
                  type="button"
                  onClick={autoGeneratePillars}
                  className="flex-1 py-4 rounded-xl bg-[#1D9E75] text-white font-semibold hover:bg-[#178a64] transition-colors"
                >
                  ✨ Auto-generate pillars for me
                </button>
                <button
                  type="button"
                  onClick={addPillar}
                  className="flex-1 py-4 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 transition-colors"
                >
                  Build my own pillars
                </button>
              </div>
            )}

            {pillars.map((pillar, i) => (
              <div key={i} className="mb-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3 mb-3">
                  {/* Color picker */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowColorPicker(showColorPicker === i ? null : i)}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: pillar.color }}
                    />
                    {showColorPicker === i && (
                      <div className="absolute top-10 left-0 z-10 p-2 bg-white rounded-lg shadow-lg border border-gray-200 flex gap-1">
                        {PILLAR_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => { updatePillar(i, { color: c }); setShowColorPicker(null) }}
                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Pillar name (e.g. Building in public)"
                    maxLength={50}
                    value={pillar.name}
                    onChange={(e) => updatePillar(i, { name: e.target.value })}
                    className="flex-1 text-sm font-medium bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30"
                  />

                  {pillars.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removePillar(i)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Brief description (max 100 chars)"
                  maxLength={100}
                  value={pillar.description}
                  onChange={(e) => updatePillar(i, { description: e.target.value })}
                  className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30"
                />

                <div className="flex gap-3">
                  <select
                    value={pillar.weight}
                    onChange={(e) => updatePillar(i, { weight: e.target.value as 'high' | 'medium' | 'low' })}
                    className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-2 py-2 focus:outline-none"
                  >
                    <option value="high">High frequency</option>
                    <option value="medium">Medium frequency</option>
                    <option value="low">Low frequency</option>
                  </select>
                  <select
                    value={pillar.tone_id}
                    onChange={(e) => updatePillar(i, { tone_id: e.target.value })}
                    className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-2 py-2 focus:outline-none"
                  >
                    {Object.values(SYSTEM_TONES).map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            {pillars.length > 0 && pillars.length < 4 && (
              <button
                type="button"
                onClick={addPillar}
                className="text-sm text-[#1D9E75] hover:underline mb-6 block"
              >
                + Add another pillar
              </button>
            )}

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setStep(1)} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!canProceed()}
                className="flex-1 py-3 rounded-xl bg-[#1D9E75] text-white font-semibold disabled:opacity-40 hover:bg-[#178a64] transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Frequency ────────────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-[#0A2540] text-center mb-2">
              How often do you want to post?
            </h1>
            <p className="text-sm text-[#1D9E75] text-center font-medium mb-8">
              Recommended for your goals: {recommendedFrequency()}
            </p>

            {/* Frequency slider */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-[#0A2540]">{frequency}×</span>
                <span className="text-sm text-gray-500">{frequencyLabel(frequency)}</span>
              </div>
              <input
                type="range"
                min={1}
                max={7}
                step={1}
                value={frequency}
                onChange={(e) => applyFrequency(Number(e.target.value))}
                className="w-full accent-[#1D9E75]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1</span><span>7</span>
              </div>
            </div>

            {/* Days selector */}
            <p className="text-sm font-medium text-[#0A2540] mb-2">Which days?</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {POSTING_DAYS.map((day) => {
                const active = selectedDays.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      active
                        ? 'bg-[#1D9E75] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    )}
                  >
                    {day.slice(0, 3)}
                  </button>
                )
              })}
            </div>

            {/* Time */}
            <p className="text-sm font-medium text-[#0A2540] mb-2">What time?</p>
            <input
              type="time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 mb-1"
            />
            <p className="text-xs text-gray-400 mb-6">Research shows 7–9am and 12–1pm get highest LinkedIn reach.</p>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!canProceed()}
                className="flex-1 py-3 rounded-xl bg-[#1D9E75] text-white font-semibold disabled:opacity-40 hover:bg-[#178a64] transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Format mix ───────────────────────────────────────────────── */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold text-[#0A2540] text-center mb-2">
              What types of content will you create?
            </h1>
            <p className="text-sm text-gray-500 text-center mb-8">Sliders must total 100%</p>

            {/* Visual bar preview */}
            <div className="flex h-4 rounded-full overflow-hidden mb-8">
              <div style={{ width: `${formatMix.text}%`,     backgroundColor: '#1D9E75' }} />
              <div style={{ width: `${formatMix.carousel}%`, backgroundColor: '#534AB7' }} />
              <div style={{ width: `${formatMix.poll}%`,     backgroundColor: '#BA7517' }} />
              <div style={{ width: `${formatMix.question}%`, backgroundColor: '#185FA5' }} />
            </div>

            {(['text', 'carousel', 'poll', 'question'] as const).map((fmt) => {
              const colors: Record<string, string> = { text: '#1D9E75', carousel: '#534AB7', poll: '#BA7517', question: '#185FA5' }
              const labels: Record<string, string> = { text: 'Text posts', carousel: 'Carousels', poll: 'Poll posts', question: 'Question posts' }
              return (
                <div key={fmt} className="mb-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{labels[fmt]}</span>
                    <span className="text-sm font-bold" style={{ color: colors[fmt] }}>{formatMix[fmt]}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    step={5}
                    value={formatMix[fmt]}
                    onChange={(e) => updateFormatMix(fmt, Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: colors[fmt] }}
                  />
                </div>
              )
            })}

            <button
              type="button"
              onClick={() => setFormatMix({ text: 60, carousel: 20, poll: 10, question: 10 })}
              className="text-sm text-[#1D9E75] hover:underline mb-6 block"
            >
              Use recommended defaults
            </button>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(3)} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="flex-1 py-3 rounded-xl bg-[#1D9E75] text-white font-semibold hover:bg-[#178a64] transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Ready ────────────────────────────────────────────────────── */}
        {step === 5 && (
          <div>
            <h1 className="text-2xl font-bold text-[#0A2540] text-center mb-2">
              Your content plan is ready to generate
            </h1>
            <p className="text-sm text-gray-500 text-center mb-8">Review your setup before generating</p>

            {/* Summary card */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 space-y-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Goals</p>
                <p className="text-sm text-[#0A2540] font-medium">{selectedGoals.length} selected</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Content pillars</p>
                <div className="flex flex-wrap gap-2">
                  {pillars.map((p, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Posting schedule</p>
                <p className="text-sm text-[#0A2540] font-medium">
                  {frequency}× per week on {selectedDays.join(', ')} at {preferredTime}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Format mix</p>
                <p className="text-sm text-[#0A2540] font-medium">
                  {formatMix.text}% text · {formatMix.carousel}% carousel · {formatMix.poll}% poll · {formatMix.question}% question
                </p>
              </div>
            </div>

            {saveError && (
              <p className="text-sm text-red-600 text-center mb-4">{saveError}</p>
            )}

            <button
              type="button"
              onClick={() => handleComplete(false)}
              disabled={isSaving}
              className="w-full py-4 rounded-xl bg-[#1D9E75] text-white font-bold text-base hover:bg-[#178a64] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mb-3"
            >
              {isSaving ? (
                <><Spinner /> Generating your plan...</>
              ) : (
                'Generate my first month\'s plan →'
              )}
            </button>

            <button
              type="button"
              onClick={() => handleComplete(true)}
              disabled={isSaving}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
            >
              I&apos;ll do this later
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
