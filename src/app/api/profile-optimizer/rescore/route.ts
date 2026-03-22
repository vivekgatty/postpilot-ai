export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRescoredDimension } from '@/lib/profileAnalyzer'
import type { ProfileInputData, ProfileAuditDimension } from '@/types'

// ── POST /api/profile-optimizer/rescore ──────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: {
      audit_id?: unknown
      recommendation_id?: unknown
      dimension_id?: unknown
      updated_text?: unknown
    }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { audit_id, recommendation_id, dimension_id, updated_text } = body

    if (typeof audit_id !== 'string' || !audit_id)
      return NextResponse.json({ error: 'audit_id is required' }, { status: 400 })
    if (typeof recommendation_id !== 'string' || !recommendation_id)
      return NextResponse.json({ error: 'recommendation_id is required' }, { status: 400 })
    if (typeof dimension_id !== 'string' || !dimension_id)
      return NextResponse.json({ error: 'dimension_id is required' }, { status: 400 })
    if (typeof updated_text !== 'string' || !updated_text)
      return NextResponse.json({ error: 'updated_text is required' }, { status: 400 })

    // Fetch audit with ownership check
    const { data: audit, error: fetchErr } = await supabase
      .from('profile_audits')
      .select('*')
      .eq('id', audit_id)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !audit)
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })

    const profileData = audit.profile_data as ProfileInputData
    const targetKeywords = (audit.target_keywords ?? []) as string[]

    // Call AI rescoring
    const result = await generateRescoredDimension(
      dimension_id,
      updated_text,
      profileData,
      targetKeywords
    )

    // Update dimension scores
    const dimensionScores = (audit.dimension_scores ?? {}) as Record<string, ProfileAuditDimension>
    if (dimensionScores[dimension_id]) {
      dimensionScores[dimension_id].score = result.new_score
      const max = dimensionScores[dimension_id].max_score
      dimensionScores[dimension_id].percentage = Math.round((result.new_score / max) * 100)
    }

    // Recalculate total score
    const newTotalScore = Object.values(dimensionScores).reduce((sum, d) => sum + d.score, 0)

    // Update completed_recommendations
    const completed = (audit.completed_recommendations ?? []) as string[]
    if (!completed.includes(recommendation_id)) {
      completed.push(recommendation_id)
    }

    // Patch the audit row
    const { error: patchErr } = await supabase
      .from('profile_audits')
      .update({
        dimension_scores: dimensionScores,
        total_score: newTotalScore,
        completed_recommendations: completed,
        projected_score: newTotalScore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', audit_id)
      .eq('user_id', user.id)

    if (patchErr) throw patchErr

    // Insert new history row
    await supabase.from('profile_audit_history').insert({
      user_id: user.id,
      audit_id: audit_id,
      total_score: newTotalScore,
      dimension_scores: Object.fromEntries(
        Object.entries(dimensionScores).map(([k, v]) => [k, v.score])
      ),
      completed_count: completed.length,
    })

    return NextResponse.json({
      new_dimension_score: result.new_score,
      feedback: result.feedback,
      new_total_score: newTotalScore,
      new_projected_score: newTotalScore,
    })
  } catch (err) {
    console.error('[POST /api/profile-optimizer/rescore]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
