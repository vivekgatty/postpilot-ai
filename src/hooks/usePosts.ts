'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CreatePostInput, Post, UpdatePostInput } from '@/types'

interface UsePostsReturn {
  posts: Post[]
  loading: boolean
  error: string | null
  createPost: (input: CreatePostInput) => Promise<{ data: Post | null; error: string | null }>
  updatePost: (id: string, input: UpdatePostInput) => Promise<{ data: Post | null; error: string | null }>
  deletePost: (id: string) => Promise<{ error: string | null }>
  toggleFavourite: (id: string) => Promise<{ error: string | null }>
  refetch: () => Promise<void>
}

export function usePosts(): UsePostsReturn {
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

  // ── Create ──────────────────────────────────────────────────────────────────

  const createPost = useCallback(
    async (input: CreatePostInput): Promise<{ data: Post | null; error: string | null }> => {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('posts')
        .insert(input)
        .select()
        .single()

      if (err) return { data: null, error: err.message }

      const created = data as Post
      setPosts((prev) => [created, ...prev])
      return { data: created, error: null }
    },
    []
  )

  // ── Update ──────────────────────────────────────────────────────────────────

  const updatePost = useCallback(
    async (
      id: string,
      input: UpdatePostInput
    ): Promise<{ data: Post | null; error: string | null }> => {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('posts')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (err) return { data: null, error: err.message }

      const updated = data as Post
      setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)))
      return { data: updated, error: null }
    },
    []
  )

  // ── Delete ──────────────────────────────────────────────────────────────────

  const deletePost = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      const supabase = createClient()
      const { error: err } = await supabase.from('posts').delete().eq('id', id)

      if (err) return { error: err.message }

      setPosts((prev) => prev.filter((p) => p.id !== id))
      return { error: null }
    },
    []
  )

  // ── Toggle favourite ────────────────────────────────────────────────────────

  const toggleFavourite = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      // Optimistic update — flip locally first
      let next: boolean | undefined
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p
          next = !p.is_favourite
          return { ...p, is_favourite: next }
        })
      )

      const supabase = createClient()
      const { error: err } = await supabase
        .from('posts')
        .update({ is_favourite: next })
        .eq('id', id)

      if (err) {
        // Revert on failure
        setPosts((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, is_favourite: !next } : p
          )
        )
        return { error: err.message }
      }

      return { error: null }
    },
    []
  )

  return {
    posts,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    toggleFavourite,
    refetch: fetchPosts,
  }
}
