'use client'

import { useState, useEffect, useCallback } from 'react'
import CalendarGrid from '@/components/features/CalendarGrid'
import type { Post } from '@/types'

// ── Inline toast ──────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info' }

let toastId = 0

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [posts,    setPosts]    = useState<Post[]>([])
  const [month,    setMonth]    = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d
  })
  const [loading,  setLoading]  = useState(true)
  const [toasts,   setToasts]   = useState<Toast[]>([])

  // ── Toast helpers ───────────────────────────────────────────────────────────

  const pushToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  // ── Fetch posts ─────────────────────────────────────────────────────────────

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch both scheduled and draft posts
      const [scheduledRes, draftRes] = await Promise.all([
        fetch('/api/posts?status=scheduled&limit=100'),
        fetch('/api/posts?status=draft&limit=50'),
      ])

      const [scheduledData, draftData] = await Promise.all([
        scheduledRes.json() as Promise<{ posts: Post[] }>,
        draftRes.json()     as Promise<{ posts: Post[] }>,
      ])

      const all = [
        ...(scheduledData.posts ?? []),
        ...(draftData.posts     ?? []),
      ]
      setPosts(all)
    } catch {
      pushToast('Failed to load posts', 'error')
    } finally {
      setLoading(false)
    }
  }, [pushToast])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  // ── Schedule handler ────────────────────────────────────────────────────────

  async function handleSchedule(id: string, date: Date) {
    // Optimistic update
    const snapshot = posts
    setPosts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, status: 'scheduled', scheduled_for: date.toISOString() }
          : p
      )
    )

    try {
      const res  = await fetch(`/api/posts/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          status:        'scheduled',
          scheduled_for: date.toISOString(),
        }),
      })
      const data = await res.json() as { post?: Post; error?: string }

      if (!res.ok) throw new Error(data.error ?? 'Failed to schedule')

      // Replace with server response
      setPosts(prev => prev.map(p => p.id === id ? data.post! : p))
      pushToast('Post scheduled', 'success')
    } catch (err) {
      setPosts(snapshot)
      pushToast(err instanceof Error ? err.message : 'Failed to schedule post', 'error')
    }
  }

  // ── Unschedule handler ──────────────────────────────────────────────────────

  async function handleUnschedule(id: string) {
    const snapshot = posts
    setPosts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, status: 'draft', scheduled_for: null }
          : p
      )
    )

    try {
      const res  = await fetch(`/api/posts/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'draft', scheduled_for: null }),
      })
      const data = await res.json() as { post?: Post; error?: string }

      if (!res.ok) throw new Error(data.error ?? 'Failed to unschedule')

      setPosts(prev => prev.map(p => p.id === id ? data.post! : p))
      pushToast('Post moved back to drafts', 'info')
    } catch (err) {
      setPosts(snapshot)
      pushToast(err instanceof Error ? err.message : 'Failed to unschedule post', 'error')
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const scheduledCount = posts.filter(p => p.status === 'scheduled').length

  return (
    <div className="relative">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]">Content Calendar</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Plan and schedule your LinkedIn posts.
            {!loading && scheduledCount > 0 && (
              <span className="ml-2 text-[#1D9E75] font-medium">
                {scheduledCount} scheduled this month
              </span>
            )}
          </p>
        </div>

        <button
          onClick={fetchPosts}
          className="text-sm text-gray-400 hover:text-[#1D9E75] transition-colors"
          title="Refresh"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Calendar card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8">
            {/* Header shimmer */}
            <div className="flex items-center justify-between mb-6">
              <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
              <div className="w-40 h-5 bg-gray-100 rounded animate-pulse" />
              <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
            </div>
            {/* Grid shimmer */}
            <div className="grid grid-cols-7 gap-px">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-50 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-x-auto">
            <div className="min-w-[700px]">
              <CalendarGrid
                posts={posts}
                month={month}
                onMonthChange={setMonth}
                onSchedule={handleSchedule}
                onUnschedule={handleUnschedule}
              />
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!loading && posts.filter(p => p.status === 'scheduled').length === 0 && (
        <div className="mt-6 text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="text-4xl mb-3">🗓</div>
          <p className="text-gray-600 font-medium">No posts scheduled yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Click any future date on the calendar to schedule a draft, or{' '}
            <a href="/dashboard/generate" className="text-[#1D9E75] hover:underline">
              generate a new post
            </a>.
          </p>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={[
              'px-4 py-3 rounded-xl text-sm font-medium shadow-lg pointer-events-auto',
              'animate-in slide-in-from-bottom-2 fade-in duration-200',
              t.type === 'success' ? 'bg-[#1D9E75] text-white' :
              t.type === 'error'   ? 'bg-red-500 text-white' :
                                     'bg-[#0A2540] text-white',
            ].join(' ')}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
