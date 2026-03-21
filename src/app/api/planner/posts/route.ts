export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/planner/posts ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const month    = searchParams.get('month')     // YYYY-MM
    const status   = searchParams.get('status')
    const pillarId = searchParams.get('pillar_id')

    let query = supabase
      .from('planned_posts')
      .select(`*, pillar:content_pillars(*)`)
      .eq('user_id', user.id)
      .order('planned_date', { ascending: true })

    if (month) {
      query = query
        .gte('planned_date', `${month}-01`)
        .lte('planned_date', `${month}-31`)
    }
    if (status)   query = query.eq('status', status)
    if (pillarId) query = query.eq('pillar_id', pillarId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ posts: data ?? [] })
  } catch (err) {
    console.error('[GET /api/planner/posts]', err)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// ── POST /api/planner/posts ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      pillar_id?:     string
      title:          string
      topic:          string
      format:         'text' | 'carousel' | 'poll' | 'question'
      planned_date:   string
      planned_time?:  string
      tone_id?:       string
      hook_suggestion?: string
      why_this_week?:   string
    }

    if (!body.title || !body.planned_date) {
      return NextResponse.json({ error: 'title and planned_date are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('planned_posts')
      .insert({
        user_id:         user.id,
        pillar_id:       body.pillar_id       ?? null,
        post_id:         null,
        title:           body.title,
        topic:           body.topic           ?? '',
        hook_suggestion: body.hook_suggestion ?? '',
        format:          body.format          ?? 'text',
        tone_id:         body.tone_id         ?? 'professional',
        why_this_week:   body.why_this_week   ?? '',
        planned_date:    body.planned_date,
        planned_time:    body.planned_time    ?? '08:00',
        status:          'idea',
      })
      .select(`*, pillar:content_pillars(*)`)
      .single()

    if (error) throw error

    return NextResponse.json({ post: data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/planner/posts]', err)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
