export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// ── GET /api/analyse/[id] ─────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('post_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data)
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })

    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/analyse/[id]]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 })
  }
}

// ── PATCH /api/analyse/[id] ───────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const raw = await req.json() as {
      improved_content?: string
      improved_score?: number
      actual_reactions?: number
      actual_comments?: number
      actual_impressions?: number
      suggestions?: unknown
    }

    const updates: Record<string, unknown> = {}

    if (raw.improved_content !== undefined)
      updates.improved_content = raw.improved_content
    if (raw.improved_score !== undefined)
      updates.improved_score = raw.improved_score
    if (raw.actual_reactions !== undefined)
      updates.actual_reactions = raw.actual_reactions
    if (raw.actual_comments !== undefined)
      updates.actual_comments = raw.actual_comments
    if (raw.actual_impressions !== undefined)
      updates.actual_impressions = raw.actual_impressions
    if (raw.suggestions !== undefined)
      updates.suggestions = raw.suggestions

    if (raw.actual_reactions !== undefined || raw.actual_comments !== undefined)
      updates.engagement_entered_at = new Date().toISOString()

    if (Object.keys(updates).length === 0)
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })

    const { data, error } = await supabase
      .from('post_analyses')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })

    return NextResponse.json(data)
  } catch (err) {
    console.error('[PATCH /api/analyse/[id]]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to update analysis' }, { status: 500 })
  }
}
