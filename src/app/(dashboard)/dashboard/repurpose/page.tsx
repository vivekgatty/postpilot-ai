'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser }  from '@/hooks/useUser'
import { useToast } from '@/components/ui/Toast'
import { cn }       from '@/lib/utils'
import { Link2, FileText, AlertTriangle, RotateCw, Check, ChevronDown, ChevronUp, Lock, Trash2, Bookmark, Eye, EyeOff, Upload, X } from 'lucide-react'
import {
  detectPlatform, isLinkedInUrl, SOURCE_PLATFORMS, REPURPOSE_LIMITS, GENERIC_ANGLES_FREE,
} from '@/lib/repurposeConfig'
import { SYSTEM_TONES } from '@/lib/constants'
import RepurposePostCard from '@/components/features/RepurposePostCard'
import type { RepurposeAngle, RepurposedPost, RepurposeSession, RepurposeSettings } from '@/types'

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

interface ExtractedData {
  title: string; author: string; platform: string; word_count: number; text_preview: string
}

export default function RepurposePage() {
  const { profile } = useUser()
  const { toast }   = useToast()

  const plan   = profile?.plan ?? 'free'
  const limits = REPURPOSE_LIMITS[plan] ?? REPURPOSE_LIMITS.free

  // ── Tab / step ─────────────────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState<'repurpose' | 'history'>('repurpose')
  const [currentStep, setCurrentStep]  = useState<0 | 1 | 2 | 3>(0)

  // ── Step 0 ─────────────────────────────────────────────────────────────────
  const [sourceTab,        setSourceTab]        = useState<'url' | 'text'>('url')
  const [urlInput,         setUrlInput]         = useState('')
  const [textInput,        setTextInput]        = useState('')
  const [pdfFile,          setPdfFile]          = useState<File | null>(null)
  const [isExtracting,     setIsExtracting]     = useState(false)
  const [urlError,         setUrlError]         = useState<string | null>(null)
  const [detectedPlatform, setDetectedPlatform] = useState('website')

  // ── Step 1 ─────────────────────────────────────────────────────────────────
  const [sessionId,     setSessionId]     = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [editableText,  setEditableText]  = useState('')

  // ── Step 2 ─────────────────────────────────────────────────────────────────
  const [angles,          setAngles]          = useState<RepurposeAngle[]>([])
  const [anglesLoading,   setAnglesLoading]   = useState(false)
  const [isGeneric,       setIsGeneric]       = useState(false)
  const [selectedAngles,  setSelectedAngles]  = useState<string[]>([])
  const [postCount,       setPostCount]       = useState(5)
  const [toneId,          setToneId]          = useState('professional')
  const [includeCarousel, setIncludeCarousel] = useState(true)
  const [includePoll,     setIncludePoll]     = useState(false)
  const [addHashtags,     setAddHashtags]     = useState(true)
  const [addAttribution,  setAddAttribution]  = useState(false)

  // ── Step 3 ─────────────────────────────────────────────────────────────────
  const [generatedPosts, setGeneratedPosts] = useState<RepurposedPost[]>([])
  const [isGenerating,   setIsGenerating]   = useState(false)
  const [savingPostIds,  setSavingPostIds]  = useState<Set<string>>(new Set())

  // ── History ────────────────────────────────────────────────────────────────
  const [sessions,          setSessions]          = useState<RepurposeSession[]>([])
  const [sessionsLoading,   setSessionsLoading]   = useState(false)
  const [expandedSessions,  setExpandedSessions]  = useState<Set<string>>(new Set())
  const [sessionPosts,      setSessionPosts]      = useState<Record<string, string[]>>({})
  const [genMsgIdx,       setGenMsgIdx]       = useState(0)
  const [showFullText,    setShowFullText]     = useState(false)
  const [addingToBank,    setAddingToBank]    = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePdfUpload = useCallback((file: File) => {
    setPdfFile(file)
    setUrlError(null)
  }, [])

  // ── Rotate generate messages ───────────────────────────────────────────────
  const GEN_MSGS = [
    'Reading your content…', 'Finding the best insights…',
    'Writing your LinkedIn posts…', 'Structuring carousel slides…', 'Almost done…',
  ]
  useEffect(() => {
    if (!isGenerating) return
    const id = setInterval(() => setGenMsgIdx(i => (i + 1) % GEN_MSGS.length), 3000)
    return () => clearInterval(id)
  }, [isGenerating]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Detect platform on URL change ──────────────────────────────────────────
  useEffect(() => {
    setDetectedPlatform(urlInput.trim() ? detectPlatform(urlInput) : 'website')
  }, [urlInput])

  // ── Extract ────────────────────────────────────────────────────────────────
  const handleExtract = useCallback(async () => {
    setIsExtracting(true)
    setUrlError(null)
    try {
      let res: Response
      if (pdfFile) {
        const fd = new FormData()
        fd.append('file', pdfFile)
        res = await fetch('/api/repurpose/extract', { method: 'POST', body: fd })
      } else {
        const body = sourceTab === 'url' ? { url: urlInput.trim() } : { text: textInput.trim() }
        res = await fetch('/api/repurpose/extract', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
      }
      const data = await res.json()

      if (data.needs_manual_paste) {
        toast.error(data.error ?? 'Could not extract — please paste the text manually.')
        setUrlError(data.error ?? null)
        setSourceTab('text')
        return
      }
      if (!res.ok) {
        const msg = data.error ?? 'Extraction failed.'
        toast.error(msg)
        setUrlError(msg)
        return
      }

      setSessionId(data.session_id)
      setExtractedData({
        title: data.title ?? '', author: data.author ?? '',
        platform: data.platform ?? 'website',
        word_count: data.word_count ?? 0, text_preview: data.text_preview ?? '',
      })
      setEditableText(data.text_preview ?? '')
      setCurrentStep(1)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsExtracting(false)
    }
  }, [sourceTab, urlInput, textInput, pdfFile, toast])

  // ── Angles ─────────────────────────────────────────────────────────────────
  const handleAnglesLoad = useCallback(async () => {
    setAnglesLoading(true)
    try {
      const res  = await fetch('/api/repurpose/angles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, post_count: postCount }),
      })
      const data = await res.json()
      if (res.ok) {
        setAngles(data.angles ?? [])
        setIsGeneric(data.is_generic ?? true)
        setSelectedAngles((data.angles ?? []).map((a: RepurposeAngle) => a.id))
      }
    } catch { toast.error('Could not load angles.') }
    setAnglesLoading(false)
  }, [sessionId, postCount, toast])

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    const filtered = angles.filter(a => selectedAngles.includes(a.id))
    if (!filtered.length) return
    setIsGenerating(true)
    setGenMsgIdx(0)
    const settings: RepurposeSettings = {
      post_count: filtered.length, tone_id: toneId,
      include_carousel: includeCarousel, include_poll: includePoll,
      add_hashtags: addHashtags, add_attribution: addAttribution,
      selected_angles: selectedAngles, niche: profile?.niche ?? 'Other',
    }
    try {
      const res  = await fetch('/api/repurpose/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, angles: filtered, settings }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Generation failed.'); return }
      setGeneratedPosts(data.posts ?? [])
      setCurrentStep(3)
    } catch { toast.error('Generation failed. Please try again.') }
    finally { setIsGenerating(false) }
  }, [angles, selectedAngles, sessionId, toneId, includeCarousel, includePoll,
      addHashtags, addAttribution, profile, toast])

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSavePost = useCallback(async (post: RepurposedPost) => {
    setSavingPostIds(prev => new Set(Array.from(prev).concat(post.angle_id)))
    try {
      const res = await fetch('/api/repurpose/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, posts: [post] }),
      })
      if (res.ok) {
        setGeneratedPosts(prev => prev.map(p => p.angle_id === post.angle_id ? { ...p, saved: true } : p))
        toast.success('Saved to drafts!')
      } else { toast.error('Failed to save post.') }
    } catch { toast.error('Failed to save post.') }
    finally { setSavingPostIds(prev => { const n = new Set(prev); n.delete(post.angle_id); return n }) }
  }, [sessionId, toast])

  const handleSaveAll = useCallback(async () => {
    const res = await fetch('/api/repurpose/save', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, posts: generatedPosts, save_all: true }),
    })
    if (res.ok) {
      setGeneratedPosts(prev => prev.map(p => ({ ...p, saved: true })))
      toast.success(`${generatedPosts.length} posts saved to drafts!`)
    } else { toast.error('Failed to save posts.') }
  }, [sessionId, generatedPosts, toast])

  const handleCopy = useCallback(async (content: string) => {
    await navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard!')
  }, [toast])

  const handleRegenerate = useCallback(async (post: RepurposedPost) => {
    const angle = angles.find(a => a.id === post.angle_id)
    if (!angle) return
    const settings: RepurposeSettings = {
      post_count: 1, tone_id: toneId, include_carousel: includeCarousel,
      include_poll: includePoll, add_hashtags: addHashtags, add_attribution: addAttribution,
      selected_angles: [post.angle_id], niche: profile?.niche ?? 'Other',
    }
    const res = await fetch('/api/repurpose/regenerate-post', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, angle, settings, previous_content: post.content }),
    })
    if (res.ok) {
      const data = await res.json()
      setGeneratedPosts(prev => prev.map(p => p.angle_id === post.angle_id ? { ...data.post, angle_id: post.angle_id, angle_title: post.angle_title } : p))
      toast.success('Post regenerated!')
    } else { toast.error('Regeneration failed.') }
  }, [angles, sessionId, toneId, includeCarousel, includePoll, addHashtags, addAttribution, profile, toast])

  // ── Session history ────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'history') return
    setSessionsLoading(true)
    fetch('/api/repurpose/sessions')
      .then(r => r.ok ? r.json() : { sessions: [] })
      .then(d => setSessions(d.sessions ?? []))
      .catch(() => {})
      .finally(() => setSessionsLoading(false))
  }, [activeTab])

  const handleDeleteSession = useCallback(async (id: string) => {
    const res = await fetch(`/api/repurpose/sessions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setSessions(prev => prev.filter(s => s.id !== id))
      toast.success('Session deleted.')
    } else { toast.error('Failed to delete session.') }
  }, [toast])

  const handleViewPosts = useCallback(async (session: RepurposeSession) => {
    const isOpen = expandedSessions.has(session.id)
    if (isOpen) {
      setExpandedSessions(prev => { const n = new Set(Array.from(prev)); n.delete(session.id); return n })
      return
    }
    if (!sessionPosts[session.id]) {
      const res = await fetch(`/api/repurpose/sessions/${session.id}`)
      if (res.ok) {
        const d = await res.json()
        setSessionPosts(prev => ({ ...prev, [session.id]: (d.posts ?? []).map((p: { content: string }) => p.content) }))
      }
    }
    setExpandedSessions(prev => new Set(Array.from(prev).concat(session.id)))
  }, [expandedSessions, sessionPosts])

  const handleReuseSession = useCallback((s: RepurposeSession) => {
    setSessionId(s.id)
    setExtractedData({
      title: s.source_title ?? '', author: s.source_author ?? '',
      platform: s.source_platform ?? 'website',
      word_count: s.word_count, text_preview: (s.extracted_text ?? '').slice(0, 500),
    })
    setEditableText(s.extracted_text ?? '')
    setActiveTab('repurpose')
    setCurrentStep(2)
    handleAnglesLoad()
  }, [handleAnglesLoad])

  const isLinkedIn     = isLinkedInUrl(urlInput)
  const platformConfig = SOURCE_PLATFORMS[detectedPlatform]
  const wordCount      = textInput.split(/\s+/).filter(Boolean).length

  function isValidUrl(u: string): boolean {
    try {
      const parsed = new URL(u.trim())
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch { return false }
  }

  const urlIsValid     = isValidUrl(urlInput)
  const canExtract     = !isExtracting && (
    pdfFile !== null ||
    (sourceTab === 'url' ? urlIsValid && !isLinkedIn : wordCount >= 50)
  )

  // ── Step 1: Extraction preview ─────────────────────────────────────────────
  const ExtractionPreviewStep = (
    <div className="space-y-4">
      <button type="button" onClick={() => setCurrentStep(0)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
        ← Back
      </button>
      <h2 className="text-base font-bold text-[#0A2540]">Review extracted content</h2>
      <div className="bg-white rounded-2xl border border-[#E5E4E0] p-5 space-y-4">
        <div className="space-y-2">
          <input type="text" value={extractedData?.title ?? ''} placeholder="Source title"
            onChange={e => setExtractedData(d => d ? { ...d, title: e.target.value } : d)}
            className="w-full text-base font-bold text-[#0A2540] border-b border-transparent hover:border-[#E5E4E0] focus:border-[#1D9E75] focus:outline-none pb-0.5 bg-transparent"
          />
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>by</span>
            <input type="text" value={extractedData?.author ?? ''} placeholder="Author"
              onChange={e => setExtractedData(d => d ? { ...d, author: e.target.value } : d)}
              className="flex-1 border-b border-transparent hover:border-[#E5E4E0] focus:border-[#1D9E75] focus:outline-none pb-0.5 bg-transparent"
            />
            <span className="ml-auto text-gray-400">{(extractedData?.word_count ?? 0).toLocaleString()} words</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Content preview</p>
          <div className={cn('bg-gray-50 rounded-xl p-3 text-xs text-gray-600 leading-relaxed overflow-y-auto', showFullText ? 'max-h-72' : 'max-h-40')}>
            {showFullText
              ? <textarea value={editableText} onChange={e => setEditableText(e.target.value)} rows={12}
                  className="w-full bg-transparent resize-none focus:outline-none text-xs leading-relaxed" />
              : <p className="whitespace-pre-wrap">{editableText.slice(0, 500)}{editableText.length > 500 ? '…' : ''}</p>
            }
          </div>
          <button type="button" onClick={() => setShowFullText(v => !v)}
            className="mt-1.5 text-xs font-semibold text-[#1D9E75] hover:underline flex items-center gap-1">
            {showFullText ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Show full content &amp; edit</>}
          </button>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={async () => { await handleAnglesLoad(); setCurrentStep(2) }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#1D9E75] hover:bg-[#178a64] text-white flex items-center justify-center gap-2">
            {anglesLoading ? <><RotateCw className="w-4 h-4 animate-spin" />Loading…</> : 'Looks good, continue →'}
          </button>
          <button type="button" onClick={() => { setCurrentStep(0); setExtractedData(null); setEditableText('') }}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 border border-[#E5E4E0] hover:bg-gray-50">
            Try a different source
          </button>
        </div>
      </div>
    </div>
  )

  // ── Step 2: Configure ──────────────────────────────────────────────────────
  const FMT: Record<string, string> = { text: 'T', carousel: '▤', question: '?', poll: '▦' }
  const POST_COUNTS = [3, 5, 8, 12]
  const ConfigureStep = (
    <div className="space-y-4">
      {isGenerating && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3">
          <RotateCw className="w-8 h-8 text-[#1D9E75] animate-spin" />
          <p className="text-sm font-semibold text-[#0A2540]">{GEN_MSGS[genMsgIdx]}</p>
        </div>
      )}
      <button type="button" onClick={() => setCurrentStep(1)} className="text-xs text-gray-400 hover:text-gray-600">← Back</button>
      <h2 className="text-base font-bold text-[#0A2540]">Configure your posts</h2>
      <div className="bg-white rounded-2xl border border-[#E5E4E0] p-5 space-y-6">
        {/* Post count */}
        <div>
          <p className="text-sm font-semibold text-[#0A2540] mb-3">How many posts?</p>
          <div className="flex gap-2">
            {POST_COUNTS.map(n => {
              const locked = n > limits.posts_per_session
              return (
                <button key={n} type="button" disabled={locked}
                  onClick={() => { if (!locked) setPostCount(n) }}
                  className={cn('relative w-14 h-14 rounded-xl border-2 text-lg font-bold transition-all',
                    postCount === n && !locked ? 'border-[#1D9E75] text-[#1D9E75] bg-[#E1F5EE]/50'
                      : locked ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                      : 'border-[#E5E4E0] text-gray-700 hover:border-[#1D9E75]/40')}>
                  {n}
                  {locked && <Lock className="absolute -top-2 -right-2 w-3 h-3 text-amber-500" />}
                </button>
              )
            })}
          </div>
        </div>
        {/* Angles */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-[#0A2540]">{isGeneric ? 'Post angles' : 'Choose your angles'}</p>
            {!anglesLoading && angles.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-[#1D9E75] font-semibold">
                <button type="button" onClick={() => setSelectedAngles(angles.map(a => a.id))}>Select all</button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={() => setSelectedAngles([])}>Deselect all</button>
              </div>
            )}
          </div>
          {isGeneric && <p className="text-[11px] text-gray-400 mb-2">Upgrade to get AI-detected angles specific to your content</p>}
          {anglesLoading
            ? <div className="grid grid-cols-2 gap-2">{[1,2,3,4].map(i => <div key={i} className="shimmer h-16 rounded-xl" />)}</div>
            : <div className="grid grid-cols-2 gap-2">
                {(isGeneric ? GENERIC_ANGLES_FREE : angles).map(angle => (
                  <button key={angle.id} type="button"
                    onClick={() => setSelectedAngles(prev => prev.includes(angle.id) ? prev.filter(id => id !== angle.id) : [...prev, angle.id])}
                    className={cn('text-left p-3 rounded-xl border-2 transition-all',
                      selectedAngles.includes(angle.id) ? 'border-[#1D9E75] bg-[#E1F5EE]/40' : 'border-[#E5E4E0] hover:border-[#1D9E75]/30')}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{FMT[angle.format] ?? 'T'}</span>
                      <span className="text-xs font-bold text-[#0A2540] leading-tight truncate">{angle.title}</span>
                      {selectedAngles.includes(angle.id) && <Check className="w-3 h-3 text-[#1D9E75] ml-auto flex-shrink-0" />}
                    </div>
                    <p className="text-[10px] text-gray-500 leading-snug">{angle.description}</p>
                  </button>
                ))}
              </div>
          }
        </div>
        {/* Tone */}
        <div>
          <label className="block text-sm font-semibold text-[#0A2540] mb-2">Tone</label>
          <select value={toneId} onChange={e => setToneId(e.target.value)}
            className="w-full px-3 py-2 border border-[#E5E4E0] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]">
            {Object.values(SYSTEM_TONES).map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        {/* Toggles */}
        <div className="space-y-3">
          {([
            ['Include carousel',       includeCarousel, setIncludeCarousel],
            ['Include poll',           includePoll,     setIncludePoll],
            ['Add hashtags',           addHashtags,     setAddHashtags],
            ['Add source attribution', addAttribution,  setAddAttribution],
          ] as [string, boolean, React.Dispatch<React.SetStateAction<boolean>>][]).map(([label, val, set]) => (
            <label key={label} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">{label}</span>
              <button type="button" role="switch" aria-checked={val} onClick={() => set(v => !v)}
                className={cn('relative w-9 h-5 rounded-full transition-all', val ? 'bg-[#1D9E75]' : 'bg-gray-200')}>
                <span className={cn('absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', val && 'translate-x-4')} />
              </button>
            </label>
          ))}
        </div>
        {/* Generate button */}
        <button type="button" onClick={handleGenerate} disabled={selectedAngles.length === 0 || isGenerating}
          className={cn('w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all',
            selectedAngles.length > 0 && !isGenerating ? 'bg-[#1D9E75] hover:bg-[#178a64] text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}>
          Generate {selectedAngles.length} post{selectedAngles.length !== 1 ? 's' : ''} →
        </button>
      </div>
    </div>
  )

  // ── Step 3: Results ────────────────────────────────────────────────────────
  const ResultsStep = (
    <div className="space-y-5">
      <button type="button" onClick={() => setCurrentStep(2)} className="text-xs text-gray-400 hover:text-gray-600">← Back</button>
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          <span className="font-bold text-[#0A2540]">{generatedPosts.length} posts</span>
          {' '}from{' '}
          <span className="font-semibold">{(extractedData?.title ?? 'your source').slice(0, 40)}</span>
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={handleSaveAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1D9E75] hover:bg-[#178a64] text-white text-xs font-bold transition-colors">
            <Bookmark className="w-3.5 h-3.5" />Save all drafts
          </button>
          <button type="button" disabled={addingToBank} onClick={async () => {
            setAddingToBank(true)
            try {
              await Promise.all(generatedPosts.map(p =>
                fetch('/api/planner/content-bank', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title: p.angle_title, topic: p.content.slice(0, 200), source: 'manual' }),
                })
              ))
              toast.success('Added to Content Bank!')
            } catch {
              toast.error('Failed to add to Content Bank')
            } finally {
              setAddingToBank(false)
            }
          }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E4E0] text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {addingToBank ? 'Adding…' : 'Add to Content Bank'}
          </button>
          <button type="button" onClick={() => toast.info('Go to Content Planner to schedule these posts')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E4E0] text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Add to calendar
          </button>
        </div>
      </div>
      {/* Posts grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {generatedPosts.map((post, idx) => (
          <RepurposePostCard key={idx} post={post}
            onSave={p => handleSavePost(p)}
            onCopy={p => handleCopy(p.content)}
            onRegenerate={p => handleRegenerate(p)}
            onAddToCalendar={() => toast.info('Go to Content Planner to schedule')}
            isSaving={savingPostIds.has(post.angle_id)}
            isPaid={plan !== 'free'}
          />
        ))}
      </div>
      <div className="flex justify-center pt-2">
        <button type="button" onClick={() => {
          setCurrentStep(0); setGeneratedPosts([]); setExtractedData(null)
          setEditableText(''); setSessionId(null); setUrlInput(''); setTextInput('')
        }} className="text-xs text-gray-400 hover:text-gray-600 underline">
          Start over
        </button>
      </div>
    </div>
  )

  // ── History tab ────────────────────────────────────────────────────────────
  const isFree = plan === 'free'
  const visibleSessions = isFree ? sessions.slice(0, 1) : sessions

  const HistoryTab = (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#0A2540]">Repurpose history</h2>
      {isFree && sessions.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
          Showing your most recent session.{' '}
          <a href="/settings" className="font-semibold underline">Upgrade</a>
          {' '}to see full history and re-use past sessions.
        </div>
      )}
      {sessionsLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="shimmer h-20 rounded-2xl" />)}</div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#E1F5EE] flex items-center justify-center text-3xl">♻️</div>
          <div>
            <p className="font-bold text-[#0A2540]">No sessions yet</p>
            <p className="text-sm text-gray-400 mt-0.5">Repurpose your first piece of content to see it here</p>
          </div>
          <button type="button" onClick={() => setActiveTab('repurpose')}
            className="px-4 py-2 rounded-xl bg-[#1D9E75] text-white text-sm font-bold hover:bg-[#178a64]">
            Repurpose content →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleSessions.map(session => (
            <div key={session.id} className="bg-white rounded-2xl border border-[#E5E4E0] p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#0A2540] truncate">{session.source_title || 'Untitled'}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {timeAgo(session.created_at)} · {session.word_count.toLocaleString()} words ·{' '}
                    {session.posts_generated} generated · {session.posts_saved} saved
                  </p>
                </div>
                <button type="button" onClick={() => handleDeleteSession(session.id)}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => handleViewPosts(session)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-gray-500 hover:bg-gray-50 border border-[#E5E4E0]">
                  {expandedSessions.has(session.id) ? <><EyeOff className="w-3 h-3" />Hide</> : <><Eye className="w-3 h-3" />View posts</>}
                </button>
                <button type="button" onClick={() => handleReuseSession(session)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#1D9E75] bg-[#E1F5EE] hover:bg-[#1D9E75]/20">
                  Generate more →
                </button>
              </div>
              {expandedSessions.has(session.id) && (
                <div className="space-y-2 pt-1 border-t border-[#E5E4E0]">
                  {(sessionPosts[session.id] ?? []).slice(0, 3).map((content, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 flex items-start justify-between gap-2">
                      <p className="text-xs text-gray-600 leading-relaxed flex-1">{content.slice(0, 100)}…</p>
                      <button type="button" onClick={() => handleCopy(content)}
                        className="text-[10px] text-[#1D9E75] font-semibold flex-shrink-0 hover:underline">Copy</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── Step progress indicator ────────────────────────────────────────────────
  const STEP_LABELS = ['Source', 'Review', 'Configure', 'Results']
  const StepProgressIndicator = (
    <div className="flex items-center w-full mb-6">
      {STEP_LABELS.map((label, idx) => (
        <div key={idx} className="flex items-center flex-1 last:flex-initial">
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
              currentStep > idx  ? 'bg-[#1D9E75] border-[#1D9E75] text-white' :
              currentStep === idx ? 'border-[#1D9E75] text-[#1D9E75] bg-white' :
                                    'border-gray-200 text-gray-400 bg-white',
            )}>
              {currentStep > idx ? <Check className="w-4 h-4" /> : idx + 1}
            </div>
            <span className={cn(
              'text-[11px] mt-1 font-semibold whitespace-nowrap',
              currentStep > idx  ? 'text-gray-500' :
              currentStep === idx ? 'text-[#1D9E75]' : 'text-gray-300',
            )}>
              {label}
            </span>
          </div>
          {idx < STEP_LABELS.length - 1 && (
            <div className={cn(
              'flex-1 h-px mx-2 mb-5 transition-all',
              currentStep > idx ? 'bg-[#1D9E75]' : 'bg-gray-200',
            )} />
          )}
        </div>
      ))}
    </div>
  )

  // ── Source input step (Step 0) ─────────────────────────────────────────────
  const SourceInputStep = (
    <div className="bg-white rounded-2xl border border-[#E5E4E0] p-6 space-y-5">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['url', 'text'] as const).map(tab => (
          <button key={tab} type="button" onClick={() => setSourceTab(tab)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
              sourceTab === tab ? 'bg-white text-[#0A2540] shadow-sm' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {tab === 'url' ? <Link2 className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
            {tab === 'url' ? 'Paste a link' : 'Paste text'}
          </button>
        ))}
      </div>

      {/* URL input */}
      {sourceTab === 'url' && (
        <div className="space-y-3">
          <div className="relative">
            <input type="url" value={urlInput}
              onChange={e => { setUrlInput(e.target.value); setUrlError(null) }}
              placeholder="Paste a URL — blog post, YouTube video, newsletter, Twitter thread, Google Docs..."
              className="w-full h-14 pl-4 pr-36 border border-[#E5E4E0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
            />
            {detectedPlatform !== 'website' && platformConfig && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1D9E75] text-white">
                {platformConfig.label}
              </span>
            )}
          </div>
          {isLinkedIn && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                LinkedIn pages can&apos;t be fetched automatically. Use the{' '}
                <button type="button" className="font-semibold underline" onClick={() => setSourceTab('text')}>
                  Paste text
                </button>{' '}tab.
              </p>
            </div>
          )}
          {urlInput.trim() && !isLinkedIn && !urlIsValid && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />Please enter a valid URL starting with https://
            </p>
          )}
          {urlError && !isLinkedIn && urlIsValid && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />{urlError}
            </p>
          )}
        </div>
      )}

      {/* Text textarea */}
      {sourceTab === 'text' && (
        <div className="space-y-2">
          <textarea value={textInput} onChange={e => setTextInput(e.target.value)} rows={8}
            placeholder="Paste your article, transcript, talk notes, newsletter, or any long-form content..."
            className="w-full px-4 py-3 border border-[#E5E4E0] rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
          />
          <p className="text-xs text-gray-400">
            {wordCount} words
            <span className="ml-2 text-gray-300">· Works best with 300+ words</span>
          </p>
        </div>
      )}

      {/* PDF upload zone */}
      {plan === 'free' ? (
        <div className="flex items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed border-gray-100 bg-gray-50 cursor-not-allowed">
          <Lock className="w-4 h-4 text-gray-300" />
          <span className="text-xs text-gray-400">PDF upload — Starter plan</span>
        </div>
      ) : (
        <div>
          {pdfFile ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#1D9E75]/40 bg-[#E1F5EE]/50">
              <FileText className="w-4 h-4 text-[#1D9E75] flex-shrink-0" />
              <span className="text-xs font-semibold text-[#1D9E75] flex-1 truncate">{pdfFile.name}</span>
              <button type="button" onClick={() => { setPdfFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 w-full h-20 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#1D9E75]/40 hover:bg-gray-50 transition-all text-gray-400 hover:text-[#1D9E75]">
              <Upload className="w-4 h-4" />
              <span className="text-xs">Drag a PDF here or click to upload</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f) }}
          />
        </div>
      )}

      {/* Extract button */}
      <button type="button" onClick={handleExtract} disabled={!canExtract}
        className={cn(
          'w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all',
          canExtract ? 'bg-[#1D9E75] hover:bg-[#178a64] text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed',
        )}
      >
        {isExtracting ? <><RotateCw className="w-4 h-4 animate-spin" />Extracting...</> : 'Extract content →'}
      </button>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2540]">Content Repurposer</h1>
        <p className="text-sm text-gray-500 mt-0.5">Turn one piece of content into multiple LinkedIn posts</p>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['repurpose', 'history'] as const).map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
              activeTab === tab ? 'bg-white text-[#0A2540] shadow-sm' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {tab === 'repurpose' ? 'Repurpose content' : 'Session history'}
          </button>
        ))}
      </div>

      {activeTab === 'repurpose' && (
        <div>
          {StepProgressIndicator}
          {currentStep === 0 && SourceInputStep}
          {currentStep === 1 && ExtractionPreviewStep}
          {currentStep === 2 && ConfigureStep}
          {currentStep === 3 && ResultsStep}
        </div>
      )}
      {activeTab === 'history' && HistoryTab}
    </div>
  )
}
