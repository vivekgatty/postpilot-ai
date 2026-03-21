'use client'

import { useState } from 'react'
import {
  List, ArrowRightLeft, CalendarCheck, Mail, Columns, FileSearch,
  MessageSquare, AlignLeft, HelpCircle, BookMarked, BarChart, AlertOctagon,
  Heart, Plus, Pencil, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SYSTEM_FORMATS } from '@/lib/constants'
import CustomFormatModal from '@/components/features/CustomFormatModal'
import type { CustomFormat, PlanType } from '@/types'

// ── Icon map ──────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  List, ArrowRightLeft, CalendarCheck, Mail, Columns, FileSearch,
  MessageSquare, AlignLeft, HelpCircle, BookMarked, BarChart, AlertOctagon,
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface FormatSelectorProps {
  value:                 string
  onChange:              (formatId: string, isCustom: boolean, customFormatPrompt?: string) => void
  disabled?:             boolean
  userPlan:              PlanType
  customFormats:         CustomFormat[]
  onCustomFormatCreated: (format: CustomFormat) => void
  favouriteFormats?:     string[]
  onFavouriteToggle?:    (formatId: string, next: string[]) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FormatSelector({
  value, onChange, disabled, userPlan, customFormats, onCustomFormatCreated,
  favouriteFormats = [], onFavouriteToggle,
}: FormatSelectorProps) {
  const [modalOpen, setModalOpen]   = useState(false)
  const [editFormat, setEditFormat] = useState<CustomFormat | undefined>()
  const [deleteId, setDeleteId]     = useState<string | null>(null)
  const [freeMsg, setFreeMsg]       = useState(false)

  const systemFormatIds = Object.keys(SYSTEM_FORMATS)

  const handleDeleteFormat = async (id: string) => {
    if (!confirm('Delete this custom format?')) return
    setDeleteId(id)
    try {
      await fetch(`/api/custom-formats/${id}`, { method: 'DELETE' })
      onCustomFormatCreated({ id, is_active: false } as CustomFormat)
    } finally {
      setDeleteId(null)
    }
  }

  const toggleFavourite = (formatId: string) => {
    if (!onFavouriteToggle) return
    const next = favouriteFormats.includes(formatId)
      ? favouriteFormats.filter(f => f !== formatId)
      : [...favouriteFormats, formatId]
    onFavouriteToggle(formatId, next)
  }

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Post formats</p>

      {/* System format cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {systemFormatIds.map(id => {
          const fmt      = SYSTEM_FORMATS[id]
          const Icon     = ICON_MAP[fmt.icon] ?? List
          const selected = value === id
          const isFav    = favouriteFormats.includes(id)
          return (
            <button key={id} type="button" disabled={disabled}
              onClick={() => onChange(id, false)}
              className={cn(
                'relative flex flex-col items-start gap-1 px-3 py-3 rounded-xl border text-left',
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
              <Icon className="w-4 h-4 flex-shrink-0 text-[#1D9E75]" />
              <div>
                <p className={cn('text-xs font-semibold leading-tight pr-4', selected ? 'text-[#1D9E75]' : 'text-[#0A2540]')}>{fmt.label}</p>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5 pr-4">{fmt.description}</p>
                <p className="text-[9px] italic text-gray-300 leading-tight mt-0.5 pr-4 truncate">{fmt.example}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Custom formats */}
      {customFormats.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">My formats</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {customFormats.map(cf => {
              const selected = value === cf.id
              return (
                <div key={cf.id}
                  className={cn(
                    'relative flex flex-col items-start gap-1.5 px-3 py-3 rounded-xl border transition-all',
                    selected ? 'bg-[#E1F5EE] border-2 border-[#1D9E75] shadow-sm' : 'bg-white border border-[#E5E4E0] hover:border-[#1D9E75]',
                  )}
                >
                  <button type="button" disabled={disabled}
                    onClick={() => onChange(cf.id, true, cf.format_prompt)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-[#1D9E75] flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-white">{cf.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className={cn('text-xs font-semibold truncate', selected ? 'text-[#1D9E75]' : 'text-[#0A2540]')}>{cf.name}</span>
                    </div>
                    <span className="text-[9px] bg-[#1D9E75]/10 text-[#1D9E75] px-1.5 py-0.5 rounded-full font-semibold">Custom</span>
                  </button>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button type="button" onClick={() => { setEditFormat(cf); setModalOpen(true) }}
                      className="p-0.5 text-gray-300 hover:text-[#1D9E75] transition-colors">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => handleDeleteFormat(cf.id)}
                      disabled={deleteId === cf.id}
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

      {/* Create custom format */}
      <div className="mt-3">
        {freeMsg ? (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            Custom formats are available on the Starter plan.{' '}
            <a href="/settings" className="underline font-semibold">Upgrade ↗</a>
          </p>
        ) : (
          <button type="button"
            onClick={() => {
              if (userPlan === 'free') { setFreeMsg(true); setTimeout(() => setFreeMsg(false), 4000); return }
              setEditFormat(undefined); setModalOpen(true)
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#1D9E75] hover:text-[#178a63] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create custom format
          </button>
        )}
      </div>

      <CustomFormatModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditFormat(undefined) }}
        onSaved={fmt => { onCustomFormatCreated(fmt); setModalOpen(false); setEditFormat(undefined) }}
        userPlan={userPlan}
        editFormat={editFormat}
      />
    </div>
  )
}
