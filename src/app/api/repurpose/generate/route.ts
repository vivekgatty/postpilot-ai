export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRepurposedPosts } from '@/lib/repurposeGenerator'
import { handleAnthropicError } from '@/lib/handleAnthropicError'
import { REPURPOSE_LIMITS } from '@/lib/repurposeConfig'
import type { PlanType, RepurposeAngle, RepurposeSettings } from '@/types'

// ── POST /api/repurpose/generate ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: {
      session_id: string
      angles:     RepurposeAngle[]
      settings:   RepurposeSettings
    }
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { session_id, angles, settings } = body
    if (!session_id || !angles?.length) {
      return NextResponse.json({ error: 'session_id and angles required' }, { status: 400 })
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

    if (!['extracted', 'complete'].includes(session.status)) {
      return NextResponse.json({ error: 'Session is not in extracted state' }, { status: 400 })
    }

    // Validate post count against plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, full_name, niche')
      .eq('id', user.id)
      .single()

    const plan   = (profile?.plan ?? 'free') as PlanType
    const limits = REPURPOSE_LIMITS[plan]
    const postCount = Math.min(angles.length, limits.posts_per_session)
    const selectedAngles = angles.slice(0, postCount)

    // Update session status to generating
    await supabase
      .from('repurpose_sessions')
      .update({ status: 'generating' })
      .eq('id', session_id)

    // Merge niche from profile if not set
    const mergedSettings: RepurposeSettings = {
      ...settings,
      niche: settings.niche || profile?.niche || 'Other',
    }

    const posts = await generateRepurposedPosts(
      session.extracted_text   ?? '',
      session.source_title     ?? '',
      session.source_author    ?? '',
      selectedAngles,
      mergedSettings,
      profile?.full_name ?? undefined,
    )

    // Update session to complete
    await supabase
      .from('repurpose_sessions')
      .update({
        status:          'complete',
        posts_generated: posts.length,
        settings:        mergedSettings,
      })
      .eq('id', session_id)

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id:     user.id,
      action:      'repurpose_generate',
      tokens_used: 0,
      metadata:    { session_id, post_count: posts.length },
    })

    return NextResponse.json({ posts, session_id })
  } catch (err) {
    const anthropicRes = handleAnthropicError(err)
    if (anthropicRes) return anthropicRes
    console.error('[POST /api/repurpose/generate]', err)
    return NextResponse.json({ error: 'Failed to generate posts' }, { status: 500 })
  }
}
