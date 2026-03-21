'use client'

import { useState, useEffect } from 'react'
import {
  Briefcase, BookOpen, Zap, GraduationCap, Flame, Award, Heart,
  BarChart2, ShieldOff, Lightbulb, Eye, Trophy, TrendingUp, Layout,
  BookMarked, Telescope, Users, Star, Plus, Pencil, X, ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SYSTEM_TONES, DEFAULT_TONE_IDS } from '@/lib/constants'
import CustomToneModal from '@/components/features/CustomToneModal'
import type { CustomTone, PlanType } from '@/types'

// ── Icon map ──────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Briefcase, BookOpen, Zap, GraduationCap, Flame, Award, Heart,
  BarChart2, ShieldOff, Lightbulb, Eye, Trophy, TrendingUp, Layout,
  BookMarked, Telescope, Users, Star,
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ToneSelectorProps {
  value:                string
  onChange:             (toneId: string, isCustom: boolean, customSystemPrompt?: string) => void
  disabled?:            boolean
  userPlan?:            PlanType
  customTones?:         CustomTone[]
  onCustomToneCreated?: (tone: CustomTone) => void
  /** Compact pill-row mode */
  compact?:             boolean
  favouriteTones?:      string[]
  onFavouriteToggle?:   (toneId: string, next: string[]) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ToneSelector({
  value, onChange, disabled,
  userPlan = 'free',
  customTones = [],
  onCustomToneCreated,
  compact, favouriteTones = [], onFavouriteToggle,
}: ToneSelectorProps) {
  const [showAll, setShowAll]     = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTone, setEditTone]   = useState<CustomTone | undefined>()
  const [deleteId, setDeleteId]   = useState<string | null>(null)
  const [freeMsg, setFreeMsg]     = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowAll(localStorage.getItem('postpika_show_all_tones') === 'true')
    }
  }, [])

  const allSysToneIds = Object.keys(SYSTEM_TONES)
  const toneIds       = showAll ? allSysToneIds : DEFAULT_TONE_IDS

  const toggleShowAll = () => {
    const next = !showAll
    setShowAll(next)
    if (typeof window !== 'undefined') localStorage.setItem('postpika_show_all_tones', String(next))
  }

  const handleDeleteTone = async (id: string) => {
    if (!confirm('Delete this custom tone?')) return
    setDeleteId(id)
    try {
      await fetch(`/api/custom-tones/${id}`, { method: 'DELETE' })
      onCustomToneCreated?.({ id, is_active: false } as CustomTone)
    } finally {
      setDeleteId(null)
    }
  }

  const toggleFavourite = (toneId: string) => {
    if (!onFavouriteToggle) return
    const next = favouriteTones.includes(toneId)
      ? favouriteTones.filter(t => t !== toneId)
      : [...favouriteTones, toneId]
    onFavouriteToggle(toneId, next)
  }

  // ── Compact pill mode ───────────────────────────────────────────────────────
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {allSysToneIds.map(id => {
          const tone     = SYSTEM_TONES[id]
          const selected = value === id
          return (
            <button key={id} type="button" disabled={disabled}
              onClick={() => onChange(id, false)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 disabled:opacity-50 disabled:cursor-not-allowed',
                selected ? 'bg-[#E1F5EE] border-[#1D9E75] text-[#1D9E75]' : 'bg-white border-[#E5E4E0] text-gray-500 hover:border-[#1D9E75]/60',
              )}
            >{tone.label}</button>
          )
        })}
        {customTones.map(ct => (
          <button key={ct.id} type="button" disabled={disabled}
            onClick={() => onChange(ct.id, true, ct.system_prompt)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 disabled:opacity-50 disabled:cursor-not-allowed',
              value === ct.id ? 'bg-[#E1F5EE] border-[#1D9E75] text-[#1D9E75]' : 'bg-white border-[#E5E4E0] text-gray-500 hover:border-[#1D9E75]/60',
            )}
          >{ct.name}</button>
        ))}
      </div>
    )
  }

  // ── Full card grid ──────────────────────────────────────────────────────────
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">PostPika tones</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {toneIds.map(id => {
          const tone     = SYSTEM_TONES[id]
          const Icon     = ICON_MAP[tone.icon] ?? Briefcase
          const selected = value === id
          const isFav    = favouriteTones.includes(id)
          return (
            <button key={id} type="button" disabled={disabled}
              onClick={() => onChange(id, false)}
              className={cn(
                'relative flex flex-col items-start gap-1.5 px-3 py-3 rounded-xl border text-left',
                'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                selected ? 'bg-[#E1F5EE] border-2 border-[#1D9E75] shadow-sm' : 'bg-white border border-[#E5E4E0] hover:border-[#1D9E75] hover:shadow-sm',
              )}
            >
              {onFavouriteToggle && (
                <button type="button"
                  onClick={e => { e.stopPropagation(); toggleFavourite(id) }}
                  className="absolute top-2 right-2 text-gray-300 hover:text-[#1D9E75] transition-colors"
                >
                  <Heart className={cn('w-3 h-3', isFav && 'fill-[#1D9E75] text-[#1D9E75]')} />
                </button>
              )}
              <span style={{ color: tone.colorClass }} className="flex-shrink-0"><Icon className="w-4 h-4" /></span>
              <div>
                <p className={cn('text-xs font-semibold leading-tight', selected ? 'text-[#1D9E75]' : 'text-[#0A2540]')}>{tone.label}</p>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5 pr-4">{tone.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      <button type="button" onClick={toggleShowAll}
        className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-[#1D9E75] transition-colors"
      >
        {showAll
          ? <><ChevronUp className="w-3 h-3" />Show fewer tones</>
          : <><ChevronDown className="w-3 h-3" />Show all {allSysToneIds.length} tones</>}
      </button>

      {/* Custom tones */}
      {customTones.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">My tones</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {customTones.map(ct => {
              const selected = value === ct.id
              return (
                <div key={ct.id}
                  className={cn(
                    'relative flex flex-col items-start gap-1.5 px-3 py-3 rounded-xl border transition-all',
                    selected ? 'bg-[#E1F5EE] border-2 border-[#1D9E75] shadow-sm' : 'bg-white border border-[#E5E4E0] hover:border-[#1D9E75]',
                  )}
                >
                  <button type="button" disabled={disabled}
                    onClick={() => onChange(ct.id, true, ct.system_prompt)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-[#1D9E75] flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-white">{ct.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className={cn('text-xs font-semibold truncate', selected ? 'text-[#1D9E75]' : 'text-[#0A2540]')}>{ct.name}</span>
                    </div>
                    <span className="text-[9px] bg-[#1D9E75]/10 text-[#1D9E75] px-1.5 py-0.5 rounded-full font-semibold">Custom</span>
                  </button>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button type="button" onClick={() => { setEditTone(ct); setModalOpen(true) }}
                      className="p-0.5 text-gray-300 hover:text-[#1D9E75] transition-colors">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => handleDeleteTone(ct.id)}
                      disabled={deleteId === ct.id}
                      className="p-0.5 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Create custom tone */}
      <div className="mt-3">
        {freeMsg ? (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            Custom tones are available on the Starter plan.{' '}
            <a href="/settings" className="underline font-semibold">Upgrade ↗</a>
          </p>
        ) : (
          <button type="button"
            onClick={() => {
              if (userPlan === 'free') { setFreeMsg(true); setTimeout(() => setFreeMsg(false), 4000); return }
              setEditTone(undefined); setModalOpen(true)
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#1D9E75] hover:text-[#178a63] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create custom tone
          </button>
        )}
      </div>

      <CustomToneModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTone(undefined) }}
        onSaved={tone => { onCustomToneCreated?.(tone); setModalOpen(false); setEditTone(undefined) }}
        userPlan={userPlan}
        editTone={editTone}
      />
    </div>
  )
}
