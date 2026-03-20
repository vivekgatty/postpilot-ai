'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import OnboardingSteps from '@/components/features/OnboardingSteps'
import { BRAND } from '@/lib/constants'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleComplete = async (data: {
    full_name: string
    headline: string
    industry: string
    tone_preference: string
  }) => {
    setLoading(true)
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, onboarding_completed: true }),
      })
      router.push('/dashboard')
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="text-[#1D9E75] text-3xl font-bold">{BRAND.name}</span>
          <p className="text-gray-500 mt-2">Let&apos;s personalise your experience</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <OnboardingSteps onComplete={handleComplete} loading={loading} />
        </div>
      </div>
    </div>
  )
}
