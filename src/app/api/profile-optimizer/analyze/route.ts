export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scoreProfile, calculateTotalScore } from '@/lib/profileScoring'
import { generateRecommendations, generateCompetitiveAnalysis } from '@/lib/profileAnalyzer'
import { handleAnthropicError } from '@/lib/handleAnthropicError'
import { OPTIMIZER_LIMITS, getTierFromScore } from '@/lib/profileOptimizerConfig'
import type { ProfileInputData } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('plan, niche, full_name')
      .eq('id', user.id)
      .single()

    if (profileErr || !profile)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const plan = (profile.plan ?? 'free') as keyof typeof OPTIMIZER_LIMITS

    // 3. Monthly audit limit check
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: auditCount } = await supabase
      .from('profile_audits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    const limit = OPTIMIZER_LIMITS[plan].audits_per_month
    if (limit !== -1 && (auditCount ?? 0) >= limit) {
      return NextResponse.json(
        { error: 'MONTHLY_LIMIT', message: 'Upgrade to run more profile audits' },
        { status: 403 }
      )
    }

    // 4. Parse body
    let body: {
      goal?: unknown
      target_audience?: unknown
      target_keywords?: unknown
      profile_data?: unknown
    }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { goal, target_audience, target_keywords, profile_data } = body

    if (typeof goal !== 'string' || goal.trim().length === 0)
      return NextResponse.json({ error: 'goal is required' }, { status: 400 })

    if (
      !Array.isArray(target_keywords) ||
      target_keywords.length !== 5 ||
      !target_keywords.every(k => typeof k === 'string')
    )
      return NextResponse.json(
        { error: 'target_keywords must be an array of exactly 5 strings' },
        { status: 400 }
      )

    if (!profile_data || typeof profile_data !== 'object')
      return NextResponse.json({ error: 'profile_data is required' }, { status: 400 })

    const profileInput = profile_data as ProfileInputData
    const keywords = target_keywords as string[]
    const targetAudience = typeof target_audience === 'string' ? target_audience : ''

    // 5. Deterministic scoring
    const dimensionScores = scoreProfile(profileInput, keywords)
    const totalScore = calculateTotalScore(dimensionScores)
    const tier = getTierFromScore(totalScore)

    // 6. AI recommendations
    const aiResult = await generateRecommendations(
      profileInput,
      dimensionScores,
      keywords,
      goal,
      targetAudience,
      (profile.niche as string) || 'Other',
      plan
    )

    // 7. Merge recommendations into dimension scores
    for (const rec of aiResult.recommendations) {
      const dim = dimensionScores[rec.dimension_id]
      if (dim) {
        dim.recommendations.push(rec)
      }
    }

    // 8. Competitive analysis for Pro/Agency
    let competitiveAnalysis = null
    if (plan === 'pro' || plan === 'agency') {
      competitiveAnalysis = await generateCompetitiveAnalysis(
        (profile.niche as string) || 'Other',
        goal,
        dimensionScores,
        totalScore
      )
    }

    // 9. Insert profile_audits
    const { data: saved, error: insertErr } = await supabase
      .from('profile_audits')
      .insert({
        user_id: user.id,
        goal,
        target_audience: targetAudience,
        target_keywords: keywords,
        profile_data: profileInput,
        dimension_scores: dimensionScores,
        total_score: totalScore,
        tier: tier.tier,
        recommendations: aiResult.recommendations,
        keyword_recommendations: aiResult.keyword_recommendations,
        competitive_analysis: competitiveAnalysis,
        rewritten_headline: aiResult.rewritten_headline,
        rewritten_about: aiResult.rewritten_about,
        rewritten_experiences: aiResult.rewritten_experiences,
        completed_recommendations: [],
        projected_score: totalScore,
        status: 'complete',
        version: 1,
      })
      .select()
      .single()

    if (insertErr || !saved) {
      console.error('[POST /api/profile-optimizer/analyze] insert error', insertErr)
      return NextResponse.json({ error: 'Failed to save audit' }, { status: 500 })
    }

    // 10. Insert profile_audit_history
    await supabase.from('profile_audit_history').insert({
      user_id: user.id,
      audit_id: saved.id,
      total_score: totalScore,
      dimension_scores: Object.fromEntries(
        Object.entries(dimensionScores).map(([k, v]) => [k, v.score])
      ),
      completed_count: 0,
    })

    // 11. Usage log
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action: 'profile_audit',
      tokens_used: 0,
      metadata: { total_score: totalScore, tier: tier.tier },
    })

    return NextResponse.json(saved)
  } catch (err) {
    const anthropicRes = handleAnthropicError(err)
    if (anthropicRes) return anthropicRes
    console.error('[POST /api/profile-optimizer/analyze]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
