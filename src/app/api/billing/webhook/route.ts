export const dynamic = 'force-dynamic'

// CRITICAL: Do NOT import NextRequest/NextResponse from next/server here.
// We use the Web API Request/Response directly so we can read the raw body
// without Next.js consuming it. Returning 5xx would cause Razorpay to retry
// indefinitely — always return 200 for handled events.

import { createClient }              from '@/lib/supabase/server'
import { verifyWebhookSignature, VALID_PLAN_IDS } from '@/lib/razorpay'
import {
  sendWelcomeEmail,
  sendPaymentConfirmationEmail,
  sendPaymentFailedEmail,
} from '@/lib/resend'

// ── Razorpay webhook payload types ────────────────────────────────────────────

interface RZPSubscriptionEntity {
  id:          string
  plan_id:     string
  status:      string
  current_end: number | null   // unix timestamp
  notes:       Record<string, string>
}

interface RZPPaymentEntity {
  id:       string
  amount:   number             // paise
  currency: string
  email:    string
  contact:  string
}

interface RZPWebhookPayload {
  event:   string
  payload: {
    subscription?: { entity: RZPSubscriptionEntity }
    payment?:      { entity: RZPPaymentEntity }
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // 1. Read raw body for signature verification
  const rawBody = await request.text()
  const sig     = request.headers.get('x-razorpay-signature') ?? ''

  if (!verifyWebhookSignature(rawBody, sig)) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const payload = JSON.parse(rawBody) as RZPWebhookPayload
  const event   = payload.event

  // All subsequent errors are logged but swallowed — we MUST return 200.
  try {
    const supabase = await createClient()

    // ── subscription.* events ───────────────────────────────────────────────

    const subEntity = payload.payload.subscription?.entity

    if (subEntity) {
      const rzpSubId = subEntity.id

      if (event === 'subscription.activated') {
        // Find our DB row to get plan_name
        const { data: row } = await supabase
          .from('subscriptions')
          .select('plan_name, user_id')
          .eq('razorpay_subscription_id', rzpSubId)
          .maybeSingle() as { data: { plan_name: string; user_id: string } | null }

        if (row) {
          // Determine PlanType from plan_name
          let planType = 'free'
          Array.from(VALID_PLAN_IDS.values()).forEach(meta => {
            if (meta.name.toLowerCase() === row.plan_name.toLowerCase()) {
              planType = meta.planType
            }
          })

          const currentEnd = subEntity.current_end
            ? new Date(subEntity.current_end * 1000).toISOString()
            : null

          await Promise.all([
            // Update subscription status + billing window
            supabase
              .from('subscriptions')
              .update({
                status:        'active',
                current_start: new Date().toISOString(),
                current_end:   currentEnd,
                updated_at:    new Date().toISOString(),
              })
              .eq('razorpay_subscription_id', rzpSubId),
            // Upgrade profile plan
            supabase
              .from('profiles')
              .update({ plan: planType, updated_at: new Date().toISOString() })
              .eq('id', row.user_id),
          ])

          // Fetch user email for welcome email
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', row.user_id)
            .single() as { data: { email: string; full_name: string | null } | null }

          if (profile?.email) {
            await sendWelcomeEmail(profile.email, profile.full_name ?? 'there')
          }
        }
      }

      else if (event === 'subscription.charged') {
        const payEntity  = payload.payload.payment?.entity
        const amountInr  = payEntity ? Math.round(payEntity.amount / 100) : 0
        const nextBilling = subEntity.current_end
          ? new Date(subEntity.current_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        const { data: row } = await supabase
          .from('subscriptions')
          .select('plan_name, user_id')
          .eq('razorpay_subscription_id', rzpSubId)
          .maybeSingle() as { data: { plan_name: string; user_id: string } | null }

        if (row) {
          // Refresh current_end on every renewal so settings page stays accurate
          await supabase
            .from('subscriptions')
            .update({
              current_end: nextBilling,
              updated_at:  new Date().toISOString(),
            })
            .eq('razorpay_subscription_id', rzpSubId)

          await supabase.from('usage_logs').insert({
            user_id:     row.user_id,
            action:      'payment',
            tokens_used: 0,
            metadata:    {
              razorpay_subscription_id: rzpSubId,
              amount_inr:               amountInr,
              payment_id:               payEntity?.id ?? null,
            },
          })

          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', row.user_id)
            .single() as { data: { email: string; full_name: string | null } | null }

          if (profile?.email) {
            await sendPaymentConfirmationEmail(
              profile.email,
              profile.full_name ?? 'there',
              row.plan_name,
              amountInr,
              nextBilling,
            )
          }
        }
      }

      else if (event === 'subscription.cancelled') {
        // Access continues until current period end — plan stays active
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('razorpay_subscription_id', rzpSubId)
      }

      else if (event === 'subscription.expired') {
        const { data: row } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('razorpay_subscription_id', rzpSubId)
          .maybeSingle() as { data: { user_id: string } | null }

        if (row) {
          await Promise.all([
            supabase
              .from('subscriptions')
              .update({ status: 'expired', updated_at: new Date().toISOString() })
              .eq('razorpay_subscription_id', rzpSubId),
            // Downgrade profile to free
            supabase
              .from('profiles')
              .update({ plan: 'free', updated_at: new Date().toISOString() })
              .eq('id', row.user_id),
          ])
        }
      }

      else if (event === 'subscription.completed') {
        // All billing cycles finished — downgrade profile to free
        const { data: row } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('razorpay_subscription_id', rzpSubId)
          .maybeSingle() as { data: { user_id: string } | null }

        if (row) {
          await Promise.all([
            supabase
              .from('subscriptions')
              .update({ status: 'completed', updated_at: new Date().toISOString() })
              .eq('razorpay_subscription_id', rzpSubId),
            supabase
              .from('profiles')
              .update({ plan: 'free', updated_at: new Date().toISOString() })
              .eq('id', row.user_id),
          ])
        }
      }

      else if (event === 'subscription.paused') {
        await supabase
          .from('subscriptions')
          .update({ status: 'paused', updated_at: new Date().toISOString() })
          .eq('razorpay_subscription_id', rzpSubId)
      }
    }

    // ── payment.failed ──────────────────────────────────────────────────────

    if (event === 'payment.failed') {
      const payEntity = payload.payload.payment?.entity

      if (payEntity?.email) {
        // Try to find user by email for logging
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('email', payEntity.email)
          .maybeSingle() as { data: { id: string; full_name: string | null } | null }

        if (profile) {
          await supabase.from('usage_logs').insert({
            user_id:     profile.id,
            action:      'payment_failed',
            tokens_used: 0,
            metadata:    {
              payment_id: payEntity.id,
              amount_inr: Math.round(payEntity.amount / 100),
            },
          })

          await sendPaymentFailedEmail(payEntity.email, profile.full_name ?? 'there')
        }
      }
    }
  } catch (err) {
    // Log but never propagate — Razorpay must receive 200
    console.error('[webhook]', event, err)
  }

  return Response.json({ received: true }, { status: 200 })
}
