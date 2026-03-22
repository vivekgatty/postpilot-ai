'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Flame, ChevronRight } from 'lucide-react'
import { isStreakActive, getTodayDateString } from '@/lib/streakConfig'
import type { StreakState, CalendarDay } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WidgetData {
  streakState: StreakState
  postedToday: boolean
  recentDays:  CalendarDay[]
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function WidgetSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E5E4E0] p-4 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-3.5 w-16 bg-gray-200 rounded" />
        <div className="h-3.5 w-12 bg-gray-200 rounded" />
      </div>
      <div className="h-12 w-20 bg-gray-200 rounded" />
      <div className="h-3 w-32 bg-gray-200 rounded" />
      <div className="flex gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="w-3 h-3 rounded-sm bg-gray-100" />
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StreakDashboardWidget() {
  const [widgetData, setWidgetData] = useState<WidgetData | null>(null)
  const [isLoading,  setIsLoading]  = useState(true)

  useEffect(() => {
    fetch('/api/streak/state')
      .then(r => r.json())
      .then(d => {
        const allDays = (d.calendar_days ?? []) as CalendarDay[]
        // Last 7 days ascending
        const today = getTodayDateString()
        const last7 = [...allDays]
          .filter(day => {
            const diffMs  = new Date(today).getTime() - new Date(day.date).getTime()
            const diffDays = Math.floor(diffMs / 86400000)
            return diffDays >= 0 && diffDays < 7
          })
          .sort((a, b) => a.date.localeCompare(b.date))

        setWidgetData({
          streakState: d.state      as StreakState,
          postedToday: d.posted_today_publish || false,
          recentDays:  last7,
        })
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading)  return <WidgetSkeleton />
  if (!widgetData) return null

  const { streakState, postedToday, recentDays } = widgetData
  const streak = streakState.publish_streak
  const active = isStreakActive(streakState.publish_last_date, streakState.freeze_active_until)
  const today  = getTodayDateString()

  // Status row
  let statusDot: string
  let statusText: string
  if (postedToday) {
    statusDot  = 'bg-green-500'
    statusText = 'Posted today ✓'
  } else if (streak > 0) {
    statusDot  = 'bg-amber-400'
    statusText = 'Post today to keep it alive'
  } else {
    statusDot  = 'bg-gray-300'
    statusText = 'Start your streak →'
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E4E0] p-4 space-y-3">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Flame
            size={14}
            className={active ? 'text-[#1D9E75]' : 'text-gray-300'}
            fill={active ? '#1D9E75' : 'transparent'}
          />
          <span className="text-[12px] text-gray-400 font-medium">Streak</span>
        </div>
        <Link
          href="/dashboard/streak"
          className="flex items-center gap-0.5 text-[12px] text-[#1D9E75] font-semibold hover:underline"
        >
          View <ChevronRight size={11} />
        </Link>
      </div>

      {/* Giant number */}
      <div>
        <span
          className="font-extrabold leading-none tabular-nums"
          style={{
            fontSize: 48,
            color: streak > 0 ? '#1D9E75' : '#D1D5DB',
          }}
        >
          {streak}
        </span>
        <p className="text-sm text-gray-400 mt-0.5">day streak</p>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot}`} />
        <span className="text-[12px] text-gray-600">{statusText}</span>
      </div>

      {/* 7-day strip */}
      <div className="flex gap-1">
        {recentDays.map(day => {
          const isToday   = day.date === today
          const hasPosted = day.publish_logged
          return (
            <div
              key={day.date}
              title={day.date}
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{
                backgroundColor: hasPosted ? '#1D9E75' : '#F1EFE8',
                outline:         isToday ? '2px solid #1D9E75' : 'none',
                outlineOffset:   '1px',
              }}
            />
          )
        })}
        {/* Fill to 7 if fewer days available */}
        {Array.from({ length: Math.max(0, 7 - recentDays.length) }).map((_, i) => (
          <div key={`pad-${i}`} className="w-3 h-3 rounded-sm bg-gray-100 flex-shrink-0" />
        ))}
      </div>

      {/* CTA */}
      {!postedToday && (
        <Link
          href="/dashboard/streak"
          className="block w-full text-center py-2 rounded-lg bg-[#1D9E75] hover:bg-[#18876A] text-white text-[12px] font-semibold transition-colors"
        >
          Log today&apos;s post
        </Link>
      )}
    </div>
  )
}
