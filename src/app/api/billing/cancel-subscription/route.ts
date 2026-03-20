export const dynamic = 'force-dynamic'

import { NextResponse }         from 'next/server'
import { createClient }         from '@/lib/supabase/server'
import { cancelSubscription }   from '@/lib/razorpay'
import type { Subscription }    from '@/types'

export async function POST() {
  try {
    // 1. Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, razorpay_subscription_id, plan_name')
      .eq('user_id', user.id)
      .in('status', ['active', 'authenticated'])
      .maybeSingle() as { data: Pick<Subscription, 'id' | 'razorpay_subscription_id' | 'plan_name'> | null }

    if (!subscription?.razorpay_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found.' },
        { status: 404 },
      )
    }

    // 3. Cancel at end of billing period (cancelAtCycleEnd = true)
    await cancelSubscription(subscription.razorpay_subscription_id)

    // 4. Mark as cancelled in our DB
    // Note: profile.plan is NOT downgraded here — the webhook subscription.expired
    // event will handle that when the period actually ends.
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', subscription.id)

    return NextResponse.json({
      success: true,
      message: 'Access continues until end of billing period',
    })
  } catch (err) {
    console.error('[cancel-subscription]', err)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}
