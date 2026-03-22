export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { RepurposedPost } from '@/types'

// ── POST /api/repurpose/save ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      session_id: string
      posts:      RepurposedPost[]
      save_all?:  boolean
    }

    const { session_id, posts } = body
    if (!session_id || !posts?.length) {
      return NextResponse.json({ error: 'session_id and posts required' }, { status: 400 })
    }

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('repurpose_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get user profile for niche
    const { data: profile } = await supabase
      .from('profiles')
      .select('niche')
      .eq('id', user.id)
      .single()

    const niche = session.settings?.niche ?? profile?.niche ?? 'Other'
    const tone  = session.settings?.tone_id ?? 'professional'

    const inserts = posts.map((post, index) => ({
      user_id:              user.id,
      content:              post.content,
      title:                (post.angle_title ?? '').slice(0, 100) || null,
      tone,
      niche,
      topic_input:          session.source_title ?? null,
      status:               'draft' as const,
      character_count:      post.character_count,
      generation_index:     index + 1,
      is_favourite:         false,
      repurpose_session_id: session_id,
      is_repurposed:        true,
      repurpose_angle:      post.angle_title ?? null,
      source_url:           session.source_url ?? null,
      source_title:         session.source_title ?? null,
    }))

    const { data: savedPosts, error: insertError } = await supabase
      .from('posts')
      .insert(inserts)
      .select('id')

    if (insertError) throw insertError

    const savedCount = savedPosts?.length ?? 0
    const postIds    = (savedPosts ?? []).map(p => p.id)

    // Update session posts_saved
    await supabase
      .from('repurpose_sessions')
      .update({ posts_saved: (session.posts_saved ?? 0) + savedCount })
      .eq('id', session_id)

    return NextResponse.json({ saved_count: savedCount, post_ids: postIds })
  } catch (err) {
    console.error('[POST /api/repurpose/save]', err)
    return NextResponse.json({ error: 'Failed to save posts' }, { status: 500 })
  }
}
