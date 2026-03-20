'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { TONES } from '@/lib/constants'

interface OnboardingData {
  full_name: string
  headline: string
  industry: string
  tone_preference: string
}

interface OnboardingStepsProps {
  onComplete: (data: OnboardingData) => void
  loading?: boolean
}

const STEPS = [
  { id: 'profile', title: 'Your Profile' },
  { id: 'industry', title: 'Your Industry' },
  { id: 'tone', title: 'Your Tone' },
]

export default function OnboardingSteps({ onComplete, loading }: OnboardingStepsProps) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    full_name: '',
    headline: '',
    industry: '',
    tone_preference: 'professional',
  })

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      onComplete(data)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                i <= step
                  ? 'bg-[#1D9E75] text-white'
                  : 'bg-gray-100 text-gray-400'
              )}
            >
              {i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 transition-all',
                  i < step ? 'bg-[#1D9E75]' : 'bg-gray-100'
                )}
              />
            )}
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold text-[#0A2540] mb-6">{STEPS[step].title}</h2>

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={data.full_name}
              onChange={(e) => setData({ ...data, full_name: e.target.value })}
              placeholder="Arjun Sharma"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Headline</label>
            <input
              type="text"
              value={data.headline}
              onChange={(e) => setData({ ...data, headline: e.target.value })}
              placeholder="Senior Software Engineer at Infosys | Tech Blogger"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
          <select
            value={data.industry}
            onChange={(e) => setData({ ...data, industry: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
          >
            <option value="">Select your industry</option>
            <option value="IT / Software">IT / Software</option>
            <option value="Finance / Banking">Finance / Banking</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Education">Education</option>
            <option value="Marketing / Advertising">Marketing / Advertising</option>
            <option value="Consulting">Consulting</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Startup / Entrepreneurship">Startup / Entrepreneurship</option>
            <option value="Other">Other</option>
          </select>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-wrap gap-2">
          {TONES.map((tone) => (
            <button
              key={tone.value}
              type="button"
              onClick={() => setData({ ...data, tone_preference: tone.value })}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium border transition-all',
                data.tone_preference === tone.value
                  ? 'bg-[#1D9E75] text-white border-[#1D9E75]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#1D9E75]'
              )}
            >
              {tone.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button onClick={handleNext} loading={loading && step === STEPS.length - 1}>
          {step < STEPS.length - 1 ? 'Continue' : 'Get Started'}
        </Button>
      </div>
    </div>
  )
}
