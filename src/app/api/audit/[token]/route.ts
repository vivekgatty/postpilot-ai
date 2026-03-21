export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLevelFromScore, getTierFromLevel } from '@/lib/auditConfig'
import type { AuditDimensionScore } from '@/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: audit, error } = await supabase
      .from('brand_audits')
      .select('id, linkedin_url, linkedin_username, full_name, profile_photo_url, total_score, scores, ai_top_actions, share_token, created_at')
      .eq('share_token', token)
      .eq('is_unlocked', true)
      .single()

    if (error || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    const level           = getLevelFromScore(audit.total_score)
    const tier            = getTierFromLevel(level.tier)
    const dimensionScores: AuditDimensionScore[] = Array.isArray(audit.scores) ? audit.scores : []

    // Public version — no email, no answers, no ai_content_quality detail
    const result = {
      id:               audit.id,
      linkedin_url:     audit.linkedin_url,
      linkedin_username: audit.linkedin_username,
      full_name:        audit.full_name,
      profile_photo_url: audit.profile_photo_url,
      sample_post_content: null,
      total_score:      audit.total_score,
      tier_key:         level.tier,
      tier_label:       tier?.label ?? level.tier,
      level_name:       level.label,
      level_key:        level.key,
      dimension_scores: dimensionScores,
      ai_top_actions:   Array.isArray(audit.ai_top_actions) ? audit.ai_top_actions : [],
      ai_content_quality: null,
      is_unlocked:      true,
      share_token:      audit.share_token,
      created_at:       audit.created_at,
    }

    return NextResponse.json({ result })
  } catch (err) {
    console.error('[audit/token]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
