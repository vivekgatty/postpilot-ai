'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser }  from '@/hooks/useUser'
import { useToast } from '@/components/ui/Toast'
import { cn }       from '@/lib/utils'
import { Link2, FileText, AlertTriangle, RotateCw } from 'lucide-react'
import {
  detectPlatform, isLinkedInUrl, SOURCE_PLATFORMS, REPURPOSE_LIMITS, GENERIC_ANGLES_FREE,
} from '@/lib/repurposeConfig'
import type { RepurposeAngle, RepurposedPost, RepurposeSession } from '@/types'

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
  const [sessions,        setSessions]        = useState<RepurposeSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  // ── Detect platform on URL change ──────────────────────────────────────────
  useEffect(() => {
    setDetectedPlatform(urlInput.trim() ? detectPlatform(urlInput) : 'website')
  }, [urlInput])

  // ── Extract ────────────────────────────────────────────────────────────────
  const handleExtract = useCallback(async () => {
    setIsExtracting(true)
    setUrlError(null)
    try {
      const body = sourceTab === 'url' ? { url: urlInput.trim() } : { text: textInput.trim() }
      const res  = await fetch('/api/repurpose/extract', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
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
  }, [sourceTab, urlInput, textInput, toast])

  const isLinkedIn     = isLinkedInUrl(urlInput)
  const platformConfig = SOURCE_PLATFORMS[detectedPlatform]
  const wordCount      = textInput.split(/\s+/).filter(Boolean).length
  const canExtract     = !isExtracting && (
    sourceTab === 'url' ? urlInput.trim().length >= 10 && !isLinkedIn : wordCount >= 50
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
          {urlError && !isLinkedIn && (
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
          {currentStep === 0 && SourceInputStep}
          {currentStep === 1 && <span>Step 1 placeholder</span>}
          {currentStep === 2 && <span>Step 2 placeholder</span>}
          {currentStep === 3 && <span>Step 3 placeholder</span>}
        </div>
      )}
      {activeTab === 'history' && <span>History placeholder</span>}
    </div>
  )
}
