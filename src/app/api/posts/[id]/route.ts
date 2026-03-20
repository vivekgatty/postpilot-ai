export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// ── GET /api/posts/[id] ───────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)   // ownership check
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ post: data })
  } catch (err) {
    console.error('[GET /api/posts/[id]]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

// ── PATCH /api/posts/[id] ─────────────────────────────────────────────────────
// Allowed fields: content, status, scheduled_for, is_favourite, title

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const raw = await req.json() as {
      content?:       string
      status?:        string
      scheduled_for?: string | null
      is_favourite?:  boolean
      title?:         string
    }

    // ── Whitelist the fields we accept ───────────────────────────────────────
    const updates: Record<string, unknown> = {}
    if (raw.content       !== undefined) {
      updates.content         = raw.content
      updates.character_count = raw.content.length
      // Auto-refresh title when content changes (unless caller also sent title)
      if (raw.title === undefined) {
        updates.title = raw.content.length > 60
          ? raw.content.slice(0, 60).trimEnd() + '…'
          : raw.content
      }
    }
    if (raw.title         !== undefined) updates.title         = raw.title
    if (raw.is_favourite  !== undefined) updates.is_favourite  = raw.is_favourite
    if (raw.status        !== undefined) updates.status        = raw.status
    if (raw.scheduled_for !== undefined) updates.scheduled_for = raw.scheduled_for

    // ── Validate scheduled_for when setting status to 'scheduled' ────────────
    if (updates.status === 'scheduled') {
      const sf = updates.scheduled_for
      if (!sf || typeof sf !== 'string') {
        return NextResponse.json(
          { error: 'scheduled_for is required when status is "scheduled"' },
          { status: 400 }
        )
      }
      if (new Date(sf) <= new Date()) {
        return NextResponse.json(
          { error: 'scheduled_for must be a future timestamp' },
          { status: 400 }
        )
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('posts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)   // ownership check
      .select()
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    return NextResponse.json({ post: data })
  } catch (err) {
    console.error('[PATCH /api/posts/[id]]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

// ── DELETE /api/posts/[id] ────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)   // ownership check

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/posts/[id]]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
