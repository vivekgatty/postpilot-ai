'use client'

import { cn } from '@/lib/utils'
import { TONES } from '@/lib/constants'
import type { ToneType } from '@/types'

interface ToneSelectorProps {
  value: ToneType
  onChange: (tone: ToneType) => void
}

export default function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TONES.map((tone) => (
        <button
          key={tone.value}
          type="button"
          onClick={() => onChange(tone.value as ToneType)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-all border',
            value === tone.value
              ? 'bg-[#1D9E75] text-white border-[#1D9E75]'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#1D9E75] hover:text-[#1D9E75]'
          )}
        >
          {tone.label}
        </button>
      ))}
    </div>
  )
}
