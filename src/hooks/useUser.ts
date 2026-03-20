'use client'

import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface UseUserReturn {
  user: User | null
  profile: Profile | null
  loading: boolean
  error: string | null
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async (authUser: User) => {
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (err) {
      setError(err.message)
      setProfile(null)
    } else {
      setProfile(data as Profile)
      setError(null)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    async function init() {
      setLoading(true)
      const {
        data: { user: authUser },
        error: authErr,
      } = await supabase.auth.getUser()

      if (authErr || !authUser) {
        setUser(null)
        setProfile(null)
        setError(authErr?.message ?? null)
        setLoading(false)
        return
      }

      setUser(authUser)
      await fetchProfile(authUser)
      setLoading(false)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user)
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  return { user, profile, loading, error }
}
