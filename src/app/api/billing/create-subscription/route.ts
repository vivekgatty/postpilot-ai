export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse }                      from 'next/server'
import { createClient }                                   from '@/lib/supabase/server'
import { createSubscription, VALID_PLAN_IDS }             from '@/lib/razorpay'
import type { Profile, Subscription }                     from '@/types'

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate planId
    const { planId } = await req.json() as { planId?: string }
    if (!planId || !VALID_PLAN_IDS.has(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan. Provide a valid planId.' },
        { status: 400 },
      )
    }

    const planMeta = VALID_PLAN_IDS.get(planId)!

    // 3. Check no existing active subscription
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['created', 'authenticated', 'active', 'pending'])
      .maybeSingle() as { data: Pick<Subscription, 'id' | 'status'> | null }

    if (existing) {
      return NextResponse.json(
        { error: 'You already have an active subscription.' },
        { status: 400 },
      )
    }

    // 4. Fetch profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single() as { data: Pick<Profile, 'full_name'> | null }

    // 5. Create Razorpay subscription
    const { id: subscriptionId } = await createSubscription(
      planId,
      user.email ?? '',
      profile?.full_name ?? user.email ?? '',
    )

    // 6. INSERT into subscriptions table
    await supabase.from('subscriptions').insert({
      user_id:                  user.id,
      razorpay_subscription_id: subscriptionId,
      razorpay_plan_id:         planId,
      plan_name:                planMeta.name,
      status:                   'created',
    })

    // 7. Return
    return NextResponse.json({
      subscriptionId,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (err) {
    console.error('[create-subscription]', err)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
