'use client'

import { useState, useCallback } from 'react'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import { cn } from '@/lib/utils'
import { FORMAT_ICONS } from '@/lib/plannerConfig'
import type { PlannedPost, ContentPillar, ContentBankItem } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  idea:      'bg-gray-400',
  draft:     'bg-amber-400',
  scheduled: 'bg-blue-500',
  published: 'bg-green-500',
  missed:    'bg-red-500',
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

function toDateStr(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  posts:          PlannedPost[]
  pillars:        ContentPillar[]
  currentMonth:   Date
  preferredDays:  string[]
  onMonthChange:  (date: Date) => void
  onPostClick:    (post: PlannedPost) => void
  onDayClick:     (date: Date) => void
  onDropFromBank: (item: ContentBankItem, date: Date) => void
}

// ── Post chip ─────────────────────────────────────────────────────────────────

function PostChip({ post, onClick }: { post: PlannedPost; onClick: () => void }) {
  const pillar = post.pillar
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className="w-full text-left px-2 py-1 rounded-md bg-white border border-gray-100 shadow-sm hover:shadow transition-shadow text-xs flex items-center gap-1.5 overflow-hidden"
      style={{ borderLeft: `3px solid ${pillar?.color ?? '#E5E4E0'}` }}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', STATUS_DOT[post.status] ?? 'bg-gray-300')} />
      <span className="text-[10px] text-gray-400 flex-shrink-0">{FORMAT_ICONS[post.format] ?? 'T'}</span>
      <span className="truncate text-[#0A2540] font-medium leading-tight">
        {post.title.slice(0, 28)}{post.title.length > 28 ? '…' : ''}
      </span>
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PlannerCalendar({
  posts,
  currentMonth,
  preferredDays,
  onMonthChange,
  onPostClick,
  onDayClick,
  onDropFromBank,
}: Props) {
  const [view, setView] = useState<'month' | 'week'>('month')
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date()
    const day = now.getDay()
    const mon = new Date(now)
    mon.setDate(now.getDate() - ((day + 6) % 7))
    return mon
  })

  const today = new Date()

  const DAY_NAMES_FULL  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const preferredDaySet = new Set(preferredDays)

  // Posts keyed by date string for fast lookup
  const postsByDate = posts.reduce<Record<string, PlannedPost[]>>((acc, p) => {
    const d = p.planned_date.slice(0, 10)
    if (!acc[d]) acc[d] = []
    acc[d].push(p)
    return acc
  }, {})

  // Progress stats
  const thisMonthPosts = posts.filter((p) => {
    const d = new Date(p.planned_date + 'T00:00:00')
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()
  })
  const planned   = thisMonthPosts.length
  const completed = thisMonthPosts.filter((p) => p.status === 'published').length

  // ── Month navigation ──────────────────────────────────────────────────────────

  const prevMonth = () => {
    const d = new Date(currentMonth)
    d.setMonth(d.getMonth() - 1)
    onMonthChange(d)
  }
  const nextMonth = () => {
    const d = new Date(currentMonth)
    d.setMonth(d.getMonth() + 1)
    onMonthChange(d)
  }
  const goToday = () => onMonthChange(new Date())

  // ── Week navigation ───────────────────────────────────────────────────────────

  const prevWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }
  const nextWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

  // ── DnD handler ───────────────────────────────────────────────────────────────

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return
    const droppableId = result.destination.droppableId
    if (!droppableId.startsWith('day-')) return

    const dateStr = droppableId.replace('day-', '')
    const date    = new Date(dateStr + 'T00:00:00')

    // The draggable id encodes the bank item id from ContentBankSidebar
    const bankItemData = result.draggableId.startsWith('bank-')
      ? result.draggableId.replace('bank-', '')
      : null

    if (bankItemData) {
      // ContentBankSidebar passes the full item via window context
      const item = (window as Window & { __dragBankItem?: ContentBankItem }).__dragBankItem
      if (item) onDropFromBank(item, date)
    }
  }, [onDropFromBank])

  // ── Month grid cells ──────────────────────────────────────────────────────────

  const renderMonthGrid = () => {
    const year  = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // First day of the month (0=Sun, adjust to Mon-start grid)
    const firstDay = new Date(year, month, 1)
    const startIdx = (firstDay.getDay() + 6) % 7  // 0=Mon

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = [
      ...Array(startIdx).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
    ]
    // Pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null)

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden">
        {DAY_NAMES_SHORT.map((d) => (
          <div key={d} className="bg-gray-50 px-2 py-2 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            {d}
          </div>
        ))}

        {cells.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="bg-[#FAFAF8] min-h-[90px]" />
          }

          const dateStr        = toDateStr(date)
          const dayName        = DAY_NAMES_FULL[(date.getDay() + 6) % 7]
          const isToday        = isSameDay(date, today)
          const isPast         = date < today && !isToday
          const isPreferredDay = preferredDaySet.has(dayName)
          const dayPosts       = postsByDate[dateStr] ?? []
          const hasMissed      = isPast && isPreferredDay && dayPosts.length === 0
          const hasPublished   = dayPosts.some((p) => p.status === 'published')

          return (
            <Droppable droppableId={`day-${dateStr}`} key={dateStr}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  onClick={() => isPreferredDay && onDayClick(date)}
                  className={cn(
                    'min-h-[90px] bg-white px-1.5 pt-1.5 pb-2 flex flex-col gap-1 transition-colors',
                    !isPreferredDay && 'bg-[#FAFAF8]',
                    snapshot.isDraggingOver && 'bg-[#E1F5EE]',
                    snapshot.isDraggingOver && 'outline outline-2 outline-dashed outline-[#1D9E75]',
                    hasMissed && 'border-l-[1.5px] border-l-red-300',
                    isPreferredDay && !hasMissed && 'cursor-pointer',
                  )}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full',
                      isToday ? 'bg-[#1D9E75] text-white' : 'text-gray-500',
                    )}>
                      {date.getDate()}
                    </span>
                    {hasPublished && (
                      <span className="text-[10px] text-green-500">✓</span>
                    )}
                  </div>

                  {/* Post chips — max 2 visible */}
                  {dayPosts.slice(0, 2).map((post) => (
                    <PostChip key={post.id} post={post} onClick={() => onPostClick(post)} />
                  ))}
                  {dayPosts.length > 2 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onPostClick(dayPosts[2]) }}
                      className="text-[10px] text-gray-400 hover:text-gray-600 px-1"
                    >
                      +{dayPosts.length - 2} more
                    </button>
                  )}

                  {/* Empty preferred day hover hint */}
                  {isPreferredDay && dayPosts.length === 0 && !hasMissed && (
                    <div className="flex-1 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-lg text-gray-300">+</span>
                    </div>
                  )}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )
        })}
      </div>
    )
  }

  // ── Week view ─────────────────────────────────────────────────────────────────

  const renderWeekView = () => {
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      return d
    })

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden">
        {weekDays.map((date) => {
          const dateStr        = toDateStr(date)
          const dayName        = DAY_NAMES_FULL[(date.getDay() + 6) % 7]
          const isToday        = isSameDay(date, today)
          const isPreferredDay = preferredDaySet.has(dayName)
          const dayPosts       = postsByDate[dateStr] ?? []

          return (
            <div key={dateStr} className={cn('bg-white min-h-[400px] flex flex-col', !isPreferredDay && 'bg-[#FAFAF8]')}>
              {/* Header */}
              <div className={cn('px-3 py-2 text-center border-b border-gray-100')}>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">{dayName.slice(0, 3)}</p>
                <p className={cn(
                  'text-base font-bold w-7 h-7 flex items-center justify-center rounded-full mx-auto',
                  isToday ? 'bg-[#1D9E75] text-white' : 'text-gray-700',
                )}>
                  {date.getDate()}
                </p>
              </div>

              {/* Posts */}
              <div className="flex-1 p-2 space-y-2">
                {dayPosts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => onPostClick(post)}
                    className="w-full text-left p-2 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow transition-shadow text-xs"
                    style={{ borderLeft: `3px solid ${post.pillar?.color ?? '#E5E4E0'}` }}
                  >
                    <p className="font-medium text-[#0A2540] mb-0.5 truncate">{post.title}</p>
                    <p className="text-gray-400 truncate">{post.topic.slice(0, 40)}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">{post.planned_time}</p>
                  </button>
                ))}

                {isPreferredDay && dayPosts.length === 0 && (
                  <button
                    type="button"
                    onClick={() => onDayClick(date)}
                    className="w-full py-3 text-center text-gray-300 hover:text-gray-400 border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-lg transition-colors text-sm"
                  >
                    + Add post
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const monthLabel = currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div>
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-[#0A2540]">{completed}</span> of{' '}
              <span className="font-semibold text-[#0A2540]">{planned}</span> posts planned this month
            </span>
            {planned > 0 && (
              <span className="text-xs text-gray-400">{Math.round((completed / planned) * 100)}%</span>
            )}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1D9E75] rounded-full transition-all"
              style={{ width: planned > 0 ? `${(completed / planned) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={view === 'month' ? prevMonth : prevWeek} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">←</button>
            <h2 className="text-base font-semibold text-[#0A2540] min-w-32 text-center">
              {view === 'month'
                ? monthLabel
                : `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(weekStart.getTime() + 6 * 864e5).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
            </h2>
            <button type="button" onClick={view === 'month' ? nextMonth : nextWeek} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">→</button>
            <button type="button" onClick={goToday} className="text-xs text-[#1D9E75] hover:underline ml-2">Today</button>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {(['month', 'week'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                  view === v ? 'bg-white text-[#0A2540] shadow-sm' : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        {view === 'month' ? renderMonthGrid() : renderWeekView()}
      </div>
    </DragDropContext>
  )
}
