export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FORMAT_CUSTOM_LIMITS } from '@/lib/constants'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: formats, error } = await supabase
      .from('custom_formats')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ formats: formats ?? [] })
  } catch (err) {
    console.error('[GET /api/custom-formats]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const plan = profile?.plan ?? 'free'
    const limit = FORMAT_CUSTOM_LIMITS[plan] ?? 0

    const { count: existing } = await supabase
      .from('custom_formats')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    if ((existing ?? 0) >= limit) {
      return NextResponse.json(
        { error: 'You have reached the custom format limit for your plan. Upgrade to create more.' },
        { status: 403 }
      )
    }

    let body: { name?: unknown; structure_type?: unknown; format_prompt?: unknown; config_json?: unknown }
    try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const { name, structure_type, format_prompt, config_json } = body

    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 30)
      return NextResponse.json({ error: 'name is required and must be ≤30 characters' }, { status: 400 })
    if (typeof structure_type !== 'string' || structure_type.trim().length === 0)
      return NextResponse.json({ error: 'structure_type is required' }, { status: 400 })
    if (typeof format_prompt !== 'string' || format_prompt.trim().length === 0 || format_prompt.length > 2000)
      return NextResponse.json({ error: 'format_prompt is required and must be ≤2000 characters' }, { status: 400 })

    const { data: format, error } = await supabase
      .from('custom_formats')
      .insert({
        user_id:        user.id,
        name:           name.trim(),
        structure_type: structure_type.trim(),
        format_prompt:  format_prompt.trim(),
        config_json:    config_json ?? {},
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ format }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/custom-formats]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
