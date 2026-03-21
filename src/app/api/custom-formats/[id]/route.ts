export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: existing } = await supabase
      .from('custom_formats')
      .select('id, user_id')
      .eq('id', params.id)
      .maybeSingle()

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    let body: { name?: unknown; format_prompt?: unknown; config_json?: unknown }
    try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (typeof body.name === 'string' && body.name.trim().length > 0)
      updates.name = body.name.trim().slice(0, 30)
    if (typeof body.format_prompt === 'string' && body.format_prompt.trim().length > 0)
      updates.format_prompt = body.format_prompt.trim().slice(0, 2000)
    if (body.config_json && typeof body.config_json === 'object')
      updates.config_json = body.config_json

    const { data: format, error } = await supabase
      .from('custom_formats')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ format })
  } catch (err) {
    console.error('[PATCH /api/custom-formats/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: existing } = await supabase
      .from('custom_formats')
      .select('id, user_id')
      .eq('id', params.id)
      .maybeSingle()

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await supabase
      .from('custom_formats')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/custom-formats/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
