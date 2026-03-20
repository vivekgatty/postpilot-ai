export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreatePostInput } from '@/types'

// ── GET /api/posts ────────────────────────────────────────────────────────────
// Query params: status, search, sort ('created_at DESC'), limit (20), offset (0)

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const status  = searchParams.get('status')                     // e.g. 'draft'
    const search  = searchParams.get('search')                     // full-text
    const sort    = searchParams.get('sort') ?? 'created_at DESC'  // 'field DIR'
    const limit   = Math.min(parseInt(searchParams.get('limit')  ?? '20', 10), 100)
    const offset  = Math.max(parseInt(searchParams.get('offset') ?? '0',  10), 0)

    // Parse sort → column + direction
    const parts     = sort.trim().split(/\s+/)
    const sortCol   = parts[0] ?? 'created_at'
    const ascending = (parts[1] ?? 'DESC').toUpperCase() !== 'DESC'

    // Build query — select with exact count for pagination
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    if (status) query = query.eq('status', status)
    if (search)  query = query.ilike('content', `%${search}%`)

    const { data, error, count } = await query
      .order(sortCol, { ascending })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({ posts: data ?? [], total: count ?? 0 })
  } catch (err) {
    console.error('[GET /api/posts]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// ── POST /api/posts ───────────────────────────────────────────────────────────
// Body: { content, tone, niche, topic_input, generation_index, status? }

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as CreatePostInput
    const {
      content,
      tone,
      niche,
      topic_input,
      generation_index,
      status = 'draft',
    } = body

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    if (!tone) {
      return NextResponse.json({ error: 'Tone is required' }, { status: 400 })
    }

    // Auto-derived fields
    const autoTitle          = content.length > 60
      ? content.slice(0, 60).trimEnd() + '…'
      : content
    const autoCharacterCount = content.length

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id:          user.id,
        content,
        tone,
        niche:            niche ?? null,
        topic_input:      topic_input ?? null,
        generation_index: generation_index ?? 0,
        status,
        title:            autoTitle,
        character_count:  autoCharacterCount,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ post: data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/posts]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
