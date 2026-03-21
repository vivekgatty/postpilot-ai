export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/hooks/saved ──────────────────────────────────────────────────────
// Returns all saved hooks for the authenticated user, newest first.

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('saved_hooks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ savedHooks: data ?? [] })
  } catch (err) {
    console.error('[GET /api/hooks/saved]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to load saved hooks' }, { status: 500 })
  }
}

// ── POST /api/hooks/saved ─────────────────────────────────────────────────────
// Saves a single hook. Body: { content, style_id, style_label, idea_input, niche }

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: {
      content?:     unknown
      style_id?:    unknown
      style_label?: unknown
      idea_input?:  unknown
      niche?:       unknown
    }
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { content, style_id, style_label, idea_input, niche } = body

    if (typeof content     !== 'string' || content.trim().length === 0)
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    if (typeof style_id    !== 'string' || style_id.trim().length === 0)
      return NextResponse.json({ error: 'style_id is required' }, { status: 400 })
    if (typeof style_label !== 'string' || style_label.trim().length === 0)
      return NextResponse.json({ error: 'style_label is required' }, { status: 400 })
    if (typeof idea_input  !== 'string' || idea_input.trim().length === 0)
      return NextResponse.json({ error: 'idea_input is required' }, { status: 400 })
    if (typeof niche       !== 'string' || niche.trim().length === 0)
      return NextResponse.json({ error: 'niche is required' }, { status: 400 })

    // Cap per user at 200 saved hooks
    const { count } = await supabase
      .from('saved_hooks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= 200)
      return NextResponse.json(
        { error: 'Saved hooks limit reached (200). Delete some to save more.' },
        { status: 429 }
      )

    const { data, error } = await supabase
      .from('saved_hooks')
      .insert({
        user_id:     user.id,
        content:     content.trim(),
        style_id:    style_id.trim(),
        style_label: style_label.trim(),
        idea_input:  idea_input.trim(),
        niche:       niche.trim(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ savedHook: data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/hooks/saved]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to save hook' }, { status: 500 })
  }
}
