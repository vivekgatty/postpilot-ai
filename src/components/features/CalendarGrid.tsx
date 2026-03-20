'use client'

import { Post } from '@/types'
import { cn } from '@/lib/utils'

interface CalendarGridProps {
  posts: Post[]
  month: Date
  onDayClick?: (date: Date) => void
}

export default function CalendarGrid({ posts, month, onDayClick }: CalendarGridProps) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDay = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

  const scheduledDates = new Set(
    posts
      .filter((p) => p.status === 'scheduled' && p.scheduled_for)
      .map((p) => new Date(p.scheduled_for!).getDate())
  )

  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d)
  }

  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === monthIndex

  return (
    <div className="grid grid-cols-7 gap-1">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
        <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">
          {d}
        </div>
      ))}
      {days.map((day, i) => (
        <div
          key={i}
          onClick={() => {
            if (day && onDayClick) {
              onDayClick(new Date(year, monthIndex, day))
            }
          }}
          className={cn(
            'aspect-square flex flex-col items-center justify-center rounded-lg text-sm cursor-pointer transition-colors',
            day
              ? 'hover:bg-gray-50'
              : 'cursor-default',
            isCurrentMonth && day === today.getDate() && 'bg-[#1D9E75]/10 font-bold text-[#1D9E75]',
            scheduledDates.has(day ?? -1) && 'ring-2 ring-[#1D9E75]'
          )}
        >
          {day && (
            <>
              <span>{day}</span>
              {scheduledDates.has(day) && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] mt-0.5" />
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}
