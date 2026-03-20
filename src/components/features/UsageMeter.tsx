'use client'

import { UsageStats } from '@/types'
import { calculateUsagePercent, isUnlimited } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface UsageMeterProps {
  stats: UsageStats
  compact?: boolean
}

export default function UsageMeter({ stats, compact = false }: UsageMeterProps) {
  const postsPercent = calculateUsagePercent(
    stats.posts_generated,
    stats.posts_limit
  )
  const ideasPercent = calculateUsagePercent(
    stats.ideas_generated,
    stats.ideas_limit
  )

  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      <UsageBar
        label="Posts"
        used={stats.posts_generated}
        limit={stats.posts_limit}
        percent={postsPercent}
        compact={compact}
      />
      <UsageBar
        label="Ideas"
        used={stats.ideas_generated}
        limit={stats.ideas_limit}
        percent={ideasPercent}
        compact={compact}
      />
    </div>
  )
}

function UsageBar({
  label,
  used,
  limit,
  percent,
  compact,
}: {
  label: string
  used: number
  limit: number
  percent: number
  compact?: boolean
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="text-gray-500">
          {used} / {isUnlimited(limit) ? '∞' : limit}
        </span>
      </div>
      {!isUnlimited(limit) && (
        <div className={cn('bg-gray-100 rounded-full overflow-hidden', compact ? 'h-1.5' : 'h-2')}>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-amber-500' : 'bg-[#1D9E75]'
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  )
}
