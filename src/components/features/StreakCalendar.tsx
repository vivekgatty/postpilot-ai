'use client'

import { useState } from 'react'
import type { CalendarDay } from '@/types'
import { CALENDAR_COLORS, DAY_LABELS } from '@/lib/streakConfig'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  calendarDays: CalendarDay[]
  view: 'year' | 'month'
  plan: string
}

// ─── Colour & tooltip helpers ─────────────────────────────────────────────────

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTH_NAMES_FULL = ['January','February','March','April','May','June',
                          'July','August','September','October','November','December']
const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function getDayColor(day: CalendarDay): string {
  if (day.is_future)        return 'transparent'
  if (day.is_streak_break)  return CALENDAR_COLORS.break
  if (day.is_grace_day)     return CALENDAR_COLORS.grace
  if (day.is_milestone_day) return CALENDAR_COLORS.milestone
  if (day.publish_logged && day.engage_logged && day.plan_logged) return CALENDAR_COLORS.published_2
  if (day.publish_logged)   return CALENDAR_COLORS.published
  if (day.plan_logged)      return CALENDAR_COLORS.plan_only
  return CALENDAR_COLORS.empty
}

function formatTooltipDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  // day_of_week in CalendarDay: 0=Mon…6=Sun; JS getDay(): 0=Sun…6=Sat
  const jsDay = new Date(y, m - 1, d).getDay()
  return `${WEEKDAY_NAMES[jsDay]}, ${d} ${MONTH_NAMES[m - 1]} ${y}`
}

function buildTooltip(day: CalendarDay): string {
  const datePart = formatTooltipDate(day.date)
  const acts: string[] = []
  if (day.publish_logged) acts.push('Published 1 post')
  if (day.engage_logged)  acts.push('Engaged')
  if (day.plan_logged)    acts.push('Planned')
  const activity = acts.length ? acts.join(' · ') : 'No activity'
  const streak   = day.streak_at_day > 0 ? ` (Streak: ${day.streak_at_day} days)` : ''
  return `${datePart} — ${activity}${streak}`
}

// ─── Tooltip component ────────────────────────────────────────────────────────

interface TooltipProps {
  day: CalendarDay
  x: number
  y: number
}

function Tooltip({ day, x, y }: TooltipProps) {
  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y - 48,
        transform: 'translateX(-50%)',
        backgroundColor: '#0A2540',
        color: '#ffffff',
        fontSize: 12,
        lineHeight: 1.4,
        padding: '6px 10px',
        borderRadius: 6,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      }}
    >
      {buildTooltip(day)}
      {/* Arrow */}
      <div
        style={{
          position: 'absolute',
          bottom: -4,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: '4px solid #0A2540',
        }}
      />
    </div>
  )
}

// ─── Year view ────────────────────────────────────────────────────────────────

const SQUARE = 10
const GAP    = 2
const COL_W  = SQUARE + GAP // 12px per week column

// Day-label rows: only Mon(0), Wed(2), Fri(4) are visible
const VISIBLE_ROW_LABELS: Record<number, string> = { 0: 'Mon', 2: 'Wed', 4: 'Fri' }

interface YearViewProps {
  calendarDays: CalendarDay[]
  plan: string
  hoveredDay: CalendarDay | null
  onHover: (day: CalendarDay, e: React.MouseEvent) => void
  onLeave: () => void
}

