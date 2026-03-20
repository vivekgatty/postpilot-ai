'use client'

import { useState } from 'react'
import { PRICING_PLANS } from '@/lib/constants'
import { formatINR } from '@/lib/utils'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { UserRole } from '@/types'

interface PricingTableProps {
  currentPlan?: UserRole
  onSelectPlan?: (planId: UserRole, yearly: boolean) => void
  loading?: boolean
}

export default function PricingTable({
  currentPlan = 'free',
  onSelectPlan,
  loading = false,
}: PricingTableProps) {
  const [yearly, setYearly] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-center gap-3 mb-8">
        <span className={cn('text-sm', !yearly ? 'font-semibold text-[#0A2540]' : 'text-gray-400')}>
          Monthly
        </span>
        <button
          onClick={() => setYearly(!yearly)}
          className={cn(
            'relative inline-flex h-6 w-11 rounded-full transition-colors',
            yearly ? 'bg-[#1D9E75]' : 'bg-gray-200'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
              yearly ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
        <span className={cn('text-sm', yearly ? 'font-semibold text-[#0A2540]' : 'text-gray-400')}>
          Yearly <span className="text-[#1D9E75] text-xs font-semibold">Save 17%</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRICING_PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              'relative flex flex-col',
              plan.highlighted && 'ring-2 ring-[#1D9E75]'
            )}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#1D9E75] text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <h3 className="text-lg font-bold text-[#0A2540]">{plan.name}</h3>
            <div className="mt-2 mb-4">
              <span className="text-3xl font-extrabold text-[#0A2540]">
                {plan.price_monthly === 0
                  ? 'Free'
                  : formatINR(yearly ? plan.price_yearly / 12 : plan.price_monthly)}
              </span>
              {plan.price_monthly > 0 && (
                <span className="text-gray-400 text-sm">/month</span>
              )}
            </div>

            <ul className="space-y-2 flex-1 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-[#1D9E75] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              variant={plan.highlighted ? 'primary' : 'outline'}
              className="w-full"
              disabled={currentPlan === plan.id}
              loading={loading}
              onClick={() => onSelectPlan?.(plan.id, yearly)}
            >
              {currentPlan === plan.id ? 'Current Plan' : `Get ${plan.name}`}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
