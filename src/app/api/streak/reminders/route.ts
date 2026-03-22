export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/streak/reminders ─────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase
      .from('streak_reminders')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json(
      data ?? {
        user_id:       user.id,
        email_enabled: false,
        reminder_time: '09:00',
        timezone:      'Asia/Kolkata',
      },
    )
  } catch (err) {
    console.error('[GET /api/streak/reminders]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
  }
}

// ── POST /api/streak/reminders ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { email_enabled, reminder_time, timezone } = body

    const payload = {
      user_id:       user.id,
      email_enabled: Boolean(email_enabled),
      reminder_time: (reminder_time as string | undefined) ?? '09:00',
      timezone:      (timezone      as string | undefined) ?? 'Asia/Kolkata',
    }

    const { data, error } = await supabase
      .from('streak_reminders')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error

    return NextResponse.json(data)
  } catch (err) {
    console.error('[POST /api/streak/reminders]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to save reminders' }, { status: 500 })
  }
}
