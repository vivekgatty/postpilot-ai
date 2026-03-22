export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { StreakState } from '@/types'

// ── POST /api/streak/freeze ───────────────────────────────────────────────────

export async function POST() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    const plan = (profile?.plan ?? 'free') as string

    if (!['pro', 'agency'].includes(plan)) {
      return NextResponse.json(
        { error: 'Streak freezes require Pro or Agency plan' },
        { status: 403 },
      )
    }

    // Fetch streak state
    const { data: stateData, error: stateError } = await supabase
      .from('streak_states')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (stateError) throw stateError
    if (!stateData) return NextResponse.json({ error: 'No streak state found' }, { status: 404 })

    const state = stateData as StreakState

    if (state.freeze_count <= 0) {
      return NextResponse.json({ error: 'No streak freezes available' }, { status: 403 })
    }

    // Set freeze_active_until to 48 hours from now
    const until = new Date()
    until.setHours(until.getHours() + 48)
    const freeze_active_until = until.toISOString()
    const newFreezeCount = state.freeze_count - 1

    const { error: updateError } = await supabase
      .from('streak_states')
      .update({ freeze_active_until, freeze_count: newFreezeCount })
      .eq('user_id', user.id)
    if (updateError) throw updateError

    return NextResponse.json({
      success:              true,
      freeze_active_until,
      freeze_count:         newFreezeCount,
    })
  } catch (err) {
    console.error('[POST /api/streak/freeze]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to activate freeze' }, { status: 500 })
  }
}
