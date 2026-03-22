export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── PATCH /api/planner/content-bank/[id] ─────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: Record<string, unknown>
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const allowed = ['title', 'topic', 'hook', 'pillar_id', 'format', 'is_used']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    const { data, error } = await supabase
      .from('content_bank')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select(`*, pillar:content_pillars(*)`)
      .single()

    if (error) throw error

    return NextResponse.json({ item: data })
  } catch (err) {
    console.error('[PATCH /api/planner/content-bank/[id]]', err)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

// ── DELETE /api/planner/content-bank/[id] ────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('content_bank')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/planner/content-bank/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
