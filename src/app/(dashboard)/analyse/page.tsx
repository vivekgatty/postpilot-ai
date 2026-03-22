'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { useToast } from '@/components/ui/Toast'
import AnalyserScoreCard from '@/components/features/AnalyserScoreCard'
import AnalyserSuggestions from '@/components/features/AnalyserSuggestions'
import AnalyserTimingCard from '@/components/features/AnalyserTimingCard'
import type { PostAnalysis, AnalysisSuggestion, NicheType, BulkAnalysisPost } from '@/types'
import { ANALYSER_LIMITS, getGradeFromScore } from '@/lib/analyserConfig'
import { NICHE_OPTIONS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  BarChart2, History, Layers, ArrowLeft,
  RotateCcw, Copy, Check,
} from 'lucide-react'

// Silence unused-import lints for items imported per spec
void (useRef as unknown)
void (ArrowLeft as unknown)
void (RotateCcw as unknown)
void (getGradeFromScore as unknown)
void (ANALYSER_LIMITS as unknown)

// ─── Post type pills ──────────────────────────────────────────────────────────

const POST_TYPES: { id: 'text' | 'carousel' | 'poll' | 'question'; label: string }[] = [
  { id: 'text',      label: 'Text post' },
  { id: 'carousel',  label: 'Carousel' },
  { id: 'poll',      label: 'Poll' },
  { id: 'question',  label: 'Question' },
]

// ─── Character counter colour ─────────────────────────────────────────────────

