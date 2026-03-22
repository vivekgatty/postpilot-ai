export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// ── GET /api/profile-optimizer/[id] ──────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('profile_audits')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data)
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })

    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/profile-optimizer/[id]]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to fetch audit' }, { status: 500 })
  }
}

// ── PATCH /api/profile-optimizer/[id] ────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const raw = await req.json() as {
      completed_recommendations?: string[]
      profile_data?: unknown
      projected_score?: number
    }

    const updates: Record<string, unknown> = {}
    if (raw.completed_recommendations !== undefined)
      updates.completed_recommendations = raw.completed_recommendations
    if (raw.profile_data !== undefined)
      updates.profile_data = raw.profile_data
    if (raw.projected_score !== undefined)
      updates.projected_score = raw.projected_score

    if (Object.keys(updates).length === 0)
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })

    const { data, error } = await supabase
      .from('profile_audits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Audit not found' }, { status: 404 })

    return NextResponse.json(data)
  } catch (err) {
    console.error('[PATCH /api/profile-optimizer/[id]]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to update audit' }, { status: 500 })
  }
}

// ── DELETE /api/profile-optimizer/[id] ───────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('profile_audits')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/profile-optimizer/[id]]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to archive audit' }, { status: 500 })
  }
}
