export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ProfileInputData } from '@/types'

// ── POST /api/profile-optimizer/save-draft ────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: {
      profile_data?: unknown
      goal?: unknown
      target_audience?: unknown
      target_keywords?: unknown
    }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { profile_data, goal, target_audience, target_keywords } = body

    if (!profile_data || typeof profile_data !== 'object')
      return NextResponse.json({ error: 'profile_data is required' }, { status: 400 })

    const draftPayload = {
      profile_data: profile_data as ProfileInputData,
      goal: typeof goal === 'string' ? goal : '',
      target_audience: typeof target_audience === 'string' ? target_audience : '',
      target_keywords: Array.isArray(target_keywords) ? target_keywords : [],
    }

    // Check for existing draft
    const { data: existing } = await supabase
      .from('profile_audits')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existing?.id) {
      // Update existing draft
      const { data: updated, error: patchErr } = await supabase
        .from('profile_audits')
        .update({
          ...draftPayload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .eq('user_id', user.id)
        .select('id')
        .single()

      if (patchErr) throw patchErr

      return NextResponse.json({ audit_id: updated?.id ?? existing.id })
    }

    // Insert new draft
    const { data: inserted, error: insertErr } = await supabase
      .from('profile_audits')
      .insert({
        user_id: user.id,
        ...draftPayload,
        dimension_scores: {},
        total_score: 0,
        tier: '',
        recommendations: [],
        keyword_recommendations: [],
        rewritten_headline: [],
        rewritten_about: '',
        rewritten_experiences: [],
        completed_recommendations: [],
        projected_score: 0,
        status: 'draft',
        version: 1,
      })
      .select('id')
      .single()

    if (insertErr || !inserted)
      return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })

    return NextResponse.json({ audit_id: inserted.id })
  } catch (err) {
    console.error('[POST /api/profile-optimizer/save-draft]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
