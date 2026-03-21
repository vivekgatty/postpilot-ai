'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import PlannerSetupWizard from '@/components/features/PlannerSetupWizard'
import PlannerCalendar    from '@/components/features/PlannerCalendar'
import PlannerMonthStats  from '@/components/features/PlannerMonthStats'
import PostDetailPanel    from '@/components/features/PostDetailPanel'
import ContentBankSidebar from '@/components/features/ContentBankSidebar'
import ConnectLinkedInModal from '@/components/features/ConnectLinkedInModal'
import PlannerSettingsDrawer from '@/components/features/PlannerSettingsDrawer'
import type {
  PlannedPost, ContentPillar, PlannerSettings,
  ContentBankItem, LinkedInConnection,
} from '@/types'

// ─── Loading overlay ──────────────────────────────────────────────────────────

const GENERATING_MESSAGES = [
  'Analysing your content pillars…',
  'Building your content strategy…',
  'Matching topics to your goals…',
  'Scheduling for maximum LinkedIn reach…',
  'Almost ready…',
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlannerPage() {
  const searchParams = useSearchParams()

  // ── State ─────────────────────────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth]     = useState(new Date())
  const [posts, setPosts]                   = useState<PlannedPost[]>([])
  const [pillars, setPillars]               = useState<ContentPillar[]>([])
  const [settings, setSettings]             = useState<PlannerSettings | null>(null)
  const [selectedPost, setSelectedPost]     = useState<PlannedPost | null>(null)
  const [bankItems, setBankItems]           = useState<ContentBankItem[]>([])
  const [suggestions, setSuggestions]       = useState<{ title: string; topic: string }[]>([])
  const [connection, setConnection]         = useState<LinkedInConnection | null>(null)
  const [linkedInConnected, setLinkedInConnected] = useState(false)
  const [showSetupWizard, setShowSetupWizard]     = useState(false)
  const [isGenerating, setIsGenerating]     = useState(false)
  const [generateMsgIdx, setGenerateMsgIdx] = useState(0)
  const [showSettings, setShowSettings]     = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [toast, setToast]                   = useState<string | null>(null)
  const [userNiche, setUserNiche]           = useState('Other')
  const [confirmRegen, setConfirmRegen]     = useState(false)

  // ── Toast helper ──────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }, [])

  // ── Month string ──────────────────────────────────────────────────────────────
  const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`

  // ── Fetch data ────────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    const res  = await fetch(`/api/planner/posts?month=${monthStr}`)
    const data = await res.json() as { posts: PlannedPost[] }
    setPosts(data.posts ?? [])
  }, [monthStr])

  useEffect(() => {
    const init = async () => {
      // Check LinkedIn connected param
      if (searchParams.get('linkedin_connected') === 'true') {
        setLinkedInConnected(true)
        showToast('LinkedIn connected! You can now post directly from PostPika.')
      }

      // Fetch settings
      const settingsRes  = await fetch('/api/planner/settings')
      const settingsData = await settingsRes.json() as { settings: PlannerSettings }
      setSettings(settingsData.settings)

      if (!settingsData.settings.setup_completed) {
        setShowSetupWizard(true)
      }

      // Fetch pillars
      const pillarsRes  = await fetch('/api/planner/pillars')
      const pillarsData = await pillarsRes.json() as { pillars: ContentPillar[] }
      setPillars(pillarsData.pillars ?? [])

      // Fetch posts
      const postsRes  = await fetch(`/api/planner/posts?month=${monthStr}`)
      const postsData = await postsRes.json() as { posts: PlannedPost[] }
      setPosts(postsData.posts ?? [])

      // Fetch content bank
      const bankRes  = await fetch('/api/planner/content-bank')
      const bankData = await bankRes.json() as { items: ContentBankItem[] }
      setBankItems(bankData.items ?? [])

      // Fetch user profile (niche + LinkedIn connection)
      const profileRes  = await fetch('/api/user/profile')
      const profileData = await profileRes.json() as { profile: { niche: string; linkedin_connection?: LinkedInConnection } }
      setUserNiche(profileData.profile?.niche ?? 'Other')

      // Fire-and-forget: process any due scheduled posts for this user.
      // Replaces the Vercel cron (not available on Hobby plan) — running on
      // every planner page open is sufficient for scheduled posting.
      fetch('/api/planner/process-queue', { method: 'POST' }).catch(() => {})

      // Check LinkedIn connection via separate call
      const liRes  = await fetch('/api/linkedin/status').catch(() => null)
      if (liRes?.ok) {
        const liData = await liRes.json() as { connected: boolean; connection: LinkedInConnection | null }
        setLinkedInConnected(liData.connected)
        setConnection(liData.connection)
      }
    }

    init().catch(console.error)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch posts when month changes
  useEffect(() => {
    if (settings) fetchPosts()
  }, [monthStr, fetchPosts, settings])

  // ── Generating messages cycle ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isGenerating) return
    const iv = setInterval(() => {
      setGenerateMsgIdx((i) => (i + 1) % GENERATING_MESSAGES.length)
    }, 1800)
    return () => clearInterval(iv)
  }, [isGenerating])

  // ── Generate plan ─────────────────────────────────────────────────────────────
  const generatePlan = async (regenerateAll = false) => {
    setIsGenerating(true)
    setGenerateMsgIdx(0)
    try {
      const res  = await fetch('/api/planner/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ month: monthStr, regenerateAll }),
      })
      const data = await res.json() as { posts: PlannedPost[]; count: number; error?: string }
      if (data.error === 'SETUP_REQUIRED') {
        setShowSetupWizard(true)
        return
      }
      if (data.posts) {
        setPosts((prev) => {
          const newIds = new Set(data.posts.map((p) => p.id))
          const existing = prev.filter((p) => !newIds.has(p.id))
          return [...existing, ...data.posts]
        })
        showToast(`Your ${currentMonth.toLocaleDateString('en-IN', { month: 'long' })} plan is ready — ${data.count} posts planned`)
      }
    } catch (err) {
      console.error(err)
      showToast('Failed to generate plan. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Wizard complete ───────────────────────────────────────────────────────────
  const handleWizardComplete = (newSettings: PlannerSettings, newPillars: ContentPillar[]) => {
    setSettings(newSettings)
    setPillars(newPillars)
    setShowSetupWizard(false)
    fetchPosts()
  }

  // ── Post updates ──────────────────────────────────────────────────────────────
  const handlePostUpdate = (updated: PlannedPost) => {
    setPosts((prev) => prev.map((p) => p.id === updated.id ? updated : p))
    setSelectedPost(updated)
  }

  const handlePostDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    setSelectedPost(null)
  }

  // ── Day click — create new post ───────────────────────────────────────────────
  const handleDayClick = async (date: Date) => {
    const planned_date = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const res = await fetch('/api/planner/posts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        title:        'New post idea',
        topic:        '',
        format:       'text',
        planned_date,
        planned_time: settings?.preferred_time ?? '08:00',
      }),
    })
    const data = await res.json() as { post: PlannedPost }
    if (data.post) {
      setPosts((prev) => [...prev, data.post])
      setSelectedPost(data.post)
    }
  }

  // ── Drop from content bank ────────────────────────────────────────────────────
  const handleDropFromBank = async (item: ContentBankItem, date: Date) => {
    const planned_date = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const res = await fetch('/api/planner/posts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        pillar_id:    item.pillar_id,
        title:        item.title,
        topic:        item.topic,
        hook_suggestion: item.hook,
        format:       item.format,
        planned_date,
        planned_time: settings?.preferred_time ?? '08:00',
      }),
    })
    const data = await res.json() as { post: PlannedPost }
    if (data.post) {
      setPosts((prev) => [...prev, data.post])
      // Mark bank item as used
      await fetch(`/api/planner/content-bank/${item.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ is_used: true }),
      })
      setBankItems((prev) => prev.filter((b) => b.id !== item.id))
    }
  }

  // ── Publish now ───────────────────────────────────────────────────────────────
  const handlePublishNow = async (post: PlannedPost) => {
    if (!linkedInConnected) { setShowConnectModal(true); return }
    if (!post.post_id) {
      showToast('Write the full post first, then come back to publish.')
      return
    }
    // Fetch post content
    const postRes  = await fetch(`/api/posts/${post.post_id}`)
    const postData = await postRes.json() as { post: { content: string } }
    if (!postData.post) return

    if (!confirm(`Ready to post to LinkedIn?\n\n${postData.post.content.slice(0, 200)}…`)) return

    const res  = await fetch('/api/linkedin/publish', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ plannedPostId: post.id, postId: post.post_id, content: postData.post.content }),
    })
    const data = await res.json() as { success?: boolean; postUrl?: string; error?: string }
    if (data.success) {
      showToast('Published to LinkedIn! 🎉')
      fetchPosts()
    } else {
      showToast(data.error ?? 'Failed to publish')
    }
  }

  // ── Schedule ──────────────────────────────────────────────────────────────────
  const handleSchedule = async (post: PlannedPost, scheduledFor: string) => {
    if (!post.post_id) { showToast('Write the full post first.'); return }
    const postRes  = await fetch(`/api/posts/${post.post_id}`)
    const postData = await postRes.json() as { post: { content: string } }
    if (!postData.post) return

    const res  = await fetch('/api/linkedin/publish', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ plannedPostId: post.id, postId: post.post_id, content: postData.post.content, scheduledFor }),
    })
    const data = await res.json() as { queued?: boolean; error?: string }
    if (data.queued) {
      showToast(`Scheduled for ${new Date(scheduledFor).toLocaleString('en-IN')}`)
      fetchPosts()
    }
  }

  // ── Content bank actions ──────────────────────────────────────────────────────
  const handleAddBankItem = async (item: { title: string; topic: string; hook: string; pillar_id: string | null; format: string }) => {
    const res  = await fetch('/api/planner/content-bank', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(item),
    })
    const data = await res.json() as { item: ContentBankItem }
    if (data.item) setBankItems((prev) => [data.item, ...prev])
  }

  const handleMarkBankUsed = async (itemId: string) => {
    await fetch(`/api/planner/content-bank/${itemId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ is_used: true }),
    })
    setBankItems((prev) => prev.filter((b) => b.id !== itemId))
  }

  const handleDeleteBankItem = async (itemId: string) => {
    await fetch(`/api/planner/content-bank/${itemId}`, { method: 'DELETE' })
    setBankItems((prev) => prev.filter((b) => b.id !== itemId))
  }

  const handleSaveSuggestion = async (title: string, topic: string) => {
    await handleAddBankItem({ title, topic, hook: '', pillar_id: null, format: 'text' })
    showToast('Saved to content bank')
  }

  // ── Settings saved ────────────────────────────────────────────────────────────
  const handleSettingsSaved = (newSettings: PlannerSettings, newPillars: ContentPillar[]) => {
    setSettings(newSettings)
    setPillars(newPillars)
    setShowSettings(false)
    showToast('Settings saved!')
  }

  // ── Month label ───────────────────────────────────────────────────────────────
  const monthLabel = currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const hasExistingPlan = posts.some((p) => p.status !== 'idea')

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-screen bg-[#F7F6F3]">

      {/* Setup wizard overlay */}
      {showSetupWizard && (
        <PlannerSetupWizard
          userNiche={userNiche}
          onComplete={handleWizardComplete}
        />
      )}

      {/* Generating overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-white/90 flex flex-col items-center justify-center gap-6">
          <div className="text-5xl">🐦</div>
          <div className="w-10 h-10 border-3 border-[#1D9E75] border-t-transparent rounded-full animate-spin" />
          <p className="text-lg font-semibold text-[#0A2540] text-center max-w-xs animate-pulse">
            {GENERATING_MESSAGES[generateMsgIdx]}
          </p>
        </div>
      )}

      {/* Content bank sidebar */}
      {settings && (
        <ContentBankSidebar
          items={bankItems}
          pillars={pillars}
          suggestions={suggestions}
          onAddItem={handleAddBankItem}
          onMarkUsed={handleMarkBankUsed}
          onDeleteItem={handleDeleteBankItem}
          onDragStart={() => {}}
          onSaveSuggestion={handleSaveSuggestion}
        />
      )}

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">

          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0A2540]">Content Planner</h1>
              <p className="text-sm text-gray-500 mt-0.5">Plan, schedule, and publish your LinkedIn content</p>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              {/* LinkedIn status chip */}
              {linkedInConnected ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-xs text-green-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  LinkedIn connected
                  <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    className="text-gray-400 hover:text-gray-600 ml-1"
                    title="Manage LinkedIn connection"
                  >
                    ⚙
                  </button>
                </div>
              ) : (
                <a
                  href="/api/linkedin/connect"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium hover:bg-amber-100 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Connect LinkedIn for direct posting
                </a>
              )}

              {/* Generate plan button */}
              {settings?.setup_completed && (
                <button
                  type="button"
                  onClick={() => {
                    if (hasExistingPlan) {
                      setConfirmRegen(true)
                    } else {
                      generatePlan(false)
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1D9E75] text-white text-sm font-semibold hover:bg-[#178a64] transition-colors"
                >
                  {hasExistingPlan ? 'Regenerate plan' : `Generate ${monthLabel} plan`}
                </button>
              )}

              {/* Settings gear */}
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                title="Planner settings"
              >
                ⚙
              </button>
            </div>
          </div>

          {/* Stats */}
          {settings && posts.length > 0 && (
            <PlannerMonthStats
              posts={posts}
              pillars={pillars}
              settings={settings}
            />
          )}

          {/* Calendar */}
          {settings ? (
            <PlannerCalendar
              posts={posts}
              pillars={pillars}
              currentMonth={currentMonth}
              preferredDays={settings.preferred_days}
              onMonthChange={setCurrentMonth}
              onPostClick={setSelectedPost}
              onDayClick={handleDayClick}
              onDropFromBank={handleDropFromBank}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E4E0] h-96 flex items-center justify-center">
              <p className="text-gray-400 text-sm">Loading your content planner…</p>
            </div>
          )}

        </div>
      </main>

      {/* Post detail panel */}
      {selectedPost && settings && (
        <PostDetailPanel
          post={selectedPost}
          pillars={pillars}
          linkedInConnected={linkedInConnected}
          onClose={() => setSelectedPost(null)}
          onUpdate={handlePostUpdate}
          onDelete={handlePostDelete}
          onWritePost={(p) => setSelectedPost(p)}
          onPublishNow={handlePublishNow}
          onSchedule={handleSchedule}
        />
      )}

      {/* Connect LinkedIn modal */}
      {showConnectModal && (
        <ConnectLinkedInModal onClose={() => setShowConnectModal(false)} />
      )}

      {/* Settings drawer */}
      {showSettings && settings && (
        <PlannerSettingsDrawer
          pillars={pillars}
          settings={settings}
          connection={connection}
          onClose={() => setShowSettings(false)}
          onSaved={handleSettingsSaved}
        />
      )}

      {/* Regenerate confirmation dialog */}
      {confirmRegen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-[#0A2540] mb-2">Regenerate plan?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This will replace all &ldquo;idea&rdquo; status posts for {monthLabel} with new AI-generated suggestions.
              Posts you&apos;ve drafted or scheduled won&apos;t be touched.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmRegen(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setConfirmRegen(false); generatePlan(true) }}
                className="flex-1 py-2.5 bg-[#1D9E75] text-white rounded-xl text-sm font-semibold hover:bg-[#178a64]">
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
          'px-5 py-3 rounded-xl bg-[#0A2540] text-white text-sm font-medium shadow-xl',
          'animate-in slide-in-from-bottom-4 duration-300',
        )}>
          {toast}
        </div>
      )}

    </div>
  )
}
