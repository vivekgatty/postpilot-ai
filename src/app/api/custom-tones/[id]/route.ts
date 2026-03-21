export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/custom-tones/[id] — update name, system_prompt, or config_json
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify ownership
    const { data: existing } = await supabase
      .from('custom_tones')
      .select('id, user_id')
      .eq('id', params.id)
      .maybeSingle()

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    let body: { name?: unknown; system_prompt?: unknown; config_json?: unknown }
    try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (typeof body.name === 'string' && body.name.trim().length > 0)
      updates.name = body.name.trim().slice(0, 30)
    if (typeof body.system_prompt === 'string' && body.system_prompt.trim().length > 0)
      updates.system_prompt = body.system_prompt.trim().slice(0, 2000)
    if (body.config_json && typeof body.config_json === 'object')
      updates.config_json = body.config_json

    const { data: tone, error } = await supabase
      .from('custom_tones')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ tone })
  } catch (err) {
    console.error('[PATCH /api/custom-tones/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/custom-tones/[id] — soft delete (is_active = false)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: existing } = await supabase
      .from('custom_tones')
      .select('id, user_id')
      .eq('id', params.id)
      .maybeSingle()

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await supabase
      .from('custom_tones')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/custom-tones/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
