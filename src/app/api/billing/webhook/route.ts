import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature') ?? ''
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body) as {
      event: string
      payload: {
        subscription: {
          entity: {
            id: string
            notes: { user_id: string }
            plan_id: string
            status: string
          }
        }
      }
    }

    const supabase = await createClient()
    const { subscription: { entity } } = event.payload
    const userId = entity.notes?.user_id

    if (!userId) {
      return NextResponse.json({ error: 'No user_id in notes' }, { status: 400 })
    }

    switch (event.event) {
      case 'subscription.activated':
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          razorpay_subscription_id: entity.id,
          status: 'active',
          plan: entity.plan_id.includes('team') ? 'team' : 'pro',
          updated_at: new Date().toISOString(),
        })
        break

      case 'subscription.cancelled':
      case 'subscription.completed':
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('razorpay_subscription_id', entity.id)
        break

      case 'subscription.charged':
        await supabase
          .from('subscriptions')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('razorpay_subscription_id', entity.id)
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
