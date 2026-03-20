'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { NICHE_META, NICHE_OPTIONS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import type { NicheType } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OnboardingFormData {
  full_name:    string
  linkedin_url: string
  role:         string   // job title; saved as profile metadata
  niche:        NicheType
  avatar_url:   string
}

interface OnboardingStepsProps {
  initialName:  string
  onSaveStep:   (step: number, partial: Partial<OnboardingFormData>) => Promise<void>
  onComplete:   () => void
}

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 'profile', title: 'Tell us about yourself'  },
  { id: 'niche',   title: "What's your niche?"      },
  { id: 'done',    title: "You're all set 🎉"        },
]

const inputCls =
  'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/25 focus:border-[#1D9E75] transition-colors bg-white'

// ── Generate-screen mockup (step 3 visual) ─────────────────────────────────────

function GenerateMockup() {
  return (
    <div className="bg-[#F8F8F6] rounded-xl border border-gray-200 p-4 select-none pointer-events-none">
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
        <div className="h-2.5 bg-gray-100 rounded w-32 mb-2" />
        <div className="h-[48px] bg-gray-50 rounded border border-gray-100" />
      </div>
      <div className="flex gap-2 mb-3">
        {['Professional', 'Storytelling', 'Educational'].map((t, i) => (
          <span
            key={t}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border',
              i === 0 ? 'bg-[#1D9E75] text-white border-[#1D9E75]'
                      : 'bg-white text-gray-500 border-gray-200'
            )}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="bg-white rounded-lg border border-[#1D9E75]/30 shadow-sm p-3">
        <div className="space-y-1.5 mb-3">
          {[1, 11/12, 4/5, 10/12, 3/5].map((w, i) => (
            <div key={i} className="h-2 bg-gray-100 rounded" style={{ width: `${w * 100}%` }} />
          ))}
        </div>
        <div className="flex justify-between items-center">
          <div className="h-6 w-14 bg-gray-100 rounded" />
          <div className="h-7 w-24 bg-[#1D9E75] rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingSteps({
  initialName,
  onSaveStep,
  onComplete,
}: OnboardingStepsProps) {
  const [step, setStep]                 = useState(0)
  const [visible, setVisible]           = useState(true)
  const [saving, setSaving]             = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const fileInputRef                    = useRef<HTMLInputElement>(null)

  const [data, setData] = useState<OnboardingFormData>({
    full_name:    initialName,
    linkedin_url: '',
    role:         '',
    niche:        'Tech/SaaS',
    avatar_url:   '',
  })

  // ── Transition helper ─────────────────────────────────────────────────────
  const transitionTo = (next: number) => {
    setVisible(false)
    setTimeout(() => { setStep(next); setVisible(true) }, 180)
  }

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars').upload(path, file, { upsert: true })
      if (!upErr) {
        const { data: url } = supabase.storage.from('avatars').getPublicUrl(path)
        setData(d => ({ ...d, avatar_url: url.publicUrl }))
      }
    } finally {
      setAvatarLoading(false)
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = async () => {
    setSaving(true)
    try {
      if (step === 0) await onSaveStep(0, {
        full_name:    data.full_name.trim(),
        linkedin_url: data.linkedin_url.trim(),
        avatar_url:   data.avatar_url,
      })
      if (step === 1) await onSaveStep(1, { niche: data.niche })
      if (step === 2) { onComplete(); return }
      transitionTo(step + 1)
    } finally {
      setSaving(false)
    }
  }

  const canProceed = step === 0
    ? data.full_name.trim().length > 0
    : step === 1
      ? Boolean(data.niche)
      : true

  return (
    <div>
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full transition-all duration-300',
              i === step  ? 'w-6 h-2 bg-[#1D9E75]'
              : i < step  ? 'w-2 h-2 bg-[#1D9E75]/40'
                          : 'w-2 h-2 bg-gray-200'
            )}
          />
        ))}
      </div>

      {/* Heading */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#0A2540] mb-1">{STEPS[step].title}</h2>
        <p className="text-sm text-gray-500">
          {step === 0 && 'Help us personalise your PostPika experience'}
          {step === 1 && 'Pick the niche that best describes your professional focus'}
          {step === 2 && 'Your AI-powered LinkedIn content studio is ready'}
        </p>
      </div>

      {/* Step content — fade + lift transition */}
      <div
        style={{
          opacity:   visible ? 1 : 0,
          transform: visible ? 'translateY(0px)' : 'translateY(8px)',
          transition: 'opacity 180ms ease, transform 180ms ease',
        }}
      >

        {/* ─── Step 0: Profile ─────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="relative flex-shrink-0 group"
                aria-label="Upload profile photo"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[#1D9E75]/8 border-2 border-dashed border-[#1D9E75]/30 group-hover:border-[#1D9E75] transition-colors flex items-center justify-center">
                  {data.avatar_url ? (
                    <Image src={data.avatar_url} alt="Avatar" width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-7 h-7 text-[#1D9E75]/50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                  )}
                  {avatarLoading && (
                    <div className="absolute inset-0 rounded-full bg-white/70 flex items-center justify-center">
                      <svg className="animate-spin h-4 w-4 text-[#1D9E75]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
              <div>
                <p className="text-sm font-medium text-gray-700">Profile photo</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-[#1D9E75] hover:underline"
                >
                  {data.avatar_url ? 'Change photo' : 'Upload photo'}{' '}
                  <span className="text-gray-400">(optional)</span>
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
            </div>

            <div>
              <label htmlFor="ob-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name <span className="text-red-400">*</span>
              </label>
              <input
                id="ob-name"
                type="text"
                autoComplete="name"
                value={data.full_name}
                onChange={e => setData(d => ({ ...d, full_name: e.target.value }))}
                placeholder="Priya Sharma"
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="ob-role" className="block text-sm font-medium text-gray-700 mb-1.5">
                Job title / role
              </label>
              <input
                id="ob-role"
                type="text"
                value={data.role}
                onChange={e => setData(d => ({ ...d, role: e.target.value }))}
                placeholder="Senior Product Manager at Razorpay"
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="ob-li" className="block text-sm font-medium text-gray-700 mb-1.5">
                LinkedIn URL
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs select-none pointer-events-none">
                  linkedin.com/in/
                </span>
                <input
                  id="ob-li"
                  type="text"
                  value={data.linkedin_url.replace(/.*linkedin\.com\/in\//i, '')}
                  onChange={e => {
                    const slug = e.target.value.replace(/.*linkedin\.com\/in\//i, '')
                    setData(d => ({
                      ...d,
                      linkedin_url: slug ? `https://linkedin.com/in/${slug}` : '',
                    }))
                  }}
                  placeholder="your-name"
                  className={cn(inputCls, 'pl-[8.5rem]')}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 1: Niche cards ──────────────────────────────────────── */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-3">
            {NICHE_OPTIONS.map(niche => {
              const meta     = NICHE_META[niche]
              const selected = data.niche === niche
              return (
                <button
                  key={niche}
                  type="button"
                  onClick={() => setData(d => ({ ...d, niche }))}
                  className={cn(
                    'text-left p-4 rounded-xl border-2 transition-all duration-150 focus:outline-none',
                    selected
                      ? 'border-[#1D9E75] bg-[#1D9E75]/5 ring-1 ring-[#1D9E75]/20'
                      : 'border-gray-200 bg-white hover:border-[#1D9E75]/40 hover:bg-gray-50'
                  )}
                >
                  <span className="text-2xl mb-2 block leading-none">{meta.icon}</span>
                  <p className={cn(
                    'text-sm font-semibold mb-0.5',
                    selected ? 'text-[#1D9E75]' : 'text-[#0A2540]'
                  )}>
                    {niche}
                  </p>
                  <p className="text-xs text-gray-500 leading-snug">{meta.example}</p>
                </button>
              )
            })}
          </div>
        )}

        {/* ─── Step 2: All set ──────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <GenerateMockup />
            <ul className="space-y-3">
              {[
                { icon: '✨', text: 'Generate polished LinkedIn posts in seconds with AI'  },
                { icon: '📅', text: 'Schedule and manage your content calendar visually'   },
                { icon: '💡', text: 'Never run out of ideas with the AI-powered Idea Lab'  },
              ].map(({ icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="w-7 h-7 rounded-full bg-[#1D9E75]/10 flex items-center justify-center flex-shrink-0 text-base leading-none">
                    {icon}
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Navigation bar */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => transitionTo(step - 1)}
            disabled={saving}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            ← Back
          </button>
        ) : <span />}

        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed || saving}
          className="inline-flex items-center gap-2 bg-[#1D9E75] hover:bg-[#178a64] text-white font-semibold text-sm rounded-lg px-5 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/50 focus:ring-offset-2"
        >
          {saving && (
            <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {step === 2 ? 'Start generating posts →' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
