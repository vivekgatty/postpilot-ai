export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runBulkAnalysis } from '@/lib/postAnalyser'
import { ANALYSER_LIMITS } from '@/lib/analyserConfig'

// ── POST /api/analyse/bulk ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('plan, niche')
      .eq('id', user.id)
      .single()

    if (profileErr || !profile)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const plan = (profile.plan ?? 'free') as keyof typeof ANALYSER_LIMITS

    // 3. Plan gate
    if (!ANALYSER_LIMITS[plan].bulk) {
      return NextResponse.json(
        { error: 'PLAN_REQUIRED', message: 'Bulk analysis available on Pro plan' },
        { status: 403 }
      )
    }

    // 4. Parse body
    let body: { posts?: unknown; post_type?: unknown; niche?: unknown }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (!Array.isArray(body.posts) || body.posts.length < 2 || body.posts.length > 5)
      return NextResponse.json(
        { error: 'posts must be an array of 2-5 items' },
        { status: 400 }
      )

    const posts = body.posts as unknown[]
    if (!posts.every(p => typeof p === 'string' && (p as string).length >= 50))
      return NextResponse.json(
        { error: 'Each post must be a string of at least 50 characters' },
        { status: 400 }
      )

    const postContents = posts as string[]
    const post_type = typeof body.post_type === 'string' ? body.post_type : 'text'
    const niche = typeof body.niche === 'string' ? body.niche : (profile.niche ?? 'Other')

    // 5. Run bulk analysis
    const result = await runBulkAnalysis(postContents, post_type, niche)

    // 6. Insert bulk_analyse_sessions
    const { data: session, error: sessionErr } = await supabase
      .from('bulk_analyse_sessions')
      .insert({
        user_id: user.id,
        posts: result.posts,
        winner_index: result.winner_index,
      })
      .select()
      .single()

    if (sessionErr || !session) {
      console.error('[POST /api/analyse/bulk] session insert error', sessionErr)
      return NextResponse.json({ error: 'Failed to save bulk session' }, { status: 500 })
    }

    // 7. Insert individual post_analyses
    const analysisRows = postContents.map((content, i) => ({
      user_id: user.id,
      post_content: content,
      post_type,
      niche,
      overall_score: result.posts[i].score,
      grade: result.posts[i].grade,
      source: 'bulk',
      bulk_session_id: session.id,
      dimension_scores: {},
      suggestions: [],
      hook_alternatives: [],
      cta_alternatives: [],
      timing_recommendation: null,
      version: 1,
    }))

    await supabase.from('post_analyses').insert(analysisRows)

    // 8. Usage log
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action: 'bulk_analysis',
      tokens_used: 0,
      metadata: { post_count: postContents.length, winner_index: result.winner_index },
    })

    return NextResponse.json({
      session_id: session.id,
      posts: result.posts,
      winner_index: result.winner_index,
    })
  } catch (err) {
    console.error('[POST /api/analyse/bulk]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
