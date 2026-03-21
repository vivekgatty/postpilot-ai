export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { postToLinkedIn, refreshLinkedInToken } from '@/lib/linkedinPosting'
import type { LinkedInConnection, PublishQueueItem } from '@/types'

// ── GET /api/cron/linkedin-publisher ─────────────────────────────────────────
// Vercel cron job — runs every 5 minutes.
// Fires pending queue items whose scheduled_for <= now().

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const now      = new Date().toISOString()

  // Fetch up to 10 pending items due to run
  const { data: queueItems, error: fetchErr } = await supabase
    .from('linkedin_publish_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .lt('attempts', 3)
    .limit(10)

  if (fetchErr) {
    console.error('[cron/linkedin-publisher] fetch error', fetchErr)
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 })
  }

  const items = (queueItems ?? []) as PublishQueueItem[]
  let processed = 0
  let failed    = 0

  for (const item of items) {
    try {
      // Mark as processing
      await supabase
        .from('linkedin_publish_queue')
        .update({ status: 'processing' })
        .eq('id', item.id)

      // Fetch LinkedIn connection
      const { data: connection } = await supabase
        .from('linkedin_connections')
        .select('*')
        .eq('user_id', item.user_id)
        .single()

      if (!connection) {
        await supabase
          .from('linkedin_publish_queue')
          .update({ status: 'failed', error_message: 'LinkedIn not connected', attempts: item.attempts + 1 })
          .eq('id', item.id)
        failed++
        continue
      }

      const conn     = connection as LinkedInConnection
      const isValid  = await refreshLinkedInToken(item.user_id, conn.token_expires_at)

      if (!isValid) {
        await supabase
          .from('linkedin_publish_queue')
          .update({ status: 'failed', error_message: 'LinkedIn token expired', attempts: item.attempts + 1 })
          .eq('id', item.id)
        failed++
        continue
      }

      const result = await postToLinkedIn(conn.access_token, conn.linkedin_urn, item.content)

      if (result.success) {
        // Update queue
        await supabase
          .from('linkedin_publish_queue')
          .update({
            status:           'published',
            linkedin_post_id: result.linkedinPostId ?? null,
            linkedin_post_url: result.postUrl       ?? null,
          })
          .eq('id', item.id)

        // Update planned_post
        if (item.planned_post_id) {
          await supabase
            .from('planned_posts')
            .update({
              status:             'published',
              linkedin_post_id:   result.linkedinPostId ?? null,
              linkedin_posted_at: new Date().toISOString(),
              linkedin_post_url:  result.postUrl        ?? null,
            })
            .eq('id', item.planned_post_id)
        }

        // Update post if linked
        if (item.post_id) {
          await supabase
            .from('posts')
            .update({ status: 'published', published_at: new Date().toISOString() })
            .eq('id', item.post_id)
        }

        processed++
      } else {
        const newAttempts = item.attempts + 1
        const newStatus   = newAttempts >= 3 ? 'failed' : 'pending'

        await supabase
          .from('linkedin_publish_queue')
          .update({
            status:              newStatus,
            error_message:       result.error ?? 'Unknown error',
            attempts:            newAttempts,
            last_attempted_at:   new Date().toISOString(),
          })
          .eq('id', item.id)

        failed++
      }
    } catch (err) {
      console.error('[cron/linkedin-publisher] error processing item', item.id, err)
      await supabase
        .from('linkedin_publish_queue')
        .update({
          status:            item.attempts + 1 >= 3 ? 'failed' : 'pending',
          error_message:     err instanceof Error ? err.message : 'Unknown error',
          attempts:          item.attempts + 1,
          last_attempted_at: new Date().toISOString(),
        })
        .eq('id', item.id)
      failed++
    }
  }

  return NextResponse.json({ processed, failed, total: items.length })
}