function charCountColour(len: number): string {
  if (len >= 800 && len <= 1500) return '#166534'       // green
  if ((len >= 500 && len <= 799) || (len >= 1501 && len <= 2000)) return '#B45309' // amber
  return '#B91C1C'                                       // red
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalysePage() {
  const { profile }   = useUser()
  const { toast }     = useToast()
  const router        = useRouter()
  const searchParams  = useSearchParams()

  void router

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab,          setActiveTab]          = useState<'analyse' | 'bulk' | 'history'>('analyse')
  const [currentStep,        setCurrentStep]        = useState<0 | 1>(0)
  const [postContent,        setPostContent]        = useState('')
  const [postType,           setPostType]           = useState<'text' | 'carousel' | 'poll' | 'question'>('text')
  const [niche,              setNiche]              = useState(profile?.niche ?? 'Other')
  const [currentAnalysis,    setCurrentAnalysis]    = useState<PostAnalysis | null>(null)
  const [editedContent,      setEditedContent]      = useState('')
  const [isAnalysing,        setIsAnalysing]        = useState(false)
  const [isReanalysing,      setIsReanalysing]      = useState(false)
  const [savedAnalyses,      setSavedAnalyses]      = useState<PostAnalysis[]>([])
  const [historyLoading,     setHistoryLoading]     = useState(false)
  const [selectedDimensionId, setSelectedDimensionId] = useState<string | null>(null)
  const [copiedPost,         setCopiedPost]         = useState(false)
  const [bulkPosts,          setBulkPosts]          = useState<string[]>(['', ''])
  const [bulkPostType,       setBulkPostType]       = useState<'text' | 'carousel' | 'poll' | 'question'>('text')
  const [bulkResults,        setBulkResults]        = useState<BulkAnalysisPost[] | null>(null)
  const [bulkWinner,         setBulkWinner]         = useState<number | null>(null)
  const [isBulkAnalysing,    setIsBulkAnalysing]    = useState(false)

  void selectedDimensionId

  // Sync niche from profile once loaded
  useEffect(() => {
    if (profile?.niche) setNiche(profile.niche)
  }, [profile?.niche])

  // ── URL params ─────────────────────────────────────────────────────────────
  const postIdRef        = useRef<string | null>(null)
  const handleAnalyseRef = useRef<() => Promise<void>>(async () => {})

  const handleAnalyse = useCallback(async () => {
    setIsAnalysing(true)
    const contentToAnalyse = editedContent || postContent
    if (contentToAnalyse.length < 50) {
      toast.error('Post must be at least 50 characters')
      setIsAnalysing(false)
      return
    }
    try {
      const res = await fetch('/api/analyse/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentToAnalyse,
          post_type: postType,
          niche,
          source: 'standalone',
          ...(postIdRef.current ? { post_id: postIdRef.current } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 403 && data.code === 'DAILY_LIMIT') {
          toast.error(data.message ?? 'Daily limit reached')
        } else {
          toast.error('Analysis failed. Try again.')
        }
        return
      }
      setCurrentAnalysis(data)
      setEditedContent(contentToAnalyse)
      setCurrentStep(1)
    } catch {
      toast.error('Analysis failed. Try again.')
    } finally {
      setIsAnalysing(false)
    }
  }, [editedContent, postContent, postType, niche, toast])

  // Keep ref current so the URL-params effect can call it
  useEffect(() => { handleAnalyseRef.current = handleAnalyse }, [handleAnalyse])

  useEffect(() => {
    const content     = searchParams.get('content')
    const pType       = searchParams.get('post_type')
    const auto        = searchParams.get('auto')
    const postIdParam = searchParams.get('post_id')

    if (content) {
      const decoded = decodeURIComponent(content)
      setPostContent(decoded)
      setEditedContent(decoded)
    }
    if (pType) {
      setPostType(pType as 'text' | 'carousel' | 'poll' | 'question')
    }
    if (postIdParam) {
      postIdRef.current = postIdParam
    }
    if (auto === 'true' && content) {
      handleAnalyseRef.current()
    }
    // Run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleApplySuggestion(suggestion: AnalysisSuggestion, newContent: string) {
    setEditedContent(newContent)
    if (currentAnalysis) {
      const updatedSuggestions = currentAnalysis.suggestions.map(s =>
        s.id === suggestion.id ? { ...s, is_applied: true } : s
      )
      const updated = { ...currentAnalysis, suggestions: updatedSuggestions }
      setCurrentAnalysis(updated)
      if (currentAnalysis.id) {
        fetch(`/api/analyse/${currentAnalysis.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ suggestions: updatedSuggestions }),
        })
      }
    }
  }

  async function handleReanalyse() {
    if (!currentAnalysis?.id) return
    setIsReanalysing(true)
    try {
      const res = await fetch('/api/analyse/reanalyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: currentAnalysis.id,
          improved_content: editedContent,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 403) {
          toast.info('Re-analysis available on Starter plan')
        } else {
          toast.error('Re-analysis failed')
        }
        return
      }
      setCurrentAnalysis(data)
      toast.success(`Re-analysis complete! New score: ${data.overall_score}/100`)
    } catch {
      toast.error('Re-analysis failed')
    } finally {
      setIsReanalysing(false)
    }
  }

  function handleCopyPost() {
    navigator.clipboard.writeText(editedContent)
    setCopiedPost(true)
    setTimeout(() => setCopiedPost(false), 2000)
    toast.success('Post copied to clipboard')
  }

  async function handleLoadHistory() {
    setHistoryLoading(true)
    try {
      const res  = await fetch('/api/analyse/list')
      const data = await res.json()
      setSavedAnalyses(data.analyses ?? [])
    } catch {
      // noop — silently fail; history tab will show empty
    } finally {
      setHistoryLoading(false)
    }
  }

  async function handleBulkAnalyse() {
    const plan = profile?.plan || 'free'
    if (!(['pro', 'agency'] as string[]).includes(plan)) {
      toast.info('Bulk analysis available on Pro plan')
      return
    }
    const validPosts = bulkPosts.filter(p => p.trim().length >= 50)
    if (validPosts.length < 2) {
      toast.error('Add at least 2 posts with 50+ characters each')
      return
    }
    setIsBulkAnalysing(true)
    try {
      const res = await fetch('/api/analyse/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: validPosts, post_type: bulkPostType, niche }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 403) {
          toast.info(data.message ?? 'Upgrade required')
        } else {
          toast.error('Bulk analysis failed')
        }
        return
      }
      setBulkResults(data.posts)
      setBulkWinner(data.winner_index)
    } catch {
      toast.error('Bulk analysis failed')
    } finally {
      setIsBulkAnalysing(false)
    }
  }

  function handleStartFresh() {
    setCurrentStep(0)
    setCurrentAnalysis(null)
    setEditedContent('')
  }

  // ── Inner components ───────────────────────────────────────────────────────

  function SingleAnalyseInput() {
    return (
      <div className="flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-5">

          {/* Post type selector */}
          <div className="flex gap-2 flex-wrap">
            {POST_TYPES.map(pt => (
              <button
                key={pt.id}
                type="button"
                onClick={() => setPostType(pt.id)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-semibold border transition-all',
                  postType === pt.id
                    ? 'text-white border-transparent'
                    : 'text-gray-500 border-gray-200 bg-white hover:border-gray-300',
                )}
                style={postType === pt.id ? { background: '#1D9E75', borderColor: '#1D9E75' } : {}}
              >
                {pt.label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              Paste or write your LinkedIn post
            </label>
            <textarea
              rows={10}
              value={postContent}
              onChange={e => {
                setPostContent(e.target.value)
                setEditedContent(e.target.value)
              }}
              placeholder="Paste your post here before publishing — or type directly..."
              maxLength={3000}
              className="w-full rounded-xl px-4 py-3 text-sm border outline-none resize-none focus:ring-2 focus:ring-[#1D9E7540] transition-all"
              style={{ background: '#FAFAF9', border: '1px solid #E5E4E0', minHeight: '200px' }}
            />
            <p
              className="text-xs text-right font-medium"
              style={{ color: charCountColour(postContent.length) }}
            >
              {postContent.length} / 3000
            </p>
          </div>

          {/* Niche */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Your niche</label>
            <select
              value={niche}
              onChange={e => setNiche(e.target.value as NicheType)}
              className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none focus:ring-2 focus:ring-[#1D9E7540] transition-all"
              style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
            >
              {NICHE_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Analyse button */}
          <button
            type="button"
            disabled={postContent.length < 50 || isAnalysing}
            onClick={handleAnalyse}
            className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: '#1D9E75' }}
          >
            {isAnalysing ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Analysing…
              </>
            ) : 'Analyse my post'}
          </button>

        </div>
      </div>
    )
  }

  function SingleAnalyseResults() {
    if (!currentAnalysis) return null

    const anyApplied = currentAnalysis.suggestions.some(s => s.is_applied)

    return (
      <div className="space-y-4">

        {/* Back button */}
        <button
          type="button"
          onClick={handleStartFresh}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Analyse another post
        </button>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT — editable post + suggestions */}
          <div
            className="lg:w-[40%] space-y-4 lg:border-r lg:pr-6"
            style={{ borderColor: '#E5E4E0' }}
          >
            {/* Editable textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Your post
              </label>
              <textarea
                rows={8}
                value={editedContent}
                onChange={e => setEditedContent(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm border outline-none resize-none focus:ring-2 focus:ring-[#1D9E7540] transition-all"
                style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
              />
              <p className="text-xs text-gray-400">{editedContent.length} chars</p>
            </div>

            {/* Action row */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyPost}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
                style={
                  copiedPost
                    ? { background: '#E1F5EE', color: '#0F6E56', borderColor: '#1D9E7540' }
                    : { background: '#F5F5F3', color: '#6B7280', borderColor: '#E5E4E0' }
                }
              >
                {copiedPost ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedPost ? 'Copied ✓' : 'Copy post'}
              </button>

              {anyApplied && (
                <button
                  type="button"
                  onClick={handleReanalyse}
                  disabled={isReanalysing}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all disabled:opacity-60"
                  style={{ background: 'transparent', color: '#1D9E75', borderColor: '#1D9E7540' }}
                >
                  {isReanalysing ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <RotateCcw className="w-4 h-4" />
                  )}
                  Re-analyse
                </button>
              )}
            </div>

            {/* Suggestions */}
            <AnalyserSuggestions
              analysis={currentAnalysis}
              plan={profile?.plan ?? 'free'}
              onApplySuggestion={handleApplySuggestion}
              onReanalyse={handleReanalyse}
              isReanalysing={isReanalysing}
              currentContent={editedContent}
            />
          </div>

          {/* RIGHT — score card + timing */}
          <div className="lg:w-[60%] space-y-4">
            <AnalyserScoreCard
              analysis={currentAnalysis}
              plan={profile?.plan ?? 'free'}
              onViewDimension={(id) => setSelectedDimensionId(id)}
            />
            <AnalyserTimingCard analysis={currentAnalysis} />
          </div>

        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* Page title */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#0A2540]">Post Analyser</h1>
        <p className="text-sm text-gray-500 mt-0.5">Score your LinkedIn post before you publish</p>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('analyse')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
            activeTab === 'analyse' ? 'bg-white text-[#0A2540] shadow-sm' : 'text-gray-500 hover:text-gray-700',
          )}
        >
          <BarChart2 className="w-4 h-4" />
          Analyse post
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bulk')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
            activeTab === 'bulk' ? 'bg-white text-[#0A2540] shadow-sm' : 'text-gray-500 hover:text-gray-700',
          )}
        >
          <Layers className="w-4 h-4" />
          Bulk compare
          {!(['pro', 'agency'] as string[]).includes(profile?.plan ?? '') && (
            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 ml-1">Pro</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('history')
            handleLoadHistory()
          }}
          className={cn(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
            activeTab === 'history' ? 'bg-white text-[#0A2540] shadow-sm' : 'text-gray-500 hover:text-gray-700',
          )}
        >
          <History className="w-4 h-4" />
          History
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {activeTab === 'analyse' && (
          <>
            {currentStep === 0 && <SingleAnalyseInput />}
            {currentStep === 1 && currentAnalysis && <SingleAnalyseResults />}
          </>
        )}

        {activeTab === 'bulk' && (
          <div className="flex flex-col gap-6 max-w-3xl">
            {!(['pro', 'agency'] as string[]).includes(profile?.plan || '') && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">
                  Bulk Compare — Pro plan feature
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Compare up to 5 versions of a post to see which is strongest before publishing.
                </p>
                <a href="/dashboard/settings"
                  className="text-xs text-teal-600 font-medium hover:underline mt-2 inline-block">
                  Upgrade to Pro →
                </a>
              </div>
            )}
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-sm text-gray-500">Post type:</span>
              {(['text', 'carousel', 'poll', 'question'] as const).map(t => (
                <button key={t}
                  type="button"
                  onClick={() => setBulkPostType(t)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    bulkPostType === t
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-gray-200 text-gray-600 hover:border-teal-300'
                  }`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {bulkPosts.map((post, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500">
                      Post {i + 1}
                      {bulkResults && bulkWinner === i && (
                        <span className="ml-2 px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                          ★ Winner
                        </span>
                      )}
                    </label>
                    {bulkResults && bulkResults[i] && (
                      <span className="text-xs font-medium"
                        style={{ color: getGradeFromScore(bulkResults[i].score).color }}>
                        {bulkResults[i].score}/100 — {bulkResults[i].grade}
                      </span>
                    )}
                  </div>
                  <textarea
                    value={post}
                    onChange={e => {
                      const updated = [...bulkPosts]
                      updated[i] = e.target.value
                      setBulkPosts(updated)
                    }}
                    rows={6}
                    placeholder={`Paste post version ${i + 1} here...`}
                    className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {bulkResults && bulkResults[i] && (
                    <p className="text-xs text-gray-500 italic">{bulkResults[i].summary}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 items-center">
              {bulkPosts.length < 5 && (
                <button
                  type="button"
                  onClick={() => setBulkPosts([...bulkPosts, ''])}
                  className="text-sm text-teal-600 hover:underline"
                >
                  + Add another post
                </button>
              )}
              {bulkPosts.length > 2 && (
                <button
                  type="button"
                  onClick={() => setBulkPosts(bulkPosts.slice(0, -1))}
                  className="text-sm text-gray-400 hover:underline"
                >
                  Remove last
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleBulkAnalyse}
              disabled={isBulkAnalysing || !(['pro', 'agency'] as string[]).includes(profile?.plan || '')}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-start"
            >
              {isBulkAnalysing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Comparing posts...
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  Compare {bulkPosts.filter(p => p.trim().length >= 50).length} posts
                </>
              )}
            </button>
            {bulkResults && bulkWinner !== null && (
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-sm font-medium text-teal-800">
                  Post {bulkWinner + 1} is your strongest ({bulkResults[bulkWinner].score}/100)
                </p>
                <p className="text-xs text-teal-700 mt-1">
                  {bulkResults[bulkWinner].summary}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPostContent(bulkPosts[bulkWinner!])
                    setEditedContent(bulkPosts[bulkWinner!])
                    setActiveTab('analyse')
                    setCurrentStep(0)
                  }}
                  className="text-xs text-teal-600 font-medium hover:underline mt-2 block"
                >
                  Run full analysis on winner →
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Analysis history</h2>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('analyse')
                  setCurrentStep(0)
                }}
                className="px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 flex items-center gap-2"
              >
                <BarChart2 className="w-4 h-4" />
                New analysis
              </button>
            </div>
            {historyLoading && (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            )}
            {!historyLoading && savedAnalyses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <History className="w-12 h-12 text-gray-300" />
                <p className="text-gray-500">No analyses yet</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('analyse')}
                  className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
                >
                  Analyse your first post
                </button>
              </div>
            )}
            {!historyLoading && savedAnalyses.length > 0 && (
              <>
                {!(['starter', 'pro', 'agency'] as string[]).includes(profile?.plan || '') && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    Free plan shows current session only. Upgrade to Starter to save 30 days of history.
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  {savedAnalyses.map(a => (
                    <div key={a.id}
                      className="flex items-center justify-between p-4 bg-white border rounded-lg gap-4 hover:border-teal-200 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center border"
                          style={{
                            borderColor: getGradeFromScore(a.overall_score).color,
                            backgroundColor: getGradeFromScore(a.overall_score).color + '15',
                          }}
                        >
                          <span className="text-lg font-bold"
                            style={{ color: getGradeFromScore(a.overall_score).color }}>
                            {a.grade}
                          </span>
                          <span className="text-xs text-gray-500">{a.overall_score}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {a.post_content.slice(0, 60)}...
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {a.post_type} · {a.niche} · {new Date(a.created_at!).toLocaleDateString()}
                            {a.actual_reactions !== undefined && (
                              <> · {a.actual_reactions} reactions</>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentAnalysis(a)
                          setEditedContent(a.post_content)
                          setPostContent(a.post_content)
                          setCurrentStep(1)
                          setActiveTab('analyse')
                        }}
                        className="flex-shrink-0 text-xs px-3 py-1.5 border rounded-lg hover:bg-gray-50"
                      >
                        View →
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
