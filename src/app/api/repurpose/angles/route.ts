export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAngles } from '@/lib/repurposeAngles'
import { handleAnthropicError } from '@/lib/handleAnthropicError'
import type { PlanType } from '@/types'

// ── POST /api/repurpose/angles ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: { session_id: string; post_count: number; niche?: string; extracted_text?: string }
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const { session_id, post_count } = body

    if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

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

    // Get plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, niche')
      .eq('id', user.id)
      .single()

    const plan   = (profile?.plan ?? 'free') as PlanType
    const isPaid = plan !== 'free'
    const niche  = body.niche ?? profile?.niche ?? 'Other'

    // Persist user-edited text if provided
    const extractedText = body.extracted_text ?? session.extracted_text ?? ''
    if (body.extracted_text && body.extracted_text !== session.extracted_text) {
      await supabase
        .from('repurpose_sessions')
        .update({ extracted_text: body.extracted_text })
        .eq('id', session_id)
    }

    const { angles, is_generic } = await generateAngles(
      extractedText,
      session.source_title   ?? '',
      session.source_author  ?? '',
      niche,
      post_count ?? 5,
      isPaid,
    )

    // Update session with extracted topics
    await supabase
      .from('repurpose_sessions')
      .update({ extracted_topics: angles.map(a => a.title) })
      .eq('id', session_id)

    return NextResponse.json({ angles, is_generic })
  } catch (err) {
    const anthropicRes = handleAnthropicError(err)
    if (anthropicRes) return anthropicRes
    console.error('[POST /api/repurpose/angles]', err)
    return NextResponse.json({ error: 'Failed to generate angles' }, { status: 500 })
  }
}
