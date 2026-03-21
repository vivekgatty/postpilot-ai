export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/planner/content-bank ────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const pillarId = searchParams.get('pillar_id')
    const isUsed   = searchParams.get('is_used')
    const source   = searchParams.get('source')

    let query = supabase
      .from('content_bank')
      .select(`*, pillar:content_pillars(*)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (pillarId) query = query.eq('pillar_id', pillarId)
    if (isUsed   !== null) query = query.eq('is_used', isUsed === 'true')
    if (source)  query = query.eq('source', source)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ items: data ?? [] })
  } catch (err) {
    console.error('[GET /api/planner/content-bank]', err)
    return NextResponse.json({ error: 'Failed to fetch content bank' }, { status: 500 })
  }
}

// ── POST /api/planner/content-bank ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      title:      string
      topic?:     string
      hook?:      string
      pillar_id?: string
      format?:    string
      source?:    'manual' | 'idea_lab' | 'hook_generator' | 'ai_suggestion'
    }

    if (!body.title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('content_bank')
      .insert({
        user_id:   user.id,
        title:     body.title,
        topic:     body.topic     ?? '',
        hook:      body.hook      ?? '',
        pillar_id: body.pillar_id ?? null,
        format:    body.format    ?? 'text',
        source:    body.source    ?? 'manual',
        is_used:   false,
      })
      .select(`*, pillar:content_pillars(*)`)
      .single()

    if (error) throw error

    return NextResponse.json({ item: data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/planner/content-bank]', err)
    return NextResponse.json({ error: 'Failed to add to content bank' }, { status: 500 })
  }
}
