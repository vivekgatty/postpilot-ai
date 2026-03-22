export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'
import { getLevelFromScore, getTierFromLevel } from '@/lib/auditConfig'
import type { AuditDimensionScore } from '@/types'

function extractLinkedInUsername(url: string): string | null {
  const match = url.match(/linkedin\.com\/in\/([^/?#\s]+)/i)
  return match ? match[1].replace(/\/$/, '') : null
}

export async function POST(req: NextRequest) {
  try {
    let body: {
      linkedin_url?: string
      full_name?: string
      profile_photo_url?: string
    }
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { linkedin_url, full_name, profile_photo_url } = body

    // Validate LinkedIn URL
    if (!linkedin_url || !linkedin_url.toLowerCase().includes('linkedin.com/in/')) {
      return NextResponse.json(
        { error: 'Please enter a valid LinkedIn profile URL (e.g. linkedin.com/in/yourname)' },
        { status: 400 },
      )
    }

    const username = extractLinkedInUsername(linkedin_url)
    if (!username) {
      return NextResponse.json(
        { error: 'Could not extract LinkedIn username from the URL provided.' },
        { status: 400 },
      )
    }

    const normalised = linkedin_url.toLowerCase().trim()

    const supabase = await createClient()

    // Check for existing unlocked audit for this URL
    const { data: existing } = await supabase
      .from('brand_audits')
      .select('*')
      .eq('linkedin_url', normalised)
      .eq('is_unlocked', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      const level = getLevelFromScore(existing.total_score)
      const tier  = getTierFromLevel(level.tier)
      const dimensionScores: AuditDimensionScore[] = Array.isArray(existing.scores) ? existing.scores : []
      const result = {
        id:                  existing.id,
        linkedin_url:        existing.linkedin_url,
        linkedin_username:   existing.linkedin_username,
        full_name:           existing.full_name,
        profile_photo_url:   existing.profile_photo_url,
        sample_post_content: existing.sample_post_content ?? null,
        total_score:         existing.total_score,
        tier_key:            level.tier,
        tier_label:          tier?.label ?? level.tier,
        level_name:          level.label,
        level_key:           level.key,
        dimension_scores:    dimensionScores,
        ai_top_actions:      Array.isArray(existing.ai_top_actions) ? existing.ai_top_actions : [],
        ai_content_quality:  existing.ai_content_quality ?? null,
        is_unlocked:         true,
        share_token:         existing.share_token,
        created_at:          existing.created_at,
      }
      return NextResponse.json({ exists: true, auditId: existing.id, result })
    }

    // Generate a unique share token
    const shareToken = randomBytes(20).toString('hex')

    // Insert new brand_audit row
    const { data: newAudit, error: insertErr } = await supabase
      .from('brand_audits')
      .insert({
        linkedin_url:       normalised,
        linkedin_username:  username,
        full_name:          full_name ?? null,
        profile_photo_url:  profile_photo_url ?? null,
        answers:            {},
        total_score:        0,
        is_unlocked:        false,
        share_token:        shareToken,
      })
      .select('id')
      .single()

    if (insertErr || !newAudit) {
      console.error('[audit/start]', insertErr)
      return NextResponse.json({ error: 'Failed to create audit session.' }, { status: 500 })
    }

    return NextResponse.json({ auditId: newAudit.id })
  } catch (err) {
    console.error('[audit/start]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
