export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/repurpose/sessions/[id] ─────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: session, error } = await supabase
      .from('repurpose_sessions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Fetch associated posts
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('repurpose_session_id', params.id)
      .eq('user_id', user.id)
      .order('generation_index', { ascending: true })

    return NextResponse.json({ session, posts: posts ?? [] })
  } catch (err) {
    console.error('[GET /api/repurpose/sessions/[id]]', err)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}

// ── DELETE /api/repurpose/sessions/[id] ──────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify ownership
    const { data: session } = await supabase
      .from('repurpose_sessions')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const { error } = await supabase
      .from('repurpose_sessions')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/repurpose/sessions/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}
