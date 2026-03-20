'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface PostEditorProps {
  value: string
  onChange: (value: string) => void
  onSave?: () => void
  onSchedule?: () => void
  loading?: boolean
  placeholder?: string
}

const MAX_CHARS = 3000

export default function PostEditor({
  value,
  onChange,
  onSave,
  onSchedule,
  loading = false,
  placeholder = 'Write your LinkedIn post here...',
}: PostEditorProps) {
  const charCount = value.length
  const isOverLimit = charCount > MAX_CHARS

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={12}
          className={cn(
            'w-full rounded-xl border p-4 text-sm resize-none focus:outline-none focus:ring-2 transition-all',
            isOverLimit
              ? 'border-red-300 focus:ring-red-200'
              : 'border-gray-200 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]'
          )}
        />
        <div
          className={cn(
            'absolute bottom-3 right-3 text-xs font-medium',
            isOverLimit ? 'text-red-500' : 'text-gray-400'
          )}
        >
          {charCount}/{MAX_CHARS}
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end">
        {onSave && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            loading={loading}
            disabled={isOverLimit || !value.trim()}
          >
            Save Draft
          </Button>
        )}
        {onSchedule && (
          <Button
            size="sm"
            onClick={onSchedule}
            disabled={isOverLimit || !value.trim()}
          >
            Schedule Post
          </Button>
        )}
      </div>
    </div>
  )
}
