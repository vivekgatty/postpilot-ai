export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runDeterministicChecks, mergeScores } from '@/lib/postScoring'
import { runAiAnalysis } from '@/lib/postAnalyser'
import { getGradeFromScore, ANALYSER_LIMITS } from '@/lib/analyserConfig'

// ── POST /api/analyse/run ─────────────────────────────────────────────────────

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

    // 3. Daily limit check
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { count: todayCount } = await supabase
      .from('post_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfDay.toISOString())

    const limit = ANALYSER_LIMITS[plan].per_day
    if (limit !== -1 && (todayCount ?? 0) >= limit) {
      return NextResponse.json(
        { error: 'DAILY_LIMIT', message: 'Upgrade for more analyses today' },
        { status: 403 }
      )
    }

    // 4. Parse body
    let body: {
      content?: unknown
      post_type?: unknown
      niche?: unknown
      source?: unknown
      post_id?: unknown
    }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const content = typeof body.content === 'string' ? body.content : ''
    if (content.length < 50)
      return NextResponse.json(
        { error: 'content must be at least 50 characters' },
        { status: 400 }
      )

    const post_type = typeof body.post_type === 'string' ? body.post_type : 'text'
    const niche = typeof body.niche === 'string' ? body.niche : (profile.niche ?? 'Other')
    const source = typeof body.source === 'string' ? body.source : 'standalone'
    const post_id = typeof body.post_id === 'string' ? body.post_id : null

    // 5. Deterministic checks
    const det = runDeterministicChecks(content, post_type)

    // 6. AI analysis
    const aiResult = await runAiAnalysis(content, post_type, niche, det, plan)

    // 7. Merge scores
    const dimensionScores = mergeScores(det, aiResult.aiScores, post_type)

    // 8. Calculate total
    const total = Object.values(dimensionScores).reduce((sum, d) => sum + d.score, 0)
    const gradeObj = getGradeFromScore(total)

    // 9. Insert post_analyses
    const { data: saved, error: insertErr } = await supabase
      .from('post_analyses')
      .insert({
        user_id: user.id,
        post_id: post_id,
        post_content: content,
        post_type,
        niche,
        overall_score: total,
        grade: gradeObj.grade,
        dimension_scores: dimensionScores,
        suggestions: aiResult.suggestions,
        hook_alternatives: aiResult.hook_alternatives,
        cta_alternatives: aiResult.cta_alternatives,
        timing_recommendation: aiResult.timing_recommendation,
        version: 1,
        source,
      })
      .select()
      .single()

    if (insertErr || !saved) {
      console.error('[POST /api/analyse/run] insert error', insertErr)
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 })
    }

    // 10. Usage log
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action: 'post_analysis',
      tokens_used: 0,
      metadata: { overall_score: total, grade: gradeObj.grade, source },
    })

    return NextResponse.json(saved)
  } catch (err) {
    console.error('[POST /api/analyse/run]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
