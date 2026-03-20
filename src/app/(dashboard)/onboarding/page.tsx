'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import OnboardingSteps, { type OnboardingFormData } from '@/components/features/OnboardingSteps'
import Logo from '@/components/ui/Logo'

export default function OnboardingPage() {
  const router   = useRouter()
  const [initialName, setInitialName] = useState('')

  // Pre-fill name from the current auth user (works for OAuth and email)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      const name =
        user?.user_metadata?.full_name ??
        user?.user_metadata?.name ??
        ''
      setInitialName(name)
    })
  }, [])

  const handleSaveStep = async (
    _step: number,
    partial: Partial<OnboardingFormData>
  ) => {
    await fetch('/api/user/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(partial),
    })
  }

  const handleComplete = async () => {
    await fetch('/api/user/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ onboarding_completed: true }),
    })
    router.push('/generate')
    router.refresh()
  }

  const handleSkip = async () => {
    await fetch('/api/user/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ onboarding_completed: true }),
    })
    router.push('/generate')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col items-center justify-center px-4 py-12 relative">

      {/* Skip link (top-right) */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-5 right-6 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        Skip for now →
      </button>

      <div className="w-full max-w-[540px] flex flex-col items-center">
        <div className="mb-8">
          <Logo size="lg" />
        </div>

        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-9">
          <OnboardingSteps
            initialName={initialName}
            onSaveStep={handleSaveStep}
            onComplete={handleComplete}
          />
        </div>
      </div>
    </div>
  )
}
