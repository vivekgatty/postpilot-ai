export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── PATCH /api/planner/pillars/[id] ──────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      name?:        string
      description?: string
      color?:       string
      weight?:      'high' | 'medium' | 'low'
      tone_id?:     string
    }

    if (body.name !== undefined && body.name.length > 50) {
      return NextResponse.json({ error: 'name must be ≤50 chars' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (body.name        !== undefined) updates.name        = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.color       !== undefined) updates.color       = body.color
    if (body.weight      !== undefined) updates.weight      = body.weight
    if (body.tone_id     !== undefined) updates.tone_id     = body.tone_id

    const { data, error } = await supabase
      .from('content_pillars')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ pillar: data })
  } catch (err) {
    console.error('[PATCH /api/planner/pillars/[id]]', err)
    return NextResponse.json({ error: 'Failed to update pillar' }, { status: 500 })
  }
}

// ── DELETE /api/planner/pillars/[id] (soft delete) ────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('content_pillars')
      .update({ is_active: false })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/planner/pillars/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete pillar' }, { status: 500 })
  }
}
