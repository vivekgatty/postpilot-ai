'use client'

import { useState, useEffect, useCallback } from 'react'
import { PROFILE_GOALS, OPTIMIZER_LIMITS } from '@/lib/profileOptimizerConfig'
import type { ProfileInputData } from '@/types'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'

// ─── Section labels ────────────────────────────────────────────────────────────

const SECTION_LABELS = [
  'Goals & Keywords',
  'Basic Info',
  'Headline',
  'About Section',
  'Current Experience',
  'Previous Roles',
  'Skills',
  'Social Proof',
  'Engagement',
  'Photo & Banner',
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialData?:     Partial<ProfileInputData>
  initialGoal?:     string
  initialAudience?: string
  initialKeywords?: string[]
  auditId?:         string
  onComplete: (
    data:     ProfileInputData,
    goal:     string,
    audience: string,
    keywords: string[],
  ) => void
  isAnalyzing: boolean
}

// ─── Default form data ────────────────────────────────────────────────────────

const DEFAULT_FORM_DATA: ProfileInputData = {
  full_name:                    '',
  current_title:                '',
  current_company:              '',
  location:                     '',
  headline:                     '',
  about:                        '',
  current_role_description:     '',
  previous_roles: [
    { title: '', company: '', description: '' },
    { title: '', company: '', description: '' },
    { title: '', company: '', description: '' },
  ],
  skills:                       [],
  featured_section:             '',
  education:                    '',
  has_profile_photo:            false,
  has_custom_banner:            false,
  banner_description:           '',
  photo_is_headshot:            false,
  photo_background_clean:       false,
  photo_is_recent:              false,
  photo_is_professional:        false,
  posts_per_week:               '',
  has_recent_post_with_engagement: false,
  comments_per_week:            '',
  connections_count:            '',
  has_custom_url:               false,
  has_featured_items:           false,
  featured_items_count:         0,
  has_recommendations:          false,
  recommendations_count:        0,
  skills_with_endorsements:     0,
  has_articles:                 false,
}

// ─── Component ────────────────────────────────────────────────────────────────

// Suppress unused import warning — OPTIMIZER_LIMITS is imported per spec
void OPTIMIZER_LIMITS

