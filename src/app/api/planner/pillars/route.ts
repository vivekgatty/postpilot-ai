export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PlanType } from '@/types'

const PILLAR_LIMITS: Record<PlanType, number> = {
  free:    3,
  starter: 4,
  pro:     999,
  agency:  999,
}

// ── GET /api/planner/pillars ──────────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('content_pillars')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (error) throw error

    return NextResponse.json({ pillars: data ?? [] })
  } catch (err) {
    console.error('[GET /api/planner/pillars]', err)
    return NextResponse.json({ error: 'Failed to fetch pillars' }, { status: 500 })
  }
}

// ── POST /api/planner/pillars ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: {
      name: string
      description: string
      color: string
      weight: 'high' | 'medium' | 'low'
      tone_id: string
      position: number
    }
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!body.name || body.name.length > 50) {
      return NextResponse.json({ error: 'name is required and must be ≤50 chars' }, { status: 400 })
    }

    // Fetch user plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const plan  = (profile?.plan ?? 'free') as PlanType
    const limit = PILLAR_LIMITS[plan]

    // Count existing active pillars
    const { count } = await supabase
      .from('content_pillars')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        { error: `Your plan allows a maximum of ${limit} content pillars` },
        { status: 403 },
      )
    }

    const { data, error } = await supabase
      .from('content_pillars')
      .insert({
        user_id:     user.id,
        name:        body.name,
        description: body.description ?? '',
        color:       body.color ?? '#1D9E75',
        weight:      body.weight ?? 'medium',
        tone_id:     body.tone_id ?? 'professional',
        position:    body.position ?? 0,
        is_active:   true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ pillar: data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/planner/pillars]', err)
    return NextResponse.json({ error: 'Failed to create pillar' }, { status: 500 })
  }
}

// ── PUT /api/planner/pillars  (reorder) ───────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let pillarIds: string[]
    try { ({ pillarIds } = await req.json() as { pillarIds: string[] }) } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    if (!Array.isArray(pillarIds)) {
      return NextResponse.json({ error: 'pillarIds must be an array' }, { status: 400 })
    }

    await Promise.all(
      pillarIds.map((id, index) =>
        supabase
          .from('content_pillars')
          .update({ position: index })
          .eq('id', id)
          .eq('user_id', user.id),
      ),
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PUT /api/planner/pillars]', err)
    return NextResponse.json({ error: 'Failed to reorder pillars' }, { status: 500 })
  }
}
