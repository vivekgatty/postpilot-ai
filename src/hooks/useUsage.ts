'use client'

import { useEffect, useState, useCallback } from 'react'
import type { UsageStats } from '@/types'

export function useUsage() {
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/user/usage')
      if (!res.ok) throw new Error('Failed to fetch usage')
      const data = await res.json() as UsageStats
      setUsage(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  return { usage, loading, error, refetch: fetchUsage }
}