export default function ProfileInputForm({
  initialData,
  initialGoal     = '',
  initialAudience = '',
  initialKeywords = ['', '', '', '', ''],
  onComplete,
  isAnalyzing,
}: Props) {
  const [activeSection,   setActiveSection]   = useState(0)
  const [goal,            setGoal]            = useState(initialGoal)
  const [targetAudience,  setTargetAudience]  = useState(initialAudience)
  const [targetKeywords,  setTargetKeywords]  = useState<string[]>(
    initialKeywords.length === 5
      ? initialKeywords
      : ['', '', '', '', ''],
  )
  const [formData, setFormData] = useState<ProfileInputData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
    previous_roles:
      initialData?.previous_roles && initialData.previous_roles.length > 0
        ? initialData.previous_roles
        : DEFAULT_FORM_DATA.previous_roles,
  })

  // ── Auto-save ──────────────────────────────────────────────────────────────

  const saveTimer = useCallback(() => {
    // no-op: timer managed via useEffect below
  }, [])
  void saveTimer

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await fetch('/api/profile-optimizer/save-draft', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            profile_data:     formData,
            goal,
            target_audience:  targetAudience,
            target_keywords:  targetKeywords,
          }),
        })
      } catch {
        // silent — no toast
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [formData, goal, targetAudience, targetKeywords])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const updateKeyword = (index: number, value: string) => {
    setTargetKeywords((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const canProceedFromSection0 =
    goal !== '' && targetKeywords.filter((k) => k.trim()).length >= 3

  // ── Section 0 ─────────────────────────────────────────────────────────────

  const Section0 = (
    <div className="py-6 space-y-8">
      {/* Heading */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Let&rsquo;s personalise your audit
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          These inputs make every recommendation specific to your situation.
        </p>
      </div>

      {/* Goal selector */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-800">
          What is your primary goal on LinkedIn?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROFILE_GOALS.map((g) => {
            const selected = goal === g.id
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setGoal(g.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                style={{
                  border:     selected ? '2px solid #1D9E75' : '2px solid #E5E4E0',
                  background: selected ? '#E1F5EE' : '#FFFFFF',
                }}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 border-2 flex items-center justify-center"
                  style={{
                    borderColor:     selected ? '#1D9E75' : '#C4C4C4',
                    backgroundColor: selected ? '#1D9E75' : 'transparent',
                  }}
                >
                  {selected && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: selected ? '#0F6E56' : '#374151' }}
                >
                  {g.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Target audience */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-800">
          Who is your primary target audience?
        </label>
        <input
          type="text"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          maxLength={200}
          placeholder="E.g. Indian B2B SaaS founders, HR leaders at mid-size companies, MBA graduates looking to switch into consulting"
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-400 text-right">
          {targetAudience.length} / 200
        </p>
      </div>

      {/* Target keywords */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-semibold text-gray-800">
            Your 5 most important LinkedIn keywords
          </label>
          <p className="mt-0.5 text-xs text-gray-500">
            What would your ideal client or recruiter search for to find someone like you?
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3, 4].map((i) => {
            const placeholders = [
              'e.g. SaaS growth',
              'e.g. B2B sales',
              'e.g. product management',
              'e.g. startup founder',
              'e.g. CFO India',
            ]
            return (
              <div key={i} className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">
                  Keyword {i + 1}
                </label>
                <input
                  type="text"
                  value={targetKeywords[i]}
                  onChange={(e) => updateKeyword(i, e.target.value)}
                  maxLength={40}
                  placeholder={placeholders[i]}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-400">
          Examples: SaaS growth, B2B sales, product management, startup founder, CFO India
        </p>
      </div>

      {/* Continue button */}
      <div className="pt-2">
        <button
          type="button"
          disabled={!canProceedFromSection0}
          onClick={() => setActiveSection(1)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: canProceedFromSection0 ? '#1D9E75' : '#E5E4E0',
            color:      canProceedFromSection0 ? '#FFFFFF' : '#9CA3AF',
            cursor:     canProceedFromSection0 ? 'pointer' : 'not-allowed',
          }}
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex gap-0 min-h-screen">

      {/* Section navigator — desktop only */}
      <div className="hidden md:flex flex-col w-48 flex-shrink-0 border-r pr-4 gap-1 pt-2">
        {SECTION_LABELS.map((label, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveSection(i)}
            className="flex items-center gap-2 px-2 py-2 rounded text-left hover:bg-gray-50 transition-colors"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-medium ${
                i < activeSection
                  ? 'bg-teal-600 text-white'
                  : activeSection === i
                  ? 'border-2 border-teal-600 text-teal-600'
                  : 'border-2 border-gray-200 text-gray-400'
              }`}
            >
              {i < activeSection ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span
              className={`text-xs truncate ${
                activeSection === i
                  ? 'text-teal-600 font-medium'
                  : i < activeSection
                  ? 'text-gray-700'
                  : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Mobile progress pills */}
      <div className="flex md:hidden items-center gap-1.5 px-4 pt-4 pb-2 flex-wrap absolute top-0 left-0 right-0">
        {SECTION_LABELS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveSection(i)}
            className="h-1.5 rounded-full transition-all"
            style={{
              width:      activeSection === i ? 24 : 8,
              background: i < activeSection
                ? '#1D9E75'
                : activeSection === i
                ? '#1D9E75'
                : '#E5E4E0',
            }}
          />
        ))}
      </div>

      {/* Main content area */}
      <div className="flex-1 px-4 md:px-8 max-w-2xl">

        {activeSection === 0 && Section0}

        {activeSection === 1 && (
          <div className="py-4 text-gray-400 text-sm">
            Section 1 — built in next prompt
          </div>
        )}

        {activeSection === 2 && (
          <div className="py-4 text-gray-400 text-sm">
            Section 2 — built in next prompt
          </div>
        )}

        {activeSection === 3 && (
          <div className="py-4 text-gray-400 text-sm">
            Section 3 — built in next prompt
          </div>
        )}

        {activeSection === 4 && (
          <div className="py-4 text-gray-400 text-sm">
            Section 4 — built in next prompt
          </div>
        )}

        {activeSection === 5 && (
          <div className="py-4 text-gray-400 text-sm">
            Section 5 — built in next prompt
          </div>
        )}

        {activeSection === 6 && (
          <div className="py-4 text-gray-400 text-sm">
            Section 6 — built in next prompt
          </div>
        )}

        {activeSection === 7 && (
          <div className="py-4 text-gray-400 text-sm">
            Section 7 — built in next prompt
          </div>
        )}

        {activeSection === 8 && (
          <div className="py-4 text-gray-400 text-sm">
            Section 8 — built in next prompt
          </div>
        )}

        {activeSection === 9 && (
          <div className="py-4 text-gray-400 text-sm">
            Section 9 — built in next prompt
          </div>
        )}

        {activeSection === 10 && (
          <div className="py-4 text-gray-400 text-sm">
            Final CTA — built in next prompt
          </div>
        )}

      </div>
    </div>
  )
}
