export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PlannerSettings } from '@/types'

const DEFAULT_SETTINGS: Omit<PlannerSettings, 'user_id'> = {
  goals:             [],
  posting_frequency: 3,
  preferred_days:    ['Tuesday', 'Wednesday', 'Thursday'],
  preferred_time:    '08:00',
  format_mix:        { text: 60, carousel: 20, poll: 10, question: 10 },
  setup_completed:   false,
}

// ── GET /api/planner/settings ─────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('planner_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (!data) {
      return NextResponse.json({ settings: { ...DEFAULT_SETTINGS, user_id: user.id } })
    }

    return NextResponse.json({ settings: data })
  } catch (err) {
    console.error('[GET /api/planner/settings]', err)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// ── POST /api/planner/settings ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: Partial<PlannerSettings>
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const posting_frequency = body.posting_frequency ?? 3
    if (posting_frequency < 1 || posting_frequency > 7) {
      return NextResponse.json({ error: 'posting_frequency must be 1–7' }, { status: 400 })
    }

    const format_mix = body.format_mix
    if (format_mix) {
      const total = (format_mix.text ?? 0) + (format_mix.carousel ?? 0) + (format_mix.poll ?? 0) + (format_mix.question ?? 0)
      if (Math.abs(total - 100) > 1) {
        return NextResponse.json({ error: 'format_mix values must sum to 100' }, { status: 400 })
      }
    }

    const payload = {
      user_id:           user.id,
      goals:             body.goals             ?? [],
      posting_frequency,
      preferred_days:    body.preferred_days    ?? ['Tuesday', 'Wednesday', 'Thursday'],
      preferred_time:    body.preferred_time    ?? '08:00',
      format_mix:        format_mix             ?? DEFAULT_SETTINGS.format_mix,
      setup_completed:   body.setup_completed   ?? false,
    }

    const { data, error } = await supabase
      .from('planner_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ settings: data })
  } catch (err) {
    console.error('[POST /api/planner/settings]', err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
