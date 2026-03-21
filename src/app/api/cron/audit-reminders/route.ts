export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLevelFromScore, getNextLevel } from '@/lib/auditConfig'
import { sendImprovementEmail, ImprovementSuggestion } from '@/lib/resend'
import { anthropic } from '@/lib/anthropic'
import type { AuditDimensionScore } from '@/types'

function extractJSON(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found')
  return JSON.parse(match[0])
}

export async function GET(req: NextRequest) {
  // Verify CRON_SECRET header
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Find audits that were unlocked 29-31 days ago that haven't received improvement email
  const now = new Date()
  const from = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString()
  const to   = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString()

  // Get scheduled improvement emails that are due and not yet sent
  const { data: scheduled, error: scheduleErr } = await supabase
    .from('audit_improvement_emails')
    .select('id, audit_id, email')
    .eq('sent', false)
    .lte('scheduled_for', now.toISOString())
    .limit(50)

  if (scheduleErr) {
    console.error('[cron/audit-reminders] schedule fetch error', scheduleErr)
    return NextResponse.json({ error: 'Failed to fetch scheduled emails' }, { status: 500 })
  }

  // Fallback: also find audits in date range with email that have no improvement email record
  const { data: fallbackAudits } = await supabase
    .from('brand_audits')
    .select('id, email, total_score, scores, linkedin_username, full_name')
    .eq('is_unlocked', true)
    .not('email', 'is', null)
    .gte('created_at', from)
    .lte('created_at', to)
    .limit(50)

  const toProcess = [
    ...(scheduled ?? []),
    ...(fallbackAudits ?? [])
      .filter(a => !(scheduled ?? []).some(s => s.audit_id === a.id))
      .map(a => ({ id: null, audit_id: a.id, email: a.email })),
  ].slice(0, 50)

  let processed = 0

  for (const item of toProcess) {
    try {
      // Fetch full audit
      const { data: audit } = await supabase
        .from('brand_audits')
        .select('*')
        .eq('id', item.audit_id)
        .single()

      if (!audit || !audit.email) continue

      const currentScore = audit.total_score ?? 0
      const currentLevel = getLevelFromScore(currentScore)
      const nextLevel    = getNextLevel(currentLevel.key)
      const targetScore  = Math.min(currentScore + 5, 100)
      const dims: AuditDimensionScore[] = Array.isArray(audit.scores) ? audit.scores : []
      const dimList = dims.map(d => `${d.label}: ${d.earned}/${d.max}`).join('\n')

      // Generate suggestions
      const msg = await anthropic.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system:     'You are a LinkedIn personal brand coach. Give specific, actionable advice.',
        messages: [{
          role: 'user',
          content: `LinkedIn user scored ${currentScore}/100, ranked "${currentLevel.label}". Target: "${nextLevel.label}".
Dimension scores:
${dimList}

Generate 5 improvement suggestions for their weakest dimensions. Return ONLY valid JSON:
{
  "suggestions": [
    {"title": "short title", "detail": "specific instruction", "dimension": "area", "points_gain": "1-2"}
  ]
}`,
        }],
      })

      const raw     = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
      const parsed  = extractJSON(raw) as { suggestions: ImprovementSuggestion[] }
      const suggestions: ImprovementSuggestion[] = parsed.suggestions ?? []

      await sendImprovementEmail(
        audit.email,
        audit.full_name ?? audit.linkedin_username ?? 'there',
        currentScore,
        targetScore,
        currentLevel.label,
        nextLevel.label,
        suggestions,
      )

      // Mark as sent
      if (item.id) {
        await supabase
          .from('audit_improvement_emails')
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq('id', item.id)
      } else {
        await supabase
          .from('audit_improvement_emails')
          .insert({
            audit_id:      item.audit_id,
            email:         audit.email,
            scheduled_for: new Date().toISOString(),
            sent:          true,
            sent_at:       new Date().toISOString(),
          })
      }

      processed++
    } catch (err) {
      console.error('[cron/audit-reminders] error processing audit', item.audit_id, err)
    }
  }

  return NextResponse.json({ processed })
}
