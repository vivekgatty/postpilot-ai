'use client'

import { useState } from 'react'
import type { Post, ToneType } from '@/types'

// ── Tone dot colours ──────────────────────────────────────────────────────────

const TONE_DOT: Record<ToneType, string> = {
  professional:  '#0A2540',
  storytelling:  '#7F77DD',
  controversial: '#EF9F27',
  educational:   '#378ADD',
  inspirational: '#D85A30',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function sameDay(a: Date, b: Date): boolean {
  return isoDate(a) === isoDate(b)
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

// ── Sub-component: DayPanel ───────────────────────────────────────────────────

interface DayPanelProps {
  date:         Date | null
  posts:        Post[]
  draftPosts:   Post[]
  onClose:      () => void
  onSchedule:   (id: string, date: Date) => void
  onUnschedule: (id: string) => void
  onAddNew:     () => void
}

function DayPanel({ date, posts, draftPosts, onClose, onSchedule, onUnschedule, onAddNew }: DayPanelProps) {
  const visible = date !== null
  const dayPosts = date ? posts.filter(p => p.scheduled_for && sameDay(new Date(p.scheduled_for), date)) : []
  const isPast   = date ? date < new Date(new Date().setHours(0, 0, 0, 0)) : false

  return (
    <>
      {/* Backdrop */}
      {visible && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
        />
      )}

      {/* Slide-in panel */}
      <div
        className={[
          'fixed top-0 right-0 h-full w-80 bg-white z-50 shadow-2xl',
          'flex flex-col transition-transform duration-300 ease-in-out',
          visible ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
              {date?.toLocaleDateString('en-IN', { weekday: 'long' })}
            </p>
            <p className="text-lg font-bold text-[#0A2540]">
              {date?.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-lg"
          >
            ×
          </button>
        </div>

        {/* Post list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {dayPosts.length === 0 && (
            <p className="text-sm text-gray-400 text-center pt-8">No posts scheduled</p>
          )}

          {dayPosts.map(post => (
            <div
              key={post.id}
              className="border border-gray-200 rounded-xl p-3 bg-white hover:border-[#1D9E75]/40 transition-colors"
            >
              <div className="flex items-start gap-2 mb-2">
                <span
                  className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: TONE_DOT[post.tone] }}
                />
                <p className="text-sm text-[#0A2540] line-clamp-2 flex-1">
                  {post.content.slice(0, 100)}{post.content.length > 100 ? '…' : ''}
                </p>
              </div>

              {post.scheduled_for && (
                <p className="text-xs text-gray-400 mb-3">
                  {formatTime(post.scheduled_for)}
                </p>
              )}

              {!isPast && (
                <div className="flex gap-2">
                  <input
                    type="time"
                    defaultValue={post.scheduled_for
                      ? new Date(post.scheduled_for).toTimeString().slice(0, 5)
                      : '09:00'}
                    onChange={e => {
                      if (!date) return
                      const [h, m] = e.target.value.split(':').map(Number)
                      const d = new Date(date)
                      d.setHours(h, m, 0, 0)
                      onSchedule(post.id, d)
                    }}
                    className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#1D9E75]"
                  />
                  <button
                    onClick={() => onUnschedule(post.id)}
                    className="text-xs text-red-400 hover:text-red-600 border border-red-200 rounded-lg px-2 py-1.5 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Drafts available to schedule */}
          {!isPast && draftPosts.length > 0 && dayPosts.length === 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Schedule a draft
              </p>
              {draftPosts.slice(0, 5).map(post => (
                <button
                  key={post.id}
                  onClick={() => {
                    if (!date) return
                    const d = new Date(date)
                    d.setHours(9, 0, 0, 0)
                    onSchedule(post.id, d)
                  }}
                  className="w-full text-left border border-dashed border-gray-200 rounded-xl p-3 mb-2
                             hover:border-[#1D9E75]/60 hover:bg-[#F0FDF9] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: TONE_DOT[post.tone] }}
                    />
                    <p className="text-sm text-gray-600 truncate">
                      {post.content.slice(0, 60)}{post.content.length > 60 ? '…' : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {!isPast && (
          <div className="px-5 py-4 border-t border-gray-100">
            <button
              onClick={onAddNew}
              className="w-full py-2.5 rounded-xl bg-[#1D9E75] text-white text-sm font-semibold
                         hover:bg-[#178a63] active:scale-[0.98] transition-all"
            >
              + Schedule new post
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Sub-component: ScheduleModal ──────────────────────────────────────────────

interface ScheduleModalProps {
  date:       Date | null
  draftPosts: Post[]
  onClose:    () => void
  onSchedule: (id: string, date: Date) => void
}

function ScheduleModal({ date, draftPosts, onClose, onSchedule }: ScheduleModalProps) {
  const [time, setTime] = useState('09:00')

  if (!date) return null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-[#0A2540]">
            Schedule for {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-lg"
          >
            ×
          </button>
        </div>

        {/* Time picker */}
        <div className="px-6 pt-5 pb-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
            Time
          </label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                       focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10"
          />
        </div>

        {/* Draft list */}
        <div className="px-6 py-4 max-h-64 overflow-y-auto space-y-2">
          {draftPosts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No drafts available. Generate a post first.
            </p>
          ) : (
            draftPosts.map(post => (
              <button
                key={post.id}
                onClick={() => {
                  const [h, m] = time.split(':').map(Number)
                  const d = new Date(date)
                  d.setHours(h, m, 0, 0)
                  onSchedule(post.id, d)
                  onClose()
                }}
                className="w-full text-left border border-gray-200 rounded-xl p-3
                           hover:border-[#1D9E75]/60 hover:bg-[#F0FDF9] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: TONE_DOT[post.tone] }}
                  />
                  <p className="text-sm text-gray-700 truncate">
                    {post.content.slice(0, 70)}{post.content.length > 70 ? '…' : ''}
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-1 ml-4 capitalize">{post.tone}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export interface CalendarGridProps {
  posts:        Post[]
  month:        Date
  onMonthChange:(d: Date) => void
  onSchedule:   (id: string, date: Date) => void
  onUnschedule: (id: string) => void
  onPostAdded?: (post: Post) => void
}

export default function CalendarGrid({
  posts,
  month,
  onMonthChange,
  onSchedule,
  onUnschedule,
}: CalendarGridProps) {
  const [selectedDay,   setSelectedDay]   = useState<Date | null>(null)
  const [modalDay,      setModalDay]      = useState<Date | null>(null)

  const year       = month.getFullYear()
  const monthIdx   = month.getMonth()
  const today      = new Date()
  today.setHours(0, 0, 0, 0)

  // Monday-first offset
  const firstDow   = new Date(year, monthIdx, 1).getDay()
  const offset     = (firstDow + 6) % 7
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()

  const scheduledPosts = posts.filter(p => p.status === 'scheduled' && p.scheduled_for)
  const draftPosts     = posts.filter(p => p.status === 'draft')

  // Group scheduled posts by date string
  const postsByDay = new Map<string, Post[]>()
  for (const post of scheduledPosts) {
    const key = isoDate(new Date(post.scheduled_for!))
    const arr = postsByDay.get(key) ?? []
    arr.push(post)
    postsByDay.set(key, arr)
  }

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  function prevMonth() {
    onMonthChange(new Date(year, monthIdx - 1, 1))
  }
  function nextMonth() {
    onMonthChange(new Date(year, monthIdx + 1, 1))
  }

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100
                     text-gray-500 transition-colors text-lg font-light"
        >
          ‹
        </button>
        <h2 className="text-base font-bold text-[#0A2540]">
          {month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100
                     text-gray-500 transition-colors text-lg font-light"
        >
          ›
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden">
        {/* Leading empty cells */}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white min-h-[100px]" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const cellDate    = new Date(year, monthIdx, day)
          const key         = isoDate(cellDate)
          const cellPosts   = postsByDay.get(key) ?? []
          const isToday     = sameDay(cellDate, today)
          const isPast      = cellDate < today
          const isSelected  = selectedDay ? sameDay(cellDate, selectedDay) : false

          return (
            <div
              key={day}
              onClick={() => setSelectedDay(cellDate)}
              className={[
                'bg-white min-h-[100px] p-2 cursor-pointer transition-colors',
                'hover:bg-[#F0FDF9]',
                isSelected ? 'ring-2 ring-inset ring-[#1D9E75]' : '',
                isPast ? 'opacity-60' : '',
              ].join(' ')}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={[
                    'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full',
                    isToday
                      ? 'bg-[#1D9E75] text-white'
                      : 'text-gray-500',
                  ].join(' ')}
                >
                  {day}
                </span>

                {!isPast && (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setModalDay(cellDate)
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded-full
                               text-gray-300 hover:text-[#1D9E75] hover:bg-[#E1F5EE]
                               text-sm transition-colors opacity-0 group-hover:opacity-100"
                    title="Schedule post"
                  >
                    +
                  </button>
                )}
              </div>

              {/* Post chips */}
              <div className="space-y-0.5">
                {cellPosts.slice(0, 2).map(post => (
                  <div
                    key={post.id}
                    className="flex items-center gap-1 bg-[#F0FDF9] rounded px-1.5 py-0.5"
                    title={post.content.slice(0, 120)}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: TONE_DOT[post.tone] }}
                    />
                    <span className="text-[10px] text-[#0A2540] truncate leading-tight">
                      {post.content.slice(0, 35)}{post.content.length > 35 ? '…' : ''}
                    </span>
                  </div>
                ))}
                {cellPosts.length > 2 && (
                  <p className="text-[10px] text-[#1D9E75] font-semibold pl-1">
                    +{cellPosts.length - 2} more
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Day panel */}
      <DayPanel
        date={selectedDay}
        posts={scheduledPosts}
        draftPosts={draftPosts}
        onClose={() => setSelectedDay(null)}
        onSchedule={(id, date) => {
          onSchedule(id, date)
          setSelectedDay(null)
        }}
        onUnschedule={id => {
          onUnschedule(id)
          setSelectedDay(null)
        }}
        onAddNew={() => {
          setModalDay(selectedDay)
          setSelectedDay(null)
        }}
      />

      {/* Schedule modal */}
      {modalDay && (
        <ScheduleModal
          date={modalDay}
          draftPosts={draftPosts}
          onClose={() => setModalDay(null)}
          onSchedule={(id, date) => {
            onSchedule(id, date)
            setModalDay(null)
          }}
        />
      )}
    </div>
  )
}
