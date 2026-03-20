'use client'

import { useCallback, useEffect, useState } from 'react'
import type { PlanType, UsageInfo } from '@/types'
import { PLAN_LIMITS } from '@/lib/constants'

interface UseUsageReturn {
  used: number
  limit: number         // -1 = unlimited
  plan: PlanType
  percentage: number    // 0-100; always 0 when limit === -1
  isAtLimit: boolean    // always false when limit === -1
  resetDate: string
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const DEFAULTS: UsageInfo = {
  used: 0,
  limit: PLAN_LIMITS.free,
  plan: 'free',
  resetDate: '',
}

export function useUsage(): UseUsageReturn {
  const [info, setInfo] = useState<UsageInfo>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/user/usage')
      if (!res.ok) throw new Error(`Failed to fetch usage (${res.status})`)
      const data = (await res.json()) as UsageInfo
      setInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  const isUnlimited = info.limit === -1
  const percentage = isUnlimited
    ? 0
    : Math.min(100, Math.round((info.used / info.limit) * 100))
  const isAtLimit = !isUnlimited && info.used >= info.limit

  return {
    used: info.used,
    limit: info.limit,
    plan: info.plan,
    percentage,
    isAtLimit,
    resetDate: info.resetDate,
    loading,
    error,
    refetch: fetchUsage,
  }
}
