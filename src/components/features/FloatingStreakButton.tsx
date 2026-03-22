'use client'

import { Flame } from 'lucide-react'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  streak:      number
  postedToday: boolean
  onOpenModal: () => void
}

// ─── CSS keyframes injected once ─────────────────────────────────────────────
// We use a <style> tag so the keyframes are available without a CSS file.

const STYLE = `
@keyframes streak-pulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.03); }
}
.streak-btn-pulse {
  animation: streak-pulse 4s ease-in-out infinite;
}
.streak-btn-pulse:hover,
.streak-btn-pulse:active {
  animation: none;
}
`

// ─── Component ────────────────────────────────────────────────────────────────

export default function FloatingStreakButton({ streak, postedToday, onOpenModal }: Props) {
  const needsAction = streak > 0 && !postedToday

  // Background colour
  let bg: string
  if (streak === 0)  bg = '#9CA3AF'            // grey
  else if (postedToday) bg = '#1D9E75'          // teal
  else               bg = '#F59E0B'             // amber

  return (
    <>
      {/* Inject keyframes once */}
      <style>{STYLE}</style>

      <button
        onClick={onOpenModal}
        title="Log today's activity"
        aria-label="Log today's activity"
        className={needsAction ? 'streak-btn-pulse' : ''}
        style={{
          position:      'fixed',
          bottom:        24,
          right:         24,
          zIndex:        50,
          display:       'flex',
          alignItems:    'center',
          gap:           8,
          height:        48,
          paddingLeft:   16,
          paddingRight:  16,
          borderRadius:  9999,
          backgroundColor: bg,
          border:        'none',
          cursor:        'pointer',
          boxShadow:     '0 4px 14px rgba(0,0,0,0.18)',
          transition:    'box-shadow 0.15s ease, transform 0.1s ease',
          outline:       'none',
          color:         '#ffffff',
          fontFamily:    'inherit',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
            '0 8px 20px rgba(0,0,0,0.22)'
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
            '0 4px 14px rgba(0,0,0,0.18)'
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
        }}
        onMouseDown={e => {
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)'
        }}
        onMouseUp={e => {
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)'
        }}
      >
        {/* Flame icon with optional check badge */}
        <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Flame size={16} color="#ffffff" fill={streak > 0 ? '#ffffff' : 'transparent'} />
          {postedToday && streak > 0 && (
            <span
              style={{
                position:        'absolute',
                top:             -5,
                right:           -5,
                width:           10,
                height:          10,
                borderRadius:    '50%',
                backgroundColor: '#22C55E',
                border:          '1.5px solid #ffffff',
              }}
            />
          )}
          {needsAction && (
            <span
              style={{
                position:        'absolute',
                top:             -5,
                right:           -5,
                width:           10,
                height:          10,
                borderRadius:    '50%',
                backgroundColor: '#FCD34D',
                border:          '1.5px solid #ffffff',
              }}
            />
          )}
        </span>

        {/* Streak number */}
        {streak > 0 && (
          <span
            style={{
              fontSize:   14,
              fontWeight: 700,
              lineHeight: 1,
              color:      '#ffffff',
            }}
          >
            {streak}
          </span>
        )}
      </button>
    </>
  )
}
