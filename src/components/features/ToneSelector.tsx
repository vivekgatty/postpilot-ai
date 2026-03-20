'use client'

import {
  Briefcase,
  BookOpen,
  Zap,
  GraduationCap,
  Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ToneType } from '@/types'

// ── Tone config ───────────────────────────────────────────────────────────────

interface ToneMeta {
  label:      string
  sub:        string
  Icon:       React.ComponentType<{ className?: string }>
  /** Unselected tint shown on the icon wrapper */
  tintBg:     string
  tintIcon:   string
}

const TONE_META: Record<ToneType, ToneMeta> = {
  professional: {
    label:    'Professional',
    sub:      'Clear, authoritative',
    Icon:     Briefcase,
    tintBg:   'bg-[#0A2540]/8',
    tintIcon: 'text-[#0A2540]',
  },
  storytelling: {
    label:    'Storytelling',
    sub:      'Personal narrative',
    Icon:     BookOpen,
    tintBg:   'bg-purple-50',
    tintIcon: 'text-purple-600',
  },
  controversial: {
    label:    'Controversial',
    sub:      'Bold, sparks debate',
    Icon:     Zap,
    tintBg:   'bg-amber-50',
    tintIcon: 'text-amber-500',
  },
  educational: {
    label:    'Educational',
    sub:      'Teaches something',
    Icon:     GraduationCap,
    tintBg:   'bg-blue-50',
    tintIcon: 'text-blue-600',
  },
  inspirational: {
    label:    'Inspirational',
    sub:      'Motivates and uplifts',
    Icon:     Flame,
    tintBg:   'bg-rose-50',
    tintIcon: 'text-rose-500',
  },
}

const TONES = Object.keys(TONE_META) as ToneType[]

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ToneSelectorProps {
  value:     ToneType
  onChange:  (t: ToneType) => void
  disabled?: boolean
  /** compact renders as a horizontal row of condensed pills (no icons/sublabels) */
  compact?:  boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ToneSelector({ value, onChange, disabled, compact }: ToneSelectorProps) {
  // ── Compact mode: horizontal pill row ───────────────────────────────────
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {TONES.map((tone) => {
          const { label } = TONE_META[tone]
          const selected  = value === tone
          return (
            <button
              key={tone}
              type="button"
              disabled={disabled}
              onClick={() => onChange(tone)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                selected
                  ? 'bg-[#E1F5EE] border-[#1D9E75] text-[#1D9E75]'
                  : 'bg-white border-[#E5E4E0] text-gray-500 hover:border-[#1D9E75]/60 hover:text-[#0A2540]',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    )
  }

  // ── Full card grid ───────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
      {TONES.map((tone) => {
        const { label, sub, Icon, tintBg, tintIcon } = TONE_META[tone]
        const selected = value === tone

        return (
          <button
            key={tone}
            type="button"
            disabled={disabled}
            onClick={() => onChange(tone)}
            className={cn(
              'flex flex-col items-center gap-2 px-3 py-3.5 rounded-xl border text-center',
              'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              selected
                ? 'bg-[#E1F5EE] border-2 border-[#1D9E75] shadow-sm'
                : 'bg-white border border-[#E5E4E0] hover:border-[#1D9E75] hover:shadow-sm',
            )}
          >
            {/* Icon bubble */}
            <div className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150',
              selected ? 'bg-[#1D9E75]/15' : tintBg,
            )}>
              <Icon className={cn(
                'w-4.5 h-4.5 transition-colors duration-150',
                selected ? 'text-[#1D9E75]' : tintIcon,
              )} />
            </div>

            {/* Labels */}
            <div>
              <p className={cn(
                'text-xs font-semibold leading-tight transition-colors duration-150',
                selected ? 'text-[#1D9E75]' : 'text-[#0A2540]',
              )}>
                {label}
              </p>
              <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{sub}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
