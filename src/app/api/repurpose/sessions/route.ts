export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PlanType } from '@/types'

// ── GET /api/repurpose/sessions ───────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const plan   = (profile?.plan ?? 'free') as PlanType
    const isPaid = plan !== 'free'

    let query = supabase
      .from('repurpose_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'complete')
      .order('created_at', { ascending: false })

    // Free plan: only the most recent session
    if (!isPaid) {
      query = query.limit(1)
    } else {
      query = query.limit(20)
    }

    const { data: sessions, error } = await query

    if (error) throw error

    return NextResponse.json({ sessions: sessions ?? [], is_free: !isPaid })
  } catch (err) {
    console.error('[GET /api/repurpose/sessions]', err)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
