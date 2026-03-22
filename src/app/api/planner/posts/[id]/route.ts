export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── PATCH /api/planner/posts/[id] ────────────────────────────────────────────

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

    const allowed = [
      'title', 'topic', 'hook_suggestion', 'format', 'planned_date', 'planned_time',
      'status', 'pillar_id', 'tone_id', 'post_id', 'is_recurring', 'recurring_pattern',
      'linkedin_post_id', 'linkedin_posted_at', 'linkedin_post_url',
    ]
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    const { data, error } = await supabase
      .from('planned_posts')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select(`*, pillar:content_pillars(*)`)
      .single()

    if (error) throw error

    return NextResponse.json({ post: data })
  } catch (err) {
    console.error('[PATCH /api/planner/posts/[id]]', err)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

// ── DELETE /api/planner/posts/[id] ───────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Cancel any pending queue items first
    await supabase
      .from('linkedin_publish_queue')
      .update({ status: 'cancelled' })
      .eq('planned_post_id', params.id)
      .eq('status', 'pending')

    const { error } = await supabase
      .from('planned_posts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/planner/posts/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
