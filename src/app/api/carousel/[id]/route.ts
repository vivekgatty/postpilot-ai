export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// ── GET /api/carousel/[id] ────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('carousels')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Carousel not found' }, { status: 404 })
    }

    return NextResponse.json({ carousel: data })
  } catch (err) {
    console.error('[GET /api/carousel/[id]]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to fetch carousel' }, { status: 500 })
  }
}

// ── PATCH /api/carousel/[id] ──────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const raw = await req.json() as Record<string, unknown>

    const allowed = [
      'title', 'slides', 'theme_id', 'aspect_ratio', 'accent_color',
      'show_slide_numbers', 'show_author_handle', 'show_branding',
      'font_style', 'status',
    ]

    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (raw[key] !== undefined) updates[key] = raw[key]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('carousels')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Carousel not found' }, { status: 404 })

    return NextResponse.json({ carousel: data })
  } catch (err) {
    console.error('[PATCH /api/carousel/[id]]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to update carousel' }, { status: 500 })
  }
}

// ── DELETE /api/carousel/[id] ─────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('carousels')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/carousel/[id]]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to delete carousel' }, { status: 500 })
  }
}
