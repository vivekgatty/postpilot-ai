'use client'

import { cn } from '@/lib/utils'
import { PLAN_LIMITS } from '@/lib/constants'
import type { PlanType } from '@/types'

interface UsageMeterProps {
  used:      number
  plan:      PlanType
  resetDate?: string
  /** 'bar'    — full horizontal bar with label + reset date (sidebar / dashboard)
   *  'inline' — compact single-line widget for the top bar */
  variant?:  'bar' | 'inline'
  className?: string
}

export default function UsageMeter({
  used,
  plan,
  resetDate,
  variant = 'bar',
  className,
}: UsageMeterProps) {
  const limit      = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
  const unlimited  = limit === -1
  const pct        = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100))
  const atLimit    = !unlimited && used >= limit

  const barColor = atLimit
    ? 'bg-red-500'
    : pct >= 70
      ? 'bg-amber-500'
      : 'bg-[#1D9E75]'

  // ── Inline (topbar) ───────────────────────────────────────────────────────
  if (variant === 'inline') {
    if (unlimited) {
      return (
        <span className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] text-xs font-semibold',
          className
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]" />
          Unlimited
        </span>
      )
    }
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={cn('text-xs font-medium tabular-nums', atLimit ? 'text-red-500' : 'text-gray-600')}>
          {used}/{limit}
        </span>
      </div>
    )
  }

  // ── Bar (sidebar / dashboard card) ───────────────────────────────────────
  if (unlimited) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]" />
          Unlimited generations
        </span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex justify-between text-xs">
        <span className={cn('font-medium', atLimit ? 'text-red-500' : 'text-gray-700')}>
          {used} / {limit} generations
        </span>
        {atLimit && (
          <span className="text-red-500 font-medium">Limit reached</span>
        )}
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {resetDate && (
        <p className="text-[11px] text-gray-400">
          Resets {new Date(resetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>
      )}
    </div>
  )
}
