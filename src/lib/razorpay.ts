import Razorpay from 'razorpay'
import type { PlanType } from '@/types'

// ── Client ────────────────────────────────────────────────────────────────────

export const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

// ── Valid plan map  planId (env value) → { name, planType } ──────────────────
// Populated at runtime so undefined env vars produce an empty string that
// won't match any incoming planId.

export interface RazorpayPlanMeta {
  name:     string    // "Starter" / "Pro" / "Agency"
  planType: PlanType  // stored in profiles.plan
}

export const VALID_PLAN_IDS: Map<string, RazorpayPlanMeta> = new Map(
  [
    [process.env.RAZORPAY_PLAN_STARTER ?? '', { name: 'Starter', planType: 'starter' }],
    [process.env.RAZORPAY_PLAN_PRO     ?? '', { name: 'Pro',     planType: 'pro'     }],
    [process.env.RAZORPAY_PLAN_AGENCY  ?? '', { name: 'Agency',  planType: 'agency'  }],
  ].filter(([id]) => id !== '') as [string, RazorpayPlanMeta][]
)

// ── createSubscription ────────────────────────────────────────────────────────

export async function createSubscription(
  planId:  string,
  email:   string,
  name:    string,
): Promise<{ id: string }> {
  const subscription = await razorpay.subscriptions.create({
    plan_id:        planId,
    total_count:    12,           // 12 billing cycles (monthly)
    customer_notify: 1,
    notify_info: {
      notify_phone: '',
      notify_email: email,
    },
    notes: {
      customer_name: name,
      customer_email: email,
    },
  })

  return { id: subscription.id as string }
}

// ── cancelSubscription ────────────────────────────────────────────────────────
// cancel_at_cycle_end = true → access continues until period end

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await razorpay.subscriptions.cancel(subscriptionId, true)
}

// ── verifyWebhookSignature ────────────────────────────────────────────────────
// Razorpay.validateWebhookSignature is a static method on the class.

export function verifyWebhookSignature(
  rawBody:   string,
  signature: string,
): boolean {
  try {
    return Razorpay.validateWebhookSignature(
      rawBody,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET!,
    )
  } catch {
    return false
  }
}
