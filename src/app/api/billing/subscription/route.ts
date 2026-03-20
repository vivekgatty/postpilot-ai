export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Subscription } from '@/types'

// ── GET /api/billing/subscription ─────────────────────────────────────────────
// Returns the user's current subscription and a simple billing history derived
// from usage_logs with action='payment'.

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch current subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: Subscription | null }

    // Build billing history from payment usage_logs
    const { data: logs } = await supabase
      .from('usage_logs')
      .select('created_at, metadata')
      .eq('user_id', user.id)
      .eq('action', 'payment')
      .order('created_at', { ascending: false })
      .limit(24)

    const history = (logs ?? []).map(log => ({
      date:   new Date(log.created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      }),
      amount: `₹${((log.metadata as Record<string, number>)?.amount_inr ?? 0).toLocaleString('en-IN')}`,
      status: 'Paid',
    }))

    return NextResponse.json({ subscription, history })
  } catch (err) {
    console.error('[GET /api/billing/subscription]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}
