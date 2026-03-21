export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TONE_CUSTOM_LIMITS } from '@/lib/constants'

// GET /api/custom-tones — list active custom tones for current user
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: tones, error } = await supabase
      .from('custom_tones')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ tones: tones ?? [] })
  } catch (err) {
    console.error('[GET /api/custom-tones]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/custom-tones — create a new custom tone
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check plan limit
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const plan = profile?.plan ?? 'free'
    const limit = TONE_CUSTOM_LIMITS[plan] ?? 0

    const { count: existing } = await supabase
      .from('custom_tones')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    if ((existing ?? 0) >= limit) {
      return NextResponse.json(
        { error: 'You have reached the custom tone limit for your plan. Upgrade to create more.' },
        { status: 403 }
      )
    }

    // Validate body
    let body: { name?: unknown; system_prompt?: unknown; config_json?: unknown }
    try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const { name, system_prompt, config_json } = body

    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 30)
      return NextResponse.json({ error: 'name is required and must be ≤30 characters' }, { status: 400 })
    if (typeof system_prompt !== 'string' || system_prompt.trim().length === 0 || system_prompt.length > 2000)
      return NextResponse.json({ error: 'system_prompt is required and must be ≤2000 characters' }, { status: 400 })

    const { data: tone, error } = await supabase
      .from('custom_tones')
      .insert({
        user_id:     user.id,
        name:        name.trim(),
        system_prompt: system_prompt.trim(),
        config_json: config_json ?? {},
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ tone }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/custom-tones]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
