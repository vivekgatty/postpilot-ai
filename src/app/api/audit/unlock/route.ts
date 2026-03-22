export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendAuditResultEmail } from '@/lib/resend'
import { getLevelFromScore, getTierFromLevel } from '@/lib/auditConfig'
import type { AuditDimensionScore } from '@/types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    let body: { auditId?: string; email?: string }
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const { auditId, email } = body

    if (!auditId) {
      return NextResponse.json({ error: 'auditId is required' }, { status: 400 })
    }
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Fetch the audit
    const { data: audit, error: fetchErr } = await supabase
      .from('brand_audits')
      .select('*')
      .eq('id', auditId)
      .single()

    if (fetchErr || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    // 2. One-profile-limit check for free users
    // Check if another DIFFERENT linkedin_url is already unlocked with this email
    const { data: otherAudit } = await supabase
      .from('brand_audits')
      .select('id, linkedin_url')
      .eq('email', email.toLowerCase().trim())
      .eq('is_unlocked', true)
      .neq('linkedin_url', audit.linkedin_url)
      .limit(1)
      .maybeSingle()

    if (otherAudit) {
      // Check if this email has a paid account
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle()

      const isPaid = profile && profile.plan !== 'free'
      if (!isPaid) {
        return NextResponse.json(
          {
            error:   'ONE_PROFILE_LIMIT',
            message: 'Free accounts can audit one LinkedIn profile. Upgrade to audit more.',
          },
          { status: 403 },
        )
      }
    }

    // 3. Check for existing user account and link
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    const userId: string | null = existingProfile?.id ?? null

    if (!existingProfile) {
      // Send magic link — this creates the user if they don't exist
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://postpika.com'}/api/auth/callback?next=/dashboard/audit`,
        },
      })
      if (otpErr) {
        console.error('[audit/unlock] OTP error', otpErr)
        // Non-fatal — we still unlock the audit even if magic link fails
      }
    }

    // 4. Update audit: set is_unlocked=true, email, user_id
    const { error: updateErr } = await supabase
      .from('brand_audits')
      .update({
        is_unlocked: true,
        email:       email.toLowerCase().trim(),
        user_id:     userId,
      })
      .eq('id', auditId)

    if (updateErr) {
      console.error('[audit/unlock]', updateErr)
      return NextResponse.json({ error: 'Failed to unlock audit' }, { status: 500 })
    }

    // 5. Fetch updated audit for email
    const { data: updated } = await supabase
      .from('brand_audits')
      .select('*')
      .eq('id', auditId)
      .single()

    if (!updated) {
      return NextResponse.json({ error: 'Failed to fetch updated audit' }, { status: 500 })
    }

    // 6. Send audit result email
    const level = getLevelFromScore(updated.total_score)
    const tier  = getTierFromLevel(level.tier)
    const shareUrl = `https://postpika.com/audit/result/${updated.share_token}`

    const topActions: string[] = Array.isArray(updated.ai_top_actions) ? updated.ai_top_actions : []

    try {
      await sendAuditResultEmail(
        email,
        updated.full_name ?? updated.linkedin_username ?? 'there',
        updated.total_score,
        level.label,
        tier?.label ?? level.tier,
        shareUrl,
        topActions,
        updated.share_token,
      )
    } catch (emailErr) {
      console.error('[audit/unlock] email send error', emailErr)
      // Non-fatal
    }

    // 7. Schedule improvement email (insert record for cron job)
    const sendAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('audit_improvement_emails')
      .insert({
        audit_id:      auditId,
        email:         email.toLowerCase().trim(),
        scheduled_for: sendAt,
        sent:          false,
      })
      .then(() => {})  // fire-and-forget

    // 8. Return full AuditResult with is_unlocked: true
    const dimensionScores: AuditDimensionScore[] = Array.isArray(updated.scores) ? updated.scores : []

    const result = {
      id:                  updated.id,
      linkedin_url:        updated.linkedin_url,
      linkedin_username:   updated.linkedin_username,
      full_name:           updated.full_name,
      profile_photo_url:   updated.profile_photo_url,
      sample_post_content: updated.sample_post_content,
      total_score:         updated.total_score,
      tier_key:            level.tier,
      tier_label:          tier?.label ?? level.tier,
      level_name:          level.label,
      level_key:           level.key,
      dimension_scores:    dimensionScores,
      ai_top_actions:      topActions,
      ai_content_quality:  updated.ai_content_quality ?? null,
      is_unlocked:         true,
      share_token:         updated.share_token,
      created_at:          updated.created_at,
    }

    return NextResponse.json({ result })
  } catch (err) {
    console.error('[audit/unlock]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
