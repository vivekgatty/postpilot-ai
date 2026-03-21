export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { postToLinkedIn, refreshLinkedInToken } from '@/lib/linkedinPosting'
import type { LinkedInConnection, PublishQueueItem } from '@/types'

// ── POST /api/planner/process-queue ──────────────────────────────────────────
// Processes pending publish queue items for the currently authenticated user.
// Called client-side on planner page load — replaces the Vercel cron job,
// which requires a Pro plan for sub-daily frequency.

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date().toISOString()

    const { data: queueItems } = await supabase
      .from('linkedin_publish_queue')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .lt('attempts', 3)
      .limit(5)

    const items = (queueItems ?? []) as PublishQueueItem[]
    let processed = 0

    for (const item of items) {
      try {
        await supabase
          .from('linkedin_publish_queue')
          .update({ status: 'processing' })
          .eq('id', item.id)

        const { data: connection } = await supabase
          .from('linkedin_connections')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (!connection) {
          await supabase
            .from('linkedin_publish_queue')
            .update({ status: 'failed', error_message: 'LinkedIn not connected', attempts: item.attempts + 1 })
            .eq('id', item.id)
          continue
        }

        const conn    = connection as LinkedInConnection
        const isValid = await refreshLinkedInToken(user.id, conn.token_expires_at)

        if (!isValid) {
          await supabase
            .from('linkedin_publish_queue')
            .update({ status: 'failed', error_message: 'Token expired', attempts: item.attempts + 1 })
            .eq('id', item.id)
          continue
        }

        const result = await postToLinkedIn(conn.access_token, conn.linkedin_urn, item.content)

        if (result.success) {
          await supabase
            .from('linkedin_publish_queue')
            .update({ status: 'published', linkedin_post_id: result.linkedinPostId ?? null, linkedin_post_url: result.postUrl ?? null })
            .eq('id', item.id)

          if (item.planned_post_id) {
            await supabase
              .from('planned_posts')
              .update({ status: 'published', linkedin_post_id: result.linkedinPostId ?? null, linkedin_posted_at: new Date().toISOString(), linkedin_post_url: result.postUrl ?? null })
              .eq('id', item.planned_post_id)
          }
          if (item.post_id) {
            await supabase
              .from('posts')
              .update({ status: 'published', published_at: new Date().toISOString() })
              .eq('id', item.post_id)
          }
          processed++
        } else {
          const newAttempts = item.attempts + 1
          await supabase
            .from('linkedin_publish_queue')
            .update({ status: newAttempts >= 3 ? 'failed' : 'pending', error_message: result.error ?? null, attempts: newAttempts, last_attempted_at: new Date().toISOString() })
            .eq('id', item.id)
        }
      } catch (err) {
        await supabase
          .from('linkedin_publish_queue')
          .update({ status: item.attempts + 1 >= 3 ? 'failed' : 'pending', error_message: err instanceof Error ? err.message : 'Unknown error', attempts: item.attempts + 1, last_attempted_at: new Date().toISOString() })
          .eq('id', item.id)
      }
    }

    return NextResponse.json({ processed, total: items.length })
  } catch (err) {
    console.error('[POST /api/planner/process-queue]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
