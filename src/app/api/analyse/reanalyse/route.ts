export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runDeterministicChecks, mergeScores } from '@/lib/postScoring'
import { runAiAnalysis } from '@/lib/postAnalyser'
import { handleAnthropicError } from '@/lib/handleAnthropicError'
import { getGradeFromScore, ANALYSER_LIMITS } from '@/lib/analyserConfig'

// ── POST /api/analyse/reanalyse ───────────────────────────────────────────────

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
    if (!ANALYSER_LIMITS[plan].reanalyse) {
      return NextResponse.json(
        { error: 'PLAN_REQUIRED', message: 'Re-analysis available on Starter plan' },
        { status: 403 }
      )
    }

    // 4. Parse body
    let body: { analysis_id?: unknown; improved_content?: unknown }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const analysis_id = typeof body.analysis_id === 'string' ? body.analysis_id : ''
    const improved_content = typeof body.improved_content === 'string' ? body.improved_content : ''

    if (!analysis_id)
      return NextResponse.json({ error: 'analysis_id is required' }, { status: 400 })
    if (improved_content.length < 50)
      return NextResponse.json(
        { error: 'improved_content must be at least 50 characters' },
        { status: 400 }
      )

    // 5. Fetch original analysis and verify ownership
    const { data: original, error: fetchErr } = await supabase
      .from('post_analyses')
      .select('*')
      .eq('id', analysis_id)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !original)
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })

    const post_type = (original.post_type as string) ?? 'text'
    const niche = (original.niche as string) ?? (profile.niche ?? 'Other')

    // 6. Run full analysis on improved content
    const det = runDeterministicChecks(improved_content, post_type)
    const aiResult = await runAiAnalysis(improved_content, post_type, niche, det, plan)
    const dimensionScores = mergeScores(det, aiResult.aiScores, post_type)
    const total = Object.values(dimensionScores).reduce((sum, d) => sum + d.score, 0)
    const gradeObj = getGradeFromScore(total)

    // 7. Update original with improved scores
    await supabase
      .from('post_analyses')
      .update({ improved_content, improved_score: total })
      .eq('id', analysis_id)
      .eq('user_id', user.id)

    // 8. Insert new version row
    const { data: newAnalysis, error: insertErr } = await supabase
      .from('post_analyses')
      .insert({
        user_id: user.id,
        post_id: original.post_id ?? null,
        post_content: improved_content,
        post_type,
        niche,
        overall_score: total,
        grade: gradeObj.grade,
        dimension_scores: dimensionScores,
        suggestions: aiResult.suggestions,
        hook_alternatives: aiResult.hook_alternatives,
        cta_alternatives: aiResult.cta_alternatives,
        timing_recommendation: aiResult.timing_recommendation,
        version: ((original.version as number) ?? 1) + 1,
        source: 'standalone',
      })
      .select()
      .single()

    if (insertErr || !newAnalysis) {
      console.error('[POST /api/analyse/reanalyse] insert error', insertErr)
      return NextResponse.json({ error: 'Failed to save re-analysis' }, { status: 500 })
    }

    // 9. Usage log
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action: 'post_analysis',
      tokens_used: 0,
      metadata: { overall_score: total, grade: gradeObj.grade, source: 'reanalyse' },
    })

    return NextResponse.json(newAnalysis)
  } catch (err) {
    const anthropicRes = handleAnthropicError(err)
    if (anthropicRes) return anthropicRes
    console.error('[POST /api/analyse/reanalyse]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
