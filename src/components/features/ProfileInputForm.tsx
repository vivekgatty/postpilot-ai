'use client'

import { useState, useEffect } from 'react'
import { PROFILE_GOALS, OPTIMIZER_LIMITS } from '@/lib/profileOptimizerConfig'
import type { ProfileInputData } from '@/types'
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Check, Linkedin } from 'lucide-react'

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
  onComplete: _onComplete,
  isAnalyzing: _isAnalyzing,
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

  const [expandedPrevRoles, setExpandedPrevRoles] = useState<number[]>([0])

  // ── Auto-save ──────────────────────────────────────────────────────────────

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

  const updateFormField = (patch: Partial<ProfileInputData>) =>
    setFormData((prev) => ({ ...prev, ...patch }))

  // ── Reusable sub-components (closures over state) ──────────────────────────

  const SectionHeader = ({
    number, title, whyItMatters, linkedinGuide,
  }: { number: number; title: string; whyItMatters: string; linkedinGuide?: string }) => (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-1">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: '#1D9E75' }}
        >
          {number}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      <p className="text-xs italic text-gray-400 mt-1 ml-11">{whyItMatters}</p>
      {linkedinGuide && (
        <p className="flex items-center gap-1 text-gray-400 mt-0.5 ml-11" style={{ fontSize: 11 }}>
          <Linkedin className="w-3 h-3 flex-shrink-0" />
          {linkedinGuide}
        </p>
      )}
    </div>
  )

  const NavButtons = ({
    onBack, onNext, nextDisabled = false, nextLabel,
  }: { onBack?: () => void; onNext: () => void; nextDisabled?: boolean; nextLabel?: string }) => (
    <div className="flex items-center gap-3 pt-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      )}
      <button
        type="button"
        disabled={nextDisabled}
        onClick={onNext}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: nextDisabled ? '#E5E4E0' : '#1D9E75',
          color:      nextDisabled ? '#9CA3AF' : '#FFFFFF',
          cursor:     nextDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        {nextLabel ?? 'Continue'}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )

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
          <div className="py-6 space-y-6">
            <SectionHeader
              number={1}
              title="Basic Info"
              whyItMatters="Used throughout your audit to personalise every recommendation."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Full name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => updateFormField({ full_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Current job title</label>
                <input
                  type="text"
                  value={formData.current_title}
                  onChange={(e) => updateFormField({ current_title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Current company</label>
                <input
                  type="text"
                  value={formData.current_company}
                  onChange={(e) => updateFormField({ current_company: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateFormField({ location: e.target.value })}
                  placeholder="City, Country — e.g. Mumbai, India"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <NavButtons
              onBack={() => setActiveSection(0)}
              onNext={() => setActiveSection(2)}
              nextDisabled={formData.full_name.trim() === '' || formData.current_title.trim() === ''}
            />
          </div>
        )}

        {activeSection === 2 && (
          <div className="py-6 space-y-6">
            <SectionHeader
              number={2}
              title="LinkedIn Headline"
              whyItMatters="Your headline appears next to your name in every search result, comment, and connection request on LinkedIn."
              linkedinGuide="Found on your profile below your name"
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Paste your current LinkedIn headline
              </label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => updateFormField({ headline: e.target.value })}
                maxLength={220}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <p
                className="text-xs font-medium"
                style={{
                  color: formData.headline.length >= 100
                    ? '#1D9E75'
                    : formData.headline.length >= 60
                    ? '#BA7517'
                    : '#E24B4A',
                }}
              >
                {formData.headline.length} / 220 characters
              </p>
            </div>
            <details className="rounded-lg border border-gray-100 bg-gray-50">
              <summary className="px-4 py-3 text-xs font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700">
                See example of a strong headline ↓
              </summary>
              <div className="px-4 pb-4 pt-1">
                <p className="text-xs text-gray-500 italic">
                  &ldquo;I help B2B SaaS founders in India build outbound pipelines that close | Founder at TechCo | Ex-Razorpay | 50+ clients served&rdquo;
                </p>
              </div>
            </details>
            <NavButtons
              onBack={() => setActiveSection(1)}
              onNext={() => setActiveSection(3)}
              nextDisabled={formData.headline.trim().length < 10}
            />
          </div>
        )}

        {activeSection === 3 && (
          <div className="py-6 space-y-6">
            <SectionHeader
              number={3}
              title="About Section"
              whyItMatters="The About section is LinkedIn's most heavily indexed field for search keywords after the headline."
              linkedinGuide="Edit profile → About section"
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Paste your current About section
              </label>
              <textarea
                value={formData.about}
                onChange={(e) => updateFormField({ about: e.target.value })}
                maxLength={2600}
                rows={10}
                placeholder={"Paste your About section here — or leave blank if you don't have one yet"}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
              />
              <p
                className="text-xs font-medium"
                style={{
                  color: formData.about.length >= 1500
                    ? '#1D9E75'
                    : formData.about.length >= 500
                    ? '#BA7517'
                    : '#E24B4A',
                }}
              >
                {formData.about.length} / 2600 characters
              </p>
            </div>
            <div
              className="flex gap-2 px-4 py-3 rounded-lg text-sm"
              style={{ background: '#FFFBEB', borderLeft: '3px solid #BA7517' }}
            >
              <span className="text-base flex-shrink-0">💡</span>
              <p className="text-xs text-amber-800">
                First 3 lines visible before &lsquo;see more&rsquo; — make them your strongest hook
              </p>
            </div>
            <NavButtons
              onBack={() => setActiveSection(2)}
              onNext={() => setActiveSection(4)}
            />
          </div>
        )}

        {activeSection === 4 && (
          <div className="py-6 space-y-6">
            <SectionHeader
              number={4}
              title="Current Role"
              whyItMatters="Achievement-focused experience descriptions dramatically improve LinkedIn search ranking and profile authority."
              linkedinGuide="Edit profile → Experience section"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Job title</label>
                <input
                  type="text"
                  value={formData.current_title}
                  onChange={(e) => updateFormField({ current_title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input
                  type="text"
                  value={formData.current_company}
                  onChange={(e) => updateFormField({ current_company: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Your current role description on LinkedIn
                </label>
                <p className="text-xs text-gray-400 mt-0.5">
                  The text in your Experience section for your current job — not your job description from HR
                </p>
              </div>
              <textarea
                value={formData.current_role_description}
                onChange={(e) => updateFormField({ current_role_description: e.target.value })}
                rows={8}
                placeholder={"Paste your current role description here. Aim for 200+ words with specific outcomes."}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
              />
              <p
                className="text-xs font-medium"
                style={{
                  color: formData.current_role_description.length >= 1000
                    ? '#1D9E75'
                    : formData.current_role_description.length >= 100
                    ? '#BA7517'
                    : '#E24B4A',
                }}
              >
                {formData.current_role_description.length} characters
              </p>
            </div>
            <NavButtons
              onBack={() => setActiveSection(3)}
              onNext={() => setActiveSection(5)}
            />
          </div>
        )}

        {activeSection === 5 && (
          <div className="py-6 space-y-6">
            <SectionHeader
              number={5}
              title="Previous Roles"
              whyItMatters="Previous experience descriptions add depth to your keyword profile and signal career progression."
              linkedinGuide="Edit profile → Experience section (previous positions)"
            />
            <div className="space-y-3">
              {[0, 1, 2].map((i) => {
                const role     = formData.previous_roles[i]
                const expanded = expandedPrevRoles.includes(i)
                const toggle   = () =>
                  setExpandedPrevRoles((prev) =>
                    prev.includes(i) ? prev.filter((n) => n !== i) : [...prev, i],
                  )
                const updateRole = (patch: Partial<{ title: string; company: string; description: string }>) => {
                  const roles = [...formData.previous_roles]
                  roles[i] = { ...roles[i], ...patch }
                  setFormData((prev) => ({ ...prev, previous_roles: roles }))
                }
                return (
                  <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={toggle}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span>
                        Previous Role {i + 1}
                        {role.company && (
                          <span className="ml-2 text-gray-400 font-normal">— {role.company}</span>
                        )}
                      </span>
                      {expanded
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {expanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-600">Job title</label>
                            <input
                              type="text"
                              value={role.title}
                              onChange={(e) => updateRole({ title: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-600">Company</label>
                            <input
                              type="text"
                              value={role.company}
                              onChange={(e) => updateRole({ company: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-600">Role description</label>
                          <textarea
                            value={role.description}
                            onChange={(e) => updateRole({ description: e.target.value })}
                            rows={5}
                            placeholder="Describe your achievements and impact in this role"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
                          />
                          <p className="text-xs text-gray-400 text-right">
                            {role.description.length} chars
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <NavButtons
              onBack={() => setActiveSection(4)}
              onNext={() => setActiveSection(6)}
            />
          </div>
        )}

        {activeSection === 6 && (
          <div className="py-6 space-y-6">
            <SectionHeader
              number={6}
              title="Skills"
              whyItMatters="Skills are a primary LinkedIn search filter. Keywords in your skills section get boosted in search results."
              linkedinGuide="Edit profile → Skills section"
            />
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Your current LinkedIn skills
                </label>
                <p className="text-xs text-gray-400 mt-0.5">One skill per line, or comma-separated</p>
              </div>
              <textarea
                value={formData.skills.join('\n')}
                onChange={(e) => {
                  const parsed = e.target.value
                    .split(/[\n,]/)
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0)
                  setFormData((prev) => ({ ...prev, skills: parsed }))
                }}
                rows={5}
                placeholder={"e.g. SaaS Sales\nB2B Marketing\nProduct Strategy"}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
              />
              <p
                className="text-xs font-medium"
                style={{
                  color: formData.skills.length >= 15
                    ? '#1D9E75'
                    : formData.skills.length >= 10
                    ? '#BA7517'
                    : '#E24B4A',
                }}
              >
                {formData.skills.length} skills entered
              </p>
              <p className="text-xs text-gray-400">
                LinkedIn recommends at least 10 skills. Add up to 50 for maximum search coverage.
              </p>
            </div>
            <NavButtons
              onBack={() => setActiveSection(5)}
              onNext={() => setActiveSection(7)}
            />
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
