export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAngles } from '@/lib/repurposeAngles'
import type { PlanType } from '@/types'

// ── POST /api/repurpose/angles ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as { session_id: string; post_count: number; niche?: string }
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

    const { angles, is_generic } = await generateAngles(
      session.extracted_text ?? '',
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
    console.error('[POST /api/repurpose/angles]', err)
    return NextResponse.json({ error: 'Failed to generate angles' }, { status: 500 })
  }
}
