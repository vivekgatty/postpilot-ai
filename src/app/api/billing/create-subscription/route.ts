export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { razorpay, RAZORPAY_PLAN_IDS } from '@/lib/razorpay'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, yearly } = await req.json() as { plan: string; yearly: boolean }

    const planKey = `${plan}_${yearly ? 'yearly' : 'monthly'}`
    const planId = RAZORPAY_PLAN_IDS[planKey]

    if (!planId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: yearly ? 1 : 12,
      notes: {
        user_id: user.id,
        email: user.email ?? '',
      },
    })

    return NextResponse.json({ subscription_id: subscription.id })
  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