function YearView({ calendarDays, plan, hoveredDay, onHover, onLeave }: YearViewProps) {
  // Sort ascending
  const sorted = [...calendarDays].sort((a, b) => a.date.localeCompare(b.date))

  // Pad first week so it starts on Monday (day_of_week 0=Mon)
  const firstDow = sorted[0]?.day_of_week ?? 0
  const padded: (CalendarDay | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...sorted,
  ]
  while (padded.length % 7 !== 0) padded.push(null)

  // Group into week columns (each column = 7 squares)
  const weeks: (CalendarDay | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7))
  }

  // Month labels: which week column first contains the 1st of a month?
  const monthLabels: (string | null)[] = weeks.map(week => {
    for (const day of week) {
      if (day && day.date.endsWith('-01')) {
        return MONTH_NAMES[parseInt(day.date.split('-')[1]) - 1]
      }
    }
    return null
  })

  // Free plan: blur all but the last ~5 weeks (≈ 30 days)
  const visibleWeeks  = plan === 'free' ? Math.ceil(30 / 7) : weeks.length
  const blurCutoff    = weeks.length - visibleWeeks // blur weeks[0..blurCutoff-1]
  const overlayWidth  = blurCutoff * COL_W - GAP   // px

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, minWidth: 'max-content' }}>

        {/* Day-of-week labels */}
        <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 20, gap: GAP }}>
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              style={{
                height: SQUARE,
                lineHeight: `${SQUARE}px`,
                fontSize: 11,
                color: '#9CA3AF',
                textAlign: 'right',
                minWidth: 24,
              }}
            >
              {VISIBLE_ROW_LABELS[i] ?? ''}
            </div>
          ))}
        </div>

        {/* Weeks grid */}
        <div style={{ position: 'relative' }}>

          {/* Month labels row */}
          <div style={{ display: 'flex', gap: GAP, marginBottom: 4, height: 16 }}>
            {weeks.map((_, wi) => (
              <div
                key={wi}
                style={{ width: SQUARE, fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}
              >
                {monthLabels[wi] ?? ''}
              </div>
            ))}
          </div>

          {/* Square columns */}
          <div style={{ display: 'flex', gap: GAP, position: 'relative' }}>
            {weeks.map((week, wi) => {
              const isBlurred = plan === 'free' && wi < blurCutoff
              return (
                <div
                  key={wi}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: GAP,
                    filter:        isBlurred ? 'blur(3px)' : 'none',
                    pointerEvents: isBlurred ? 'none'     : 'auto',
                  }}
                >
                  {week.map((day, di) => {
                    if (!day) {
                      return <div key={di} style={{ width: SQUARE, height: SQUARE }} />
                    }
                    const color     = getDayColor(day)
                    const isHovered = hoveredDay?.date === day.date
                    return (
                      <div
                        key={di}
                        style={{
                          width:           SQUARE,
                          height:          SQUARE,
                          borderRadius:    2,
                          backgroundColor: color,
                          border:          day.is_today
                            ? `1.5px solid ${CALENDAR_COLORS.today}`
                            : isHovered ? '1.5px solid #555' : 'none',
                          boxSizing:  'border-box',
                          cursor:     'pointer',
                          flexShrink: 0,
                        }}
                        onMouseEnter={e => onHover(day, e)}
                        onMouseLeave={onLeave}
                      />
                    )
                  })}
                </div>
              )
            })}

            {/* Free plan upgrade overlay */}
            {plan === 'free' && blurCutoff > 0 && (
              <div
                style={{
                  position:       'absolute',
                  top:            0,
                  left:           0,
                  bottom:         0,
                  width:          overlayWidth,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  pointerEvents:  'auto',
                }}
              >
                <div
                  style={{
                    background:   'rgba(255,255,255,0.88)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: 8,
                    padding:      '8px 14px',
                    textAlign:    'center',
                    boxShadow:    '0 2px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0A2540', marginBottom: 4 }}>
                    View full year
                  </div>
                  <a
                    href="/dashboard/settings"
                    style={{ fontSize: 11, color: '#1D9E75', textDecoration: 'none', fontWeight: 600 }}
                  >
                    Starter plan →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Month view ───────────────────────────────────────────────────────────────

interface MonthViewProps {
  calendarDays: CalendarDay[]
  hoveredDay: CalendarDay | null
  onHover: (day: CalendarDay, e: React.MouseEvent) => void
  onLeave: () => void
}

function buildPlaceholder(dateStr: string, isFuture: boolean): CalendarDay {
  // JS Date to day_of_week (Mon=0…Sun=6)
  const [y, m, d] = dateStr.split('-').map(Number)
  const jsDay = new Date(y, m - 1, d).getDay()
  const dow   = jsDay === 0 ? 6 : jsDay - 1
  return {
    date:            dateStr,
    publish_logged:  false,
    engage_logged:   false,
    plan_logged:     false,
    is_today:        false,
    is_future:       isFuture,
    streak_at_day:   0,
    is_milestone_day: false,
    is_grace_day:    false,
    is_streak_break: false,
    day_of_week:     dow,
  }
}

function MonthView({ calendarDays, hoveredDay, onHover, onLeave }: MonthViewProps) {
  const today    = new Date()
  const year     = today.getFullYear()
  const month    = today.getMonth()         // 0-indexed
  const todayStr = today.toISOString().split('T')[0]

  const daysInMonth   = new Date(year, month + 1, 0).getDate()
  const monthStr      = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthLabel    = `${MONTH_NAMES_FULL[month]} ${year}`

  // Lookup map from calendarDays
  const dayMap = new Map(calendarDays.map(d => [d.date, d]))

  // first day of month dow (Mon=0)
  const jsFirst = new Date(year, month, 1).getDay()
  const firstDow = jsFirst === 0 ? 6 : jsFirst - 1

  // Build flat grid (null = empty padding, CalendarDay = actual day)
  const grid: (CalendarDay | null)[] = []
  for (let i = 0; i < firstDow; i++) grid.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthStr}-${String(d).padStart(2, '0')}`
    const isFuture = dateStr > todayStr
    grid.push(dayMap.get(dateStr) ?? buildPlaceholder(dateStr, isFuture))
  }
  while (grid.length % 7 !== 0) grid.push(null)

  // Split into rows
  const rows: (CalendarDay | null)[][] = []
  for (let i = 0; i < grid.length; i += 7) rows.push(grid.slice(i, i + 7))

  return (
    <div>
      {/* Month heading */}
      <div style={{ fontSize: 15, fontWeight: 700, color: '#0A2540', marginBottom: 12 }}>
        {monthLabel}
      </div>

      {/* Day-of-week header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 4,
        }}
      >
        {DAY_LABELS.map(label => (
          <div
            key={label}
            style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', padding: '4px 0' }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map((row, ri) => (
          <div
            key={ri}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}
          >
            {row.map((day, di) => {
              if (!day) {
                return (
                  <div
                    key={di}
                    style={{ height: 48, borderRadius: 6, backgroundColor: 'transparent' }}
                  />
                )
              }

              const [, , dayNum] = day.date.split('-').map(Number)
              const color        = getDayColor(day)
              const isPast       = !day.is_today && !day.is_future
              const isHovered    = hoveredDay?.date === day.date

              return (
                <div
                  key={di}
                  style={{
                    height:          48,
                    borderRadius:    6,
                    backgroundColor: color,
                    position:        'relative',
                    cursor:          'pointer',
                    border:          isHovered ? '1.5px solid #555' : '1.5px solid transparent',
                    boxSizing:       'border-box',
                  }}
                  onMouseEnter={e => onHover(day, e)}
                  onMouseLeave={onLeave}
                >
                  {/* Day number */}
                  <div style={{ position: 'absolute', top: 5, left: 6 }}>
                    {day.is_today ? (
                      <div
                        style={{
                          width:           20,
                          height:          20,
                          borderRadius:    '50%',
                          backgroundColor: '#1D9E75',
                          color:           '#ffffff',
                          fontSize:        11,
                          fontWeight:      700,
                          display:         'flex',
                          alignItems:      'center',
                          justifyContent:  'center',
                        }}
                      >
                        {dayNum}
                      </div>
                    ) : (
                      <span
                        style={{
                          fontSize:   11,
                          fontWeight: 600,
                          color:      isPast ? '#9CA3AF' : '#374151',
                          lineHeight: '20px',
                        }}
                      >
                        {dayNum}
                      </span>
                    )}
                  </div>

                  {/* Flame emoji for published days */}
                  {day.publish_logged && (
                    <div
                      style={{
                        position:       'absolute',
                        inset:          0,
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        fontSize:       18,
                        paddingTop:     8,
                      }}
                    >
                      🔥
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function StreakCalendar({ calendarDays, view, plan }: Props) {
  const [hoveredDay, setHoveredDay] = useState<CalendarDay | null>(null)
  const [tooltipX,   setTooltipX]   = useState(0)
  const [tooltipY,   setTooltipY]   = useState(0)

  function handleHover(day: CalendarDay, e: React.MouseEvent) {
    setHoveredDay(day)
    setTooltipX(e.clientX)
    setTooltipY(e.clientY)
  }

  function handleLeave() {
    setHoveredDay(null)
  }

  return (
    <div style={{ position: 'relative' }}>
      {view === 'year' ? (
        <YearView
          calendarDays={calendarDays}
          plan={plan}
          hoveredDay={hoveredDay}
          onHover={handleHover}
          onLeave={handleLeave}
        />
      ) : (
        <MonthView
          calendarDays={calendarDays}
          hoveredDay={hoveredDay}
          onHover={handleHover}
          onLeave={handleLeave}
        />
      )}

      {/* Floating tooltip */}
      {hoveredDay && (
        <Tooltip day={hoveredDay} x={tooltipX} y={tooltipY} />
      )}
    </div>
  )
}
