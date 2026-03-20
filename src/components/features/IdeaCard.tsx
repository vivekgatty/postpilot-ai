'use client'

import { useState, useEffect } from 'react'

export interface WeeklyIdea {
  day:   string   // "Monday" … "Sunday"
  topic: string
  hook:  string
  why:   string
}

interface IdeaCardProps {
  idea: WeeklyIdea
}

const DAY_COLORS: Record<string, string> = {
  Monday:    '#1D9E75',
  Tuesday:   '#378ADD',
  Wednesday: '#7F77DD',
  Thursday:  '#EF9F27',
  Friday:    '#D85A30',
  Saturday:  '#0A2540',
  Sunday:    '#6B7280',
}

const STORAGE_KEY = 'postpika_saved_ideas'

function getSavedIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

function ideaKey(idea: WeeklyIdea): string {
  return `${idea.day}:${idea.topic.slice(0, 40)}`
}

export default function IdeaCard({ idea }: IdeaCardProps) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSaved(getSavedIds().includes(ideaKey(idea)))
  }, [idea])

  function toggleSave() {
    const key    = ideaKey(idea)
    const saved  = getSavedIds()
    const next   = saved.includes(key)
      ? saved.filter(k => k !== key)
      : [...saved, key]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSaved(!saved.includes(key))
  }

  const dotColor = DAY_COLORS[idea.day] ?? '#1D9E75'
  const href     = `/dashboard/generate?topic=${encodeURIComponent(idea.topic)}`

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3
                    hover:shadow-md hover:border-[#1D9E75]/30 transition-all duration-150 relative">

      {/* Bookmark */}
      <button
        onClick={toggleSave}
        title={saved ? 'Remove bookmark' : 'Bookmark idea'}
        className={[
          'absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors',
          saved
            ? 'text-[#1D9E75] bg-[#E1F5EE]'
            : 'text-gray-300 hover:text-[#1D9E75] hover:bg-[#F0FDF9]',
        ].join(' ')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'}
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        </svg>
      </button>

      {/* Day badge */}
      <div>
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: dotColor }}
        >
          {idea.day}
        </span>
      </div>

      {/* Topic */}
      <p className="text-sm font-bold text-[#0A2540] leading-snug pr-6">
        {idea.topic}
      </p>

      {/* Hook */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1D9E75] mb-1">
          Start with:
        </p>
        <p className="text-sm text-gray-600 italic leading-relaxed">
          &ldquo;{idea.hook}&rdquo;
        </p>
      </div>

      {/* Why it works */}
      <p className="text-[12px] text-gray-400 leading-relaxed">
        {idea.why}
      </p>

      {/* CTA */}
      <a
        href={href}
        className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D9E75]
                   hover:text-[#178a63] transition-colors group"
      >
        Write this post
        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
      </a>
    </div>
  )
}
