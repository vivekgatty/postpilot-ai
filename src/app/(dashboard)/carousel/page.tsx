'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser }  from '@/hooks/useUser'
import { useToast } from '@/components/ui/Toast'
import CarouselSlidePreview from '@/components/features/CarouselSlidePreview'
import CarouselEditor       from '@/components/features/CarouselEditor'
import {
  CAROUSEL_TYPES, CAROUSEL_THEMES, CAROUSEL_LIMITS,
  FONT_STYLES, ASPECT_RATIOS, getThemeById,
  getTypesForPlan,
} from '@/lib/carouselConfig'
import { SYSTEM_TONES, NICHE_OPTIONS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  Sparkles, Palette, Download, Plus,
  ChevronLeft, ChevronRight, RefreshCw, Copy,
  Save, ExternalLink, Lock, Check, LayoutTemplate,
} from 'lucide-react'
import type { CarouselSlide, CarouselData, CarouselConfig, AuthorBranding } from '@/types'

// Silence unused-import warnings for required-but-not-called-directly items
void (useRef as unknown)
void (ChevronLeft as unknown)
void (ChevronRight as unknown)
void (Copy as unknown)
void (Save as unknown)
void (ExternalLink as unknown)
void (Plus as unknown)
void (LayoutTemplate as unknown)
void (FONT_STYLES as unknown)
void (ASPECT_RATIOS as unknown)
void (CarouselEditor as unknown)
void (CAROUSEL_THEMES as unknown)

// ── Plan helpers ──────────────────────────────────────────────────────────────

const PLAN_ORDER = ['free', 'starter', 'pro', 'agency'] as const

// ── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  const STEPS = ['Topic', 'Generate', 'Edit & Export']
  return (
    <div className="flex items-center w-full mb-6">
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1
        const completed = currentStep > stepNum
        const active    = currentStep === stepNum
        return (
          <div key={idx} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                completed ? 'bg-[#1D9E75] border-[#1D9E75] text-white' :
                active    ? 'border-[#1D9E75] text-[#1D9E75] bg-white' :
                            'border-gray-200 text-gray-400 bg-white',
              )}>
                {completed ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span className={cn(
                'text-[11px] mt-1 font-semibold whitespace-nowrap',
                completed ? 'text-gray-500' :
                active    ? 'text-[#1D9E75]' :
                            'text-gray-400',
              )}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-px mx-2 mb-5 transition-all',
                currentStep > stepNum ? 'bg-[#1D9E75]' : 'bg-gray-200',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Upgrade Modal ─────────────────────────────────────────────────────────────

function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-[400px] flex flex-col items-center gap-4 shadow-2xl">
        <div className="w-10 h-10 bg-[#E1F5EE] rounded-full flex items-center justify-center">
          <Download className="w-5 h-5 text-[#1D9E75]" />
        </div>
        <h2 className="text-lg font-bold text-[#0A2540] text-center">Export as PDF</h2>
        <p className="text-sm text-gray-500 text-center leading-relaxed">
          Download your carousel as a PDF and upload directly to LinkedIn.
          Available on Starter plan and above.
        </p>
        <a
          href="/dashboard/settings"
          className="w-full py-2.5 rounded-xl bg-[#1D9E75] hover:bg-[#178a64] text-white text-sm font-bold text-center transition-colors"
        >
          Upgrade to Starter
        </a>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CarouselPage() {
  const { user, profile } = useUser()
  const { toast }         = useToast()
  const router            = useRouter()
  const searchParams      = useSearchParams()

  // Suppress unused variable warnings for items used only in future steps
  void user
  void router

  // ── State ─────────────────────────────────────────────────────────────────

  const [activeTab,     setActiveTab]     = useState<'create' | 'history'>('create')
  const [currentStep,   setCurrentStep]   = useState<0 | 1 | 2 | 3>(0)
  const [topic,         setTopic]         = useState('')
  const [selectedType,  setSelectedType]  = useState('how_to_guide')
  const [selectedTheme, setSelectedTheme] = useState('clean_minimal')
  const [slideCount,    setSlideCount]    = useState(6)
  const [toneId,        setToneId]        = useState('professional')
  const [aspectRatio,   setAspectRatio]   = useState<'square' | 'portrait'>('square')
  const [showSlideNumbers,  setShowSlideNumbers]  = useState(true)
  const [showAuthorHandle,  setShowAuthorHandle]  = useState(true)
  const [showBranding,      setShowBranding]      = useState(true)
  const [fontStyle,         setFontStyle]         = useState<'professional' | 'modern' | 'bold'>('professional')
  const [accentColor,       setAccentColor]       = useState<string | undefined>(undefined)
  const [carouselId,        setCarouselId]        = useState<string | null>(null)
  const [slides,            setSlides]            = useState<CarouselSlide[]>([])
  const [carouselTitle,     setCarouselTitle]     = useState('')
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0)
  const [isGenerating,      setIsGenerating]      = useState(false)
  const [isExporting,       setIsExporting]       = useState(false)
  const [exportProgress,    setExportProgress]    = useState(0)
  const [isRegenerating,    setIsRegenerating]    = useState<Record<string, boolean>>({})
  const [savedCarousels,    setSavedCarousels]    = useState<CarouselData[]>([])
  const [historyLoading,    setHistoryLoading]    = useState(false)
  const [showUpgradeModal,  setShowUpgradeModal]  = useState(false)
  const [generatingMessage, setGeneratingMessage] = useState('')
  const [niche,             setNiche]             = useState('Other')

  // Suppress warnings for state setters used only in future steps
  void setAccentColor
  void setSelectedSlideIndex
  void setIsExporting
  void setExportProgress
  void selectedSlideIndex
  void isExporting
  void exportProgress
  void accentColor

  // ── Sync niche from profile ───────────────────────────────────────────────

  useEffect(() => {
    if (profile?.niche) setNiche(profile.niche)
  }, [profile?.niche])

  // ── URL params on mount ───────────────────────────────────────────────────

  useEffect(() => {
    const t = searchParams.get('topic')
    const ty = searchParams.get('type')
    const s  = searchParams.get('step')
    if (t)        setTopic(t)
    if (ty)       setSelectedType(ty)
    if (s === '1') setCurrentStep(1)
  }, [searchParams])

  // ── Plan helpers ──────────────────────────────────────────────────────────

  const plan      = (profile?.plan ?? 'free') as keyof typeof CAROUSEL_LIMITS
  const planIndex = PLAN_ORDER.indexOf(plan)

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleGenerateCarousel() {
    setIsGenerating(true)
    setCurrentStep(2)

    const messages = [
      'Planning your carousel structure...',
      'Writing your slide content...',
      'Crafting the perfect hook...',
      'Building your CTA...',
      'Almost done...',
    ]
    let msgIdx = 0
    setGeneratingMessage(messages[0])
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length
      setGeneratingMessage(messages[msgIdx])
    }, 2000)

    try {
      const res = await fetch('/api/carousel/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          carousel_type:      selectedType,
          theme_id:           selectedTheme,
          slide_count:        slideCount,
          tone_id:            toneId,
          niche:              niche,
          aspect_ratio:       aspectRatio,
          show_slide_numbers: showSlideNumbers,
          show_author_handle: showAuthorHandle,
          show_branding:      showBranding,
          font_style:         fontStyle,
        } satisfies Partial<CarouselConfig>),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'PLAN_REQUIRED') {
          toast.info(`This carousel type requires ${data.required_plan} plan`)
        } else if (data.error === 'MONTHLY_LIMIT') {
          toast.error(data.message)
        } else {
          toast.error('Generation failed. Try again.')
        }
        setCurrentStep(1)
      } else {
        setSlides(data.slides)
        setCarouselTitle(data.title)
        setCarouselId(data.carousel_id)
        setCurrentStep(3)
      }
    } catch {
      toast.error('Generation failed. Try again.')
      setCurrentStep(1)
    } finally {
      clearInterval(interval)
      setIsGenerating(false)
    }
  }

  async function handleUpdateCarousel(updates: Partial<CarouselData>) {
    if (updates.slides)                              setSlides(updates.slides)
    if (updates.theme_id)                           setSelectedTheme(updates.theme_id)
    if (updates.accent_color !== undefined)         setAccentColor(updates.accent_color)
    if (updates.show_slide_numbers !== undefined)   setShowSlideNumbers(updates.show_slide_numbers)
    if (updates.show_author_handle !== undefined)   setShowAuthorHandle(updates.show_author_handle)
    if (updates.show_branding !== undefined)        setShowBranding(updates.show_branding)
    if (updates.font_style)                         setFontStyle(updates.font_style as 'professional' | 'modern' | 'bold')

    if (carouselId) {
      fetch(`/api/carousel/${carouselId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(updates),
      }).catch(() => { /* fire and forget */ })
    }
  }

  async function handleRegenerateSlide(slideId: string) {
    setIsRegenerating(prev => ({ ...prev, [slideId]: true }))
    try {
      const res = await fetch('/api/carousel/regenerate-slide', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carousel_id: carouselId,
          slide_id:    slideId,
          topic,
          niche:   profile?.niche ?? 'Other',
          tone_id: toneId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSlides(prev => prev.map(s => s.id === slideId ? data.slide : s))
      toast.success('Slide regenerated')
    } catch {
      toast.error('Could not regenerate slide')
    } finally {
      setIsRegenerating(prev => ({ ...prev, [slideId]: false }))
    }
  }

  async function handleExportPdf() {
    if (!CAROUSEL_LIMITS[plan].pdf_export) {
      setShowUpgradeModal(true)
      return
    }
    setIsExporting(true)
    setExportProgress(0)
    try {
      const { exportCarouselToPdf } = await import('@/lib/carouselExport')
      const theme        = getThemeById(selectedTheme)
      const carouselData: CarouselData = {
        id:                 carouselId ?? undefined,
        title:              carouselTitle,
        topic,
        carousel_type:      selectedType,
        theme_id:           selectedTheme,
        aspect_ratio:       aspectRatio,
        accent_color:       accentColor,
        show_slide_numbers: showSlideNumbers,
        show_author_handle: showAuthorHandle,
        show_branding:      showBranding,
        font_style:         fontStyle,
        slides,
        status:             'draft',
        niche:              profile?.niche,
        tone_id:            toneId,
      }
      const blob = await exportCarouselToPdf(
        carouselData,
        theme,
        (current) => setExportProgress(current),
      )
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href     = url
      a.download = carouselTitle.replace(/\s+/g, '-').toLowerCase() + '.pdf'
      a.click()
      URL.revokeObjectURL(url)
      if (carouselId) {
        await fetch(`/api/carousel/${carouselId}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ status: 'exported' }),
        })
      }
      toast.success('Your carousel PDF is ready!')
    } catch {
      toast.error('Export failed. Please try again.')
    }
    setIsExporting(false)
  }

  function handleCopyAllText() {
    const text = slides.map(s =>
      `--- Slide ${s.slide_number} (${s.type}) ---\n${s.heading}\n${s.body}${s.sub_line ? `\n${s.sub_line}` : ''}\n`
    ).join('\n')
    navigator.clipboard.writeText(text)
    toast.success('All slide text copied to clipboard')
  }

  async function handleSaveDraft() {
    if (carouselId) {
      toast.success('Carousel is already saved')
      return
    }
    toast.success('Carousel saved as draft')
  }

  const handleLoadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res  = await fetch('/api/carousel/list')
      const data = await res.json()
      setSavedCarousels(data.carousels ?? [])
    } catch {
      toast.error('Could not load carousels')
    } finally {
      setHistoryLoading(false)
    }
  }, [toast])

  // Suppress handlers used only in future steps
  void handleExportPdf
  void handleCopyAllText
  void handleSaveDraft
  void savedCarousels
  void historyLoading
  void handleUpdateCarousel
  void isRegenerating
  void CarouselEditor

  // ── Author branding (derived) ─────────────────────────────────────────────

  let handle = ''
  if (profile?.linkedin_url?.includes('/in/')) {
    const after = profile.linkedin_url.split('/in/')[1] ?? ''
    handle = after.replace(/\/$/, '').split('/')[0] ?? ''
  }
  if (!handle) {
    handle = (profile?.email ?? '').split('@')[0] ?? 'author'
  }
  const authorBranding: AuthorBranding = {
    full_name: profile?.full_name ?? 'Author',
    handle,
    avatar_url: profile?.avatar_url ?? undefined,
    niche:      profile?.niche ?? undefined,
  }

  // ── Step 0 ────────────────────────────────────────────────────────────────

  const Step0 = (
    <div className="max-w-2xl mx-auto space-y-10 py-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-[#0A2540]" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Carousel Creator
        </h1>
        <p className="text-gray-500 text-base">
          Turn any idea into a swipeable LinkedIn carousel in under 5 minutes
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: <Sparkles className="w-5 h-5 text-[#1D9E75]" />, label: 'AI writes all slides' },
          { icon: <Palette   className="w-5 h-5 text-[#1D9E75]" />, label: '20 stunning themes'  },
          { icon: <Download  className="w-5 h-5 text-[#1D9E75]" />, label: 'Export as PDF'       },
        ].map((f, i) => (
          <div key={i} className="bg-white border border-[#E5E4E0] rounded-xl p-4 flex flex-col items-center gap-2 text-center">
            {f.icon}
            <span className="text-sm font-semibold text-[#0A2540]">{f.label}</span>
          </div>
        ))}
      </div>

      {/* Sample previews */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <CarouselSlidePreview
          slide={{ id: 's1', slide_number: 1, type: 'title', heading: '5 lessons from building my startup', body: '', sub_line: 'Swipe to read' }}
          theme={getThemeById('navy_authority')}
          aspectRatio="square"
          scale={0.3}
        />
        <CarouselSlidePreview
          slide={{ id: 's2', slide_number: 1, type: 'title', heading: '5 lessons from building my startup', body: '', sub_line: 'Swipe to read' }}
          theme={getThemeById('rose_gold_luxury')}
          aspectRatio="square"
          scale={0.3}
        />
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setCurrentStep(1)}
          className="w-full py-3.5 rounded-xl bg-[#1D9E75] hover:bg-[#178a64] text-white font-bold text-base transition-colors"
        >
          Create my carousel
        </button>
        <button
          onClick={() => { setActiveTab('history'); handleLoadHistory() }}
          className="w-full py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          View my carousels
        </button>
      </div>
    </div>
  )

  // ── Step 1 ────────────────────────────────────────────────────────────────

  const allTypes    = CAROUSEL_TYPES
  const availableTypes = getTypesForPlan(plan)
  void availableTypes

  const Step1 = (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => setCurrentStep(0)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#0A2540] transition-colors"
      >
        ← Back
      </button>

      <div>
        <h2 className="text-xl font-bold text-[#0A2540]">What is your carousel about?</h2>
      </div>

      {/* Topic textarea */}
      <div className="space-y-1.5">
        <textarea
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="E.g. 5 mistakes I made in my first year as a founder, or: The exact process I use to close enterprise clients in India"
          maxLength={200}
          rows={5}
          className="w-full border border-[#E5E4E0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] resize-none"
        />
        <p className="text-xs text-gray-400 text-right">{topic.length} / 200 chars</p>
      </div>

      {/* Carousel type */}
      <div className="space-y-2">
        <h3 className="text-base font-bold text-[#0A2540]">Choose your carousel type</h3>
        <p className="text-sm text-gray-500">Select the structure that best fits your content</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {allTypes.map(type => {
          const typeRank = PLAN_ORDER.indexOf(type.plan_required as typeof PLAN_ORDER[number])
          const isLocked = typeRank > planIndex
          const isSelected = selectedType === type.id && !isLocked

          return (
            <div
              key={type.id}
              onClick={() => {
                if (isLocked) {
                  toast.info(`This type requires ${type.plan_required} plan`)
                } else {
                  setSelectedType(type.id)
                }
              }}
              className={cn(
                'relative border rounded-lg p-3 cursor-pointer transition-all',
                isLocked   ? 'opacity-60' : 'hover:border-[#1D9E75]/50',
                isSelected ? 'border-2 border-[#1D9E75] bg-[#E1F5EE]' : 'border-[#E5E4E0] bg-white',
              )}
            >
              <div className="space-y-1">
                <p className="text-[13px] font-bold text-[#0A2540]">{type.label}</p>
                <p className="text-[11px] text-gray-500 leading-snug">{type.description}</p>
                <p className="text-[10px] text-gray-400">{type.best_for}</p>
              </div>

              {isLocked && (
                <div className="absolute inset-0 rounded-lg flex items-center justify-center gap-1.5 bg-white/60">
                  <Lock className="w-3 h-3 text-gray-500" />
                  <span className="text-[10px] font-bold text-gray-600 capitalize">{type.plan_required}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Settings row */}
      <div className="space-y-5 bg-white border border-[#E5E4E0] rounded-xl p-5">

        {/* Slide count */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">Number of slides</p>
          <div className="flex flex-wrap gap-2">
            {[4, 5, 6, 7, 8, 9, 10].map(n => {
              const maxSlides      = CAROUSEL_LIMITS[plan].max_slides
              const isCountLocked  = n > maxSlides
              const isSelected     = slideCount === n

              return (
                <button
                  key={n}
                  onClick={() => {
                    if (isCountLocked) {
                      toast.info(`Upgrade your plan to create carousels with ${n} slides`)
                    } else {
                      setSlideCount(n)
                    }
                  }}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all',
                    isCountLocked ? 'border-gray-200 text-gray-400 cursor-not-allowed' :
                    isSelected    ? 'bg-[#1D9E75] text-white border-[#1D9E75]' :
                                    'border-gray-200 text-gray-600 hover:border-[#1D9E75]/50',
                  )}
                >
                  {isCountLocked && <Lock className="w-3 h-3" />}
                  {n}
                </button>
              )
            })}
          </div>
        </div>

        {/* Aspect ratio */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">Slide format</p>
          <div className="flex gap-3">
            {/* Square */}
            <div
              onClick={() => setAspectRatio('square')}
              className={cn(
                'relative flex-1 border rounded-lg p-3 cursor-pointer flex items-center gap-3 transition-all',
                aspectRatio === 'square' ? 'border-2 border-[#1D9E75]' : 'border-[#E5E4E0] hover:border-[#1D9E75]/50',
              )}
            >
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              <div>
                <p className="text-sm font-bold text-[#0A2540]">Square 1:1</p>
                <p className="text-[11px] text-gray-500">Safe for all feeds</p>
              </div>
            </div>

            {/* Portrait */}
            <div
              onClick={() => {
                if (plan === 'free') {
                  toast.info('Portrait format is available on Starter plan and above')
                } else {
                  setAspectRatio('portrait')
                }
              }}
              className={cn(
                'relative flex-1 border rounded-lg p-3 cursor-pointer flex items-center gap-3 transition-all',
                plan === 'free' ? 'opacity-60' : '',
                aspectRatio === 'portrait' && plan !== 'free'
                  ? 'border-2 border-[#1D9E75]'
                  : 'border-[#E5E4E0] hover:border-[#1D9E75]/50',
              )}
            >
              <svg viewBox="0 0 24 32" className="w-6 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <rect x="1" y="1" width="22" height="30" rx="2" />
              </svg>
              <div>
                <p className="text-sm font-bold text-[#0A2540]">Portrait 4:5</p>
                <p className="text-[11px] text-gray-500">More text space</p>
              </div>
              {plan === 'free' && (
                <div className="absolute inset-0 rounded-lg flex items-center justify-center gap-1 bg-white/60">
                  <Lock className="w-3 h-3 text-gray-500" />
                  <span className="text-[10px] font-bold text-gray-600">Starter plan</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tone */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">Writing tone</p>
          <select
            value={toneId}
            onChange={e => setToneId(e.target.value)}
            className="w-full border border-[#E5E4E0] rounded-lg px-3 py-2 text-sm text-[#0A2540] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
          >
            {Object.values(SYSTEM_TONES).map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Niche */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">Your niche</p>
          <select
            value={niche}
            onChange={e => setNiche(e.target.value)}
            className="w-full border border-[#E5E4E0] rounded-lg px-3 py-2 text-sm text-[#0A2540] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
          >
            {NICHE_OPTIONS.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerateCarousel}
        disabled={topic.length < 10 || isGenerating}
        className={cn(
          'w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all',
          topic.length >= 10 && !isGenerating
            ? 'bg-[#1D9E75] hover:bg-[#178a64] text-white'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed',
        )}
      >
        {isGenerating ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            {generatingMessage}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate carousel
          </>
        )}
      </button>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-[#0A2540]">Carousel Creator</h1>
        <p className="text-sm text-gray-500 mt-0.5">Build swipeable LinkedIn carousels with AI</p>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['create', 'history'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab)
              if (tab === 'history') handleLoadHistory()
            }}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
              activeTab === tab ? 'bg-white text-[#0A2540] shadow-sm' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {tab === 'create' ? 'Create carousel' : 'My carousels'}
          </button>
        ))}
      </div>

      {/* Create tab */}
      {activeTab === 'create' && (
        <div className="flex-1">
          {currentStep > 0 && <StepIndicator currentStep={currentStep} />}
          {currentStep === 0 && Step0}
          {currentStep === 1 && Step1}
          {currentStep === 2 && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-8 h-8 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">{generatingMessage}</p>
            </div>
          )}
          {currentStep === 3 && (
            <div className="p-4 text-center text-gray-400" data-carousel-id={carouselId ?? ''}>
              {/* Step 3 editor — built in next prompt */}
              {/* authorBranding and handleRegenerateSlide wired up in next prompt */}
              {typeof authorBranding === 'object' && typeof handleRegenerateSlide === 'function' && null}
              Step 3 editor — built in next prompt
            </div>
          )}
        </div>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div className="p-4 text-center text-gray-400">
          History — built in next prompt
        </div>
      )}

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    </div>
  )
}

// Satisfy TypeScript for authorBranding which will be used in step 3
export type { AuthorBranding }
