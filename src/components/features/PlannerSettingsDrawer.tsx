'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PLANNER_GOALS, PILLAR_COLORS, POSTING_DAYS } from '@/lib/plannerConfig'
import { SYSTEM_TONES } from '@/lib/constants'
import type { ContentPillar, PlannerSettings, LinkedInConnection } from '@/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  pillars:     ContentPillar[]
  settings:    PlannerSettings
  connection:  LinkedInConnection | null
  onClose:     () => void
  onSaved:     (settings: PlannerSettings, pillars: ContentPillar[]) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlannerSettingsDrawer({ pillars: initialPillars, settings: initialSettings, connection, onClose, onSaved }: Props) {
  const [settings, setSettings]       = useState(initialSettings)
  const [pillars, setPillars]         = useState(initialPillars)
  const [editIdx, setEditIdx]         = useState<number | null>(null)
  const [isSaving, setIsSaving]             = useState(false)
  const [saveSuccess, setSaveSuccess]       = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null)

  const updateSettings = (patch: Partial<PlannerSettings>) => {
    setSettings((s) => ({ ...s, ...patch }))
  }

  const updatePillar = (i: number, patch: Partial<ContentPillar>) => {
    setPillars((prev) => prev.map((p, idx) => idx === i ? { ...p, ...patch } : p))
  }

  const toggleGoal = (id: string) => {
    const goals = settings.goals.includes(id)
      ? settings.goals.filter((g) => g !== id)
      : settings.goals.length < 4 ? [...settings.goals, id] : settings.goals
    updateSettings({ goals })
  }

  const toggleDay = (day: string) => {
    const days = settings.preferred_days.includes(day)
      ? settings.preferred_days.filter((d) => d !== day)
      : [...settings.preferred_days, day]
    updateSettings({ preferred_days: days })
  }

  const updateFormatMix = (key: keyof PlannerSettings['format_mix'], value: number) => {
    const others = (Object.keys(settings.format_mix) as (keyof PlannerSettings['format_mix'])[])
      .filter((k) => k !== key && k !== 'text')
    const otherSum = others.reduce((s, k) => s + settings.format_mix[k], 0)
    const text = Math.max(0, 100 - value - otherSum)
    updateSettings({ format_mix: { ...settings.format_mix, [key]: value, text } })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save settings
      const settingsRes = await fetch('/api/planner/settings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(settings),
      })
      const settingsData = await settingsRes.json() as { settings: PlannerSettings }

      // Update each pillar
      const updatedPillars = await Promise.all(
        pillars.map(async (p) => {
          const res = await fetch(`/api/planner/pillars/${p.id}`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ name: p.name, description: p.description, color: p.color, weight: p.weight, tone_id: p.tone_id }),
          })
          const d = await res.json() as { pillar: ContentPillar }
          return d.pillar ?? p
        }),
      )

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      onSaved(settingsData.settings, updatedPillars)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDisconnectLinkedIn = async () => {
    if (!confirm('Disconnect your LinkedIn account?')) return
    setIsDisconnecting(true)
    try {
      await fetch('/api/linkedin/publish', { method: 'DELETE' }).catch(() => {})
      onSaved(settings, pillars)
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/20" onClick={onClose} />
      <aside className="fixed right-0 top-0 bottom-0 z-40 w-[380px] bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-[#0A2540]">Planner Settings</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8 pb-24">

          {/* Section 1 — Content Pillars */}
          <section>
            <h3 className="text-sm font-bold text-[#0A2540] mb-3">Content Pillars</h3>
            <div className="space-y-3">
              {pillars.map((pillar, i) => (
                <div key={pillar.id} className="border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowColorPicker(showColorPicker === i ? null : i)}
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                        style={{ backgroundColor: pillar.color }}
                      />
                      {showColorPicker === i && (
                        <div className="absolute top-8 left-0 z-10 p-2 bg-white rounded-lg shadow-lg border flex gap-1">
                          {PILLAR_COLORS.map((c) => (
                            <button key={c} type="button"
                              onClick={() => { updatePillar(i, { color: c }); setShowColorPicker(null) }}
                              className="w-5 h-5 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                              style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      )}
                    </div>
                    {editIdx === i ? (
                      <input
                        autoFocus
                        value={pillar.name}
                        onChange={(e) => updatePillar(i, { name: e.target.value })}
                        onBlur={() => setEditIdx(null)}
                        className="flex-1 text-sm font-medium border-b border-[#1D9E75] focus:outline-none bg-transparent"
                      />
                    ) : (
                      <button type="button" onClick={() => setEditIdx(i)} className="flex-1 text-left text-sm font-medium text-[#0A2540] hover:text-[#1D9E75]">
                        {pillar.name}
                      </button>
                    )}
                  </div>
                  <input
                    value={pillar.description}
                    onChange={(e) => updatePillar(i, { description: e.target.value })}
                    placeholder="Description"
                    className="w-full text-xs border border-gray-100 rounded-lg px-2 py-1.5 mb-2 focus:outline-none focus:ring-1 focus:ring-[#1D9E75] bg-gray-50"
                  />
                  <div className="flex gap-2">
                    <select value={pillar.weight} onChange={(e) => updatePillar(i, { weight: e.target.value as 'high' | 'medium' | 'low' })}
                      className="flex-1 text-xs border border-gray-100 rounded-lg px-1.5 py-1.5 focus:outline-none bg-gray-50">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <select value={pillar.tone_id} onChange={(e) => updatePillar(i, { tone_id: e.target.value })}
                      className="flex-1 text-xs border border-gray-100 rounded-lg px-1.5 py-1.5 focus:outline-none bg-gray-50">
                      {Object.values(SYSTEM_TONES).map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2 — Schedule */}
          <section>
            <h3 className="text-sm font-bold text-[#0A2540] mb-3">Posting Schedule</h3>
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Frequency: <strong>{settings.posting_frequency}× per week</strong></p>
              <input type="range" min={1} max={7} step={1}
                value={settings.posting_frequency}
                onChange={(e) => updateSettings({ posting_frequency: Number(e.target.value) })}
                className="w-full accent-[#1D9E75]" />
            </div>
            <p className="text-xs text-gray-500 mb-2">Preferred days</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {POSTING_DAYS.map((day) => (
                <button key={day} type="button" onClick={() => toggleDay(day)}
                  className={cn('text-xs px-2.5 py-1 rounded-full font-medium transition-all',
                    settings.preferred_days.includes(day) ? 'bg-[#1D9E75] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
            <label className="text-xs text-gray-500 block mb-1">Preferred time</label>
            <input type="time" value={settings.preferred_time}
              onChange={(e) => updateSettings({ preferred_time: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1D9E75]" />
          </section>

          {/* Section 3 — Format mix */}
          <section>
            <h3 className="text-sm font-bold text-[#0A2540] mb-3">Format Mix</h3>
            <div className="flex h-2 rounded-full overflow-hidden mb-4">
              <div style={{ width: `${settings.format_mix.text}%`, backgroundColor: '#1D9E75' }} />
              <div style={{ width: `${settings.format_mix.carousel}%`, backgroundColor: '#534AB7' }} />
              <div style={{ width: `${settings.format_mix.poll}%`, backgroundColor: '#BA7517' }} />
              <div style={{ width: `${settings.format_mix.question}%`, backgroundColor: '#185FA5' }} />
            </div>
            {(['text', 'carousel', 'poll', 'question'] as const).map((fmt) => {
              const colors: Record<string, string> = { text: '#1D9E75', carousel: '#534AB7', poll: '#BA7517', question: '#185FA5' }
              return (
                <div key={fmt} className="mb-3">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-xs text-gray-600 capitalize">{fmt}</span>
                    <span className="text-xs font-bold" style={{ color: colors[fmt] }}>{settings.format_mix[fmt]}%</span>
                  </div>
                  <input type="range" min={0} max={80} step={5}
                    value={settings.format_mix[fmt]}
                    onChange={(e) => updateFormatMix(fmt, Number(e.target.value))}
                    className="w-full" style={{ accentColor: colors[fmt] }} />
                </div>
              )
            })}
          </section>

          {/* Section 4 — LinkedIn connection */}
          <section>
            <h3 className="text-sm font-bold text-[#0A2540] mb-3">LinkedIn Connection</h3>
            {connection ? (
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-sm font-medium text-green-700 mb-1">✓ Connected</p>
                <p className="text-xs text-gray-500">
                  Connected {new Date(connection.connected_at).toLocaleDateString('en-IN')}.
                  Token expires {new Date(connection.token_expires_at).toLocaleDateString('en-IN')}.
                </p>
                <button type="button" onClick={handleDisconnectLinkedIn}
                  disabled={isDisconnecting}
                  className="mt-3 text-xs text-red-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed">
                  {isDisconnecting ? 'Disconnecting…' : 'Disconnect LinkedIn'}
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-3">Not connected. Connect to post directly from PostPika.</p>
                <a href="/api/linkedin/connect"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A66C2] text-white text-sm font-medium rounded-lg hover:bg-[#0858a8] transition-colors">
                  Connect LinkedIn
                </a>
              </div>
            )}
          </section>

          {/* Section 5 — Goals */}
          <section>
            <h3 className="text-sm font-bold text-[#0A2540] mb-3">Goals</h3>
            <div className="grid grid-cols-1 gap-2">
              {PLANNER_GOALS.map((goal) => (
                <button key={goal.id} type="button" onClick={() => toggleGoal(goal.id)}
                  className={cn('text-left px-3 py-2.5 rounded-lg border transition-all text-sm',
                    settings.goals.includes(goal.id)
                      ? 'border-[#1D9E75] bg-[#E1F5EE] text-[#0A2540]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                  {goal.label}
                </button>
              ))}
            </div>
          </section>

        </div>

        {/* Sticky save button */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
          {saveSuccess && <p className="text-xs text-green-600 text-center mb-2">Settings saved!</p>}
          <button type="button" onClick={handleSave} disabled={isSaving}
            className="w-full py-3 rounded-xl bg-[#1D9E75] text-white font-bold hover:bg-[#178a64] disabled:opacity-50 transition-colors">
            {isSaving ? 'Saving…' : 'Save settings'}
          </button>
        </div>

      </aside>
    </>
  )
}
