export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { postToLinkedIn, refreshLinkedInToken } from '@/lib/linkedinPosting'
import type { LinkedInConnection } from '@/types'

// ── POST /api/linkedin/publish ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      plannedPostId?: string
      postId?:        string
      content:        string
      scheduledFor?:  string  // ISO datetime — if provided, queue instead of post now
    }

    const { plannedPostId, postId, content, scheduledFor } = body

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    // Fetch LinkedIn connection
    const { data: connection } = await supabase
      .from('linkedin_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!connection) {
      return NextResponse.json(
        { error: 'NOT_CONNECTED', message: 'Connect your LinkedIn to post directly' },
        { status: 403 },
      )
    }

    const conn = connection as LinkedInConnection

    // Check token validity
    const isValid = await refreshLinkedInToken(user.id, conn.token_expires_at)
    if (!isValid) {
      return NextResponse.json(
        { error: 'TOKEN_EXPIRED', message: 'LinkedIn connection expired. Reconnect.' },
        { status: 403 },
      )
    }

    // ── Scheduled / queued posting ─────────────────────────────────────────────
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor)
      if (scheduledDate > new Date()) {
        await supabase.from('linkedin_publish_queue').insert({
          user_id:         user.id,
          planned_post_id: plannedPostId ?? null,
          post_id:         postId        ?? null,
          content,
          scheduled_for:   scheduledFor,
          status:          'pending',
          attempts:        0,
        })

        if (plannedPostId) {
          await supabase
            .from('planned_posts')
            .update({ status: 'scheduled' })
            .eq('id', plannedPostId)
            .eq('user_id', user.id)
        }

        return NextResponse.json({ queued: true, scheduledFor })
      }
    }

    // ── Post now ───────────────────────────────────────────────────────────────
    const result = await postToLinkedIn(conn.access_token, conn.linkedin_urn, content)

    if (!result.success) {
      if (result.error === 'TOKEN_EXPIRED') {
        // Remove stale connection
        await supabase
          .from('linkedin_connections')
          .delete()
          .eq('user_id', user.id)

        return NextResponse.json(
          { error: 'TOKEN_EXPIRED', message: 'LinkedIn session expired. Please reconnect.' },
          { status: 403 },
        )
      }

      if (result.error === 'RATE_LIMITED') {
        return NextResponse.json(
          { error: 'RATE_LIMITED', message: 'LinkedIn rate limit reached. Try again in a few hours.' },
          { status: 429 },
        )
      }

      return NextResponse.json({ error: result.error }, { status: 502 })
    }

    // Update planned_post status
    if (plannedPostId) {
      await supabase
        .from('planned_posts')
        .update({
          status:             'published',
          linkedin_post_id:   result.linkedinPostId ?? null,
          linkedin_posted_at: new Date().toISOString(),
          linkedin_post_url:  result.postUrl ?? null,
        })
        .eq('id', plannedPostId)
        .eq('user_id', user.id)
    }

    // Update post status
    if (postId) {
      await supabase
        .from('posts')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', postId)
        .eq('user_id', user.id)
    }

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id:     user.id,
      action:      'linkedin_post',
      tokens_used: 0,
      metadata:    { plannedPostId, postId, linkedinPostId: result.linkedinPostId },
    })

    return NextResponse.json({ success: true, postUrl: result.postUrl })
  } catch (err) {
    console.error('[POST /api/linkedin/publish]', err)
    return NextResponse.json({ error: 'Failed to publish' }, { status: 500 })
  }
}
