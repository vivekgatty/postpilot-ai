'use client'

import { useState, useEffect, useRef } from 'react'
import type { PlanType } from '@/types'

// ── Plan data ─────────────────────────────────────────────────────────────────

interface PlanConfig {
  id:          PlanType
  name:        string
  monthlyPrice: number         // INR
  annualPrice:  number         // INR per month, billed annually
  features:    string[]
  popular?:    boolean
  ctaLabel:    string
}

const PLANS: PlanConfig[] = [
  {
    id:           'starter',
    name:         'Starter',
    monthlyPrice: 799,
    annualPrice:  639,  // 20% off
    features: [
      '200 generations / month',
      'Content calendar',
      '5 tone styles',
      'Email support',
    ],
    ctaLabel: 'Get Starter',
  },
  {
    id:           'pro',
    name:         'Pro',
    monthlyPrice: 1999,
    annualPrice:  1599,
    features: [
      'Unlimited generations',
      'Content calendar',
      'Idea Lab',
      'Analytics dashboard',
      'Priority support',
    ],
    popular:  true,
    ctaLabel: 'Get Pro',
  },
  {
    id:           'agency',
    name:         'Agency',
    monthlyPrice: 4999,
    annualPrice:  3999,
    features: [
      'Everything in Pro',
      '5 brand profiles',
      'Team access (coming soon)',
      'Dedicated onboarding',
    ],
    ctaLabel: 'Get Agency',
  },
]

// ── Plan ID env map (client-side — these are NEXT_PUBLIC vars) ────────────────
// The planId sent to /api/billing/create-subscription must be the Razorpay plan ID.
// We read them from NEXT_PUBLIC env vars so the client can pass them directly.

function getRazorpayPlanId(planType: PlanType): string {
  switch (planType) {
    case 'starter': return process.env.NEXT_PUBLIC_RAZORPAY_PLAN_STARTER ?? ''
    case 'pro':     return process.env.NEXT_PUBLIC_RAZORPAY_PLAN_PRO     ?? ''
    case 'agency':  return process.env.NEXT_PUBLIC_RAZORPAY_PLAN_AGENCY  ?? ''
    default:        return ''
  }
}

// ── Razorpay checkout loader ──────────────────────────────────────────────────

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, cb: () => void) => void
    }
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(); return
    }
    const script = document.createElement('script')
    script.src   = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay'))
    document.body.appendChild(script)
  })
}

// ── Check icon ────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-[#1D9E75] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PricingTableProps {
  currentPlan: PlanType
  onUpgrade:   (planId: string) => void
  loading:     boolean
  userEmail?:  string
  userName?:   string
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PricingTable({
  currentPlan,
  onUpgrade,
  loading,
  userEmail = '',
  userName  = '',
}: PricingTableProps) {
  const [annual,      setAnnual]      = useState(false)
  const [checkoutingId, setCheckoutingId] = useState<PlanType | null>(null)
  const [toastMsg,    setToastMsg]    = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  function pushToast(msg: string) {
    setToastMsg(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(null), 4000)
  }

  async function handleCheckout(plan: PlanConfig) {
    if (loading || checkoutingId) return
    setCheckoutingId(plan.id)

    try {
      // 1. Get Razorpay plan ID
      const razorpayPlanId = getRazorpayPlanId(plan.id)
      if (!razorpayPlanId) {
        pushToast('Plan configuration missing. Contact support.')
        setCheckoutingId(null)
        return
      }

      // 2. Create subscription on server
      const res  = await fetch('/api/billing/create-subscription', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ planId: razorpayPlanId }),
      })
      const data = await res.json() as { subscriptionId?: string; razorpayKeyId?: string; error?: string }

      if (!res.ok || !data.subscriptionId) {
        pushToast(data.error ?? 'Failed to create subscription')
        setCheckoutingId(null)
        return
      }

      // 3. Load Razorpay script
      await loadRazorpayScript()

      // 4. Open checkout
      const rzp = new window.Razorpay({
        key:             data.razorpayKeyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name:            'PostPika',
        description:     `${plan.name} Plan`,
        image:           '/logo.png',
        prefill: {
          email: userEmail,
          name:  userName,
        },
        theme: { color: '#1D9E75' },
        handler: () => {
          // 5. Success
          pushToast('Payment successful! Your plan is activating…')
          onUpgrade(razorpayPlanId)
          setTimeout(() => window.location.reload(), 3000)
        },
      })

      rzp.on('payment.failed', () => {
        pushToast('Payment failed. Please try again.')
        setCheckoutingId(null)
      })

      // modal dismiss
      const originalOpen = rzp.open.bind(rzp)
      rzp.open = function () {
        originalOpen()
      }

      rzp.open()

      // Clear local loading — Razorpay modal is open, user controls from here
      setCheckoutingId(null)
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Checkout failed')
      setCheckoutingId(null)
    }
  }

  return (
    <div>
      {/* Annual / monthly toggle */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <span className={`text-sm font-medium ${!annual ? 'text-[#0A2540]' : 'text-gray-400'}`}>
          Monthly
        </span>
        <button
          role="switch"
          aria-checked={annual}
          onClick={() => setAnnual(v => !v)}
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
            annual ? 'bg-[#1D9E75]' : 'bg-gray-200',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
              annual ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')}
          />
        </button>
        <span className={`text-sm font-medium ${annual ? 'text-[#0A2540]' : 'text-gray-400'}`}>
          Annual
        </span>
        {annual && (
          <span className="text-xs font-semibold text-[#1D9E75] bg-[#E1F5EE] px-2 py-0.5 rounded-full">
            20% off
          </span>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => {
          const isCurrent  = currentPlan === plan.id
          const isCheckingOut = checkoutingId === plan.id
          const price      = annual ? plan.annualPrice : plan.monthlyPrice
          const displayedAnnual = annual

          return (
            <div
              key={plan.id}
              className={[
                'relative flex flex-col rounded-2xl border bg-white p-6 transition-shadow',
                plan.popular
                  ? 'border-2 border-[#1D9E75] shadow-lg shadow-[#1D9E75]/10'
                  : 'border-gray-200 hover:shadow-md',
              ].join(' ')}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-[#1D9E75] text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan name */}
              <h3 className="text-lg font-bold text-[#0A2540] mb-1">{plan.name}</h3>

              {/* Price */}
              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#0A2540]">
                  ₹{price.toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-gray-400">/mo</span>
              </div>
              {displayedAnnual && (
                <p className="text-xs text-gray-400 mb-4">
                  ₹{(price * 12).toLocaleString('en-IN')} billed annually
                </p>
              )}
              {!displayedAnnual && <div className="mb-4" />}

              {/* Feature list */}
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckIcon />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleCheckout(plan)}
                disabled={isCurrent || loading || !!checkoutingId}
                className={[
                  'w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isCurrent
                    ? 'bg-gray-100 text-gray-400 cursor-default'
                    : plan.popular
                    ? 'bg-[#1D9E75] text-white hover:bg-[#178a63]'
                    : 'border border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white',
                ].join(' ')}
              >
                {isCheckingOut ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Opening…
                  </span>
                ) : isCurrent ? (
                  'Current plan'
                ) : (
                  plan.ctaLabel
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[100] bg-[#0A2540] text-white text-sm font-medium
                        px-4 py-3 rounded-xl shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-200">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
