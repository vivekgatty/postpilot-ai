'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Post } from '@/types'

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err
      setPosts((data as Post[]) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const deletePost = useCallback(async (id: string) => {
    const supabase = createClient()
    const { error: err } = await supabase.from('posts').delete().eq('id', id)
    if (!err) {
      setPosts((prev) => prev.filter((p) => p.id !== id))
    }
    return { error: err }
  }, [])

  return { posts, loading, error, refetch: fetchPosts, deletePost }
}
