export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { handleAnthropicError } from '@/lib/handleAnthropicError'
import { calculateAuditScore, AIContentQuality } from '@/lib/auditScoring'
import { getLevelFromScore, getTierFromLevel } from '@/lib/auditConfig'

// ─── Parse JSON safely from Claude response ───────────────────────────────────

function extractJSON(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in response')
  return JSON.parse(match[0])
}

export async function POST(req: NextRequest) {
  try {
    let body: {
      auditId?: string
      answers?: Record<string, string>
      samplePostContent?: string
      samplePostUrl?: string
    }
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { auditId, answers, samplePostContent, samplePostUrl } = body

    if (!auditId) {
      return NextResponse.json({ error: 'auditId is required' }, { status: 400 })
    }
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'answers object is required' }, { status: 400 })
    }

    // Cap samplePostContent to prevent oversized Claude prompts
    const cappedPostContent = typeof samplePostContent === 'string'
      ? samplePostContent.slice(0, 5000)
      : undefined

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

    // Rate-limit: if already evaluated, return cached result (prevents re-evaluation spam)
    if (audit.total_score > 0 && Array.isArray(audit.scores) && audit.scores.length > 0) {
      const level = getLevelFromScore(audit.total_score)
      const tier  = getTierFromLevel(level.tier)
      const cachedResult = {
        id:                  audit.id,
        linkedin_url:        audit.linkedin_url,
        linkedin_username:   audit.linkedin_username,
        full_name:           audit.full_name,
        profile_photo_url:   audit.profile_photo_url,
        sample_post_content: audit.sample_post_content ?? null,
        total_score:         audit.total_score,
        tier_key:            level.tier,
        tier_label:          tier?.label ?? level.tier,
        level_name:          level.label,
        level_key:           level.key,
        dimension_scores:    audit.scores,
        ai_top_actions:      Array.isArray(audit.ai_top_actions) ? audit.ai_top_actions : [],
        ai_content_quality:  audit.ai_content_quality ?? null,
        is_unlocked:         false,
        share_token:         audit.share_token,
        created_at:          audit.created_at,
      }
      return NextResponse.json({ result: cachedResult })
    }

    // 2. Update audit with raw data immediately
    await supabase
      .from('brand_audits')
      .update({
        answers,
        sample_post_content: cappedPostContent ?? null,
        sample_post_url:     samplePostUrl ?? null,
      })
      .eq('id', auditId)

    let totalTokensUsed = 0
    let aiContentQuality: AIContentQuality | undefined

    // 3. Evaluate post quality with Claude (if post provided, min 50 chars)
    if (cappedPostContent && cappedPostContent.trim().length >= 50) {
      try {
        const postEvalMsg = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          system: 'You are an expert LinkedIn content analyst. You evaluate posts with precision and honesty. You score numerically and give concise actionable feedback.',
          messages: [
            {
              role: 'user',
              content: `Evaluate this LinkedIn post across 5 dimensions. Score each out of the specified maximum.

POST:
${cappedPostContent}

Score these dimensions:
1. Hook strength (0-5): Does line 1 stop a scroll?
2. Readability (0-3): Line breaks, scannable structure?
3. Value delivery (0-5): Teaches, inspires, or provokes?
4. Call to action (0-4): Ends with engagement driver?
5. Authenticity (0-3): Human or corporate filler?

Return ONLY valid JSON:
{
  "hook_score": 0-5,
  "readability_score": 0-3,
  "value_score": 0-5,
  "cta_score": 0-4,
  "authenticity_score": 0-3,
  "feedback": "2-3 sentence specific honest assessment of the post's main strength and main weakness"
}`,
            },
          ],
        })

        totalTokensUsed += postEvalMsg.usage.input_tokens + postEvalMsg.usage.output_tokens
        const raw = postEvalMsg.content[0].type === 'text' ? postEvalMsg.content[0].text : ''
        const parsed = extractJSON(raw) as AIContentQuality
        aiContentQuality = parsed
      } catch (err) {
        console.error('[audit/evaluate] post eval error', err)
        // Proceed without AI quality if parsing fails
      }
    }

    // 4. Calculate scores
    const { totalScore, dimensionScores } = calculateAuditScore(answers, aiContentQuality)

    // 5. Get level + tier
    const level = getLevelFromScore(totalScore)
    const tier  = getTierFromLevel(level.tier)

    // 6. Generate Top 3 Actions via Claude
    let topActions: string[] = [
      'Complete your LinkedIn profile with a professional photo and targeted headline.',
      'Post on LinkedIn at least once this week using a personal story format.',
      'Spend 15 minutes commenting meaningfully on 5 posts in your niche today.',
    ]

    try {
      const dimList = dimensionScores
        .map(d => `${d.label}: ${d.earned}/${d.max} points`)
        .join('\n')

      const actionsMsg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: 'You are a LinkedIn personal brand coach for Indian professionals. You give specific, actionable, prioritised advice. Never generic.',
        messages: [
          {
            role: 'user',
            content: `A LinkedIn user just completed a personal brand audit and scored ${totalScore}/100.

Their dimension scores:
${dimList}

Their LinkedIn username: ${audit.linkedin_username}

Based on their WEAKEST dimensions, give exactly 3 specific actions they can take THIS WEEK to improve their score by 5 points. Each action must be:
- Completable in under 30 minutes
- Specific to their exact weaknesses shown above
- Written as a direct instruction starting with an action verb
- Include WHY it will improve their score

Return ONLY valid JSON:
{
  "actions": [
    {
      "action": "specific action text",
      "impact": "which dimension this improves",
      "why": "one sentence on why this works",
      "time": "estimated minutes to complete"
    }
  ]
}`,
          },
        ],
      })

      totalTokensUsed += actionsMsg.usage.input_tokens + actionsMsg.usage.output_tokens
      const raw = actionsMsg.content[0].type === 'text' ? actionsMsg.content[0].text : ''
      const parsed = extractJSON(raw) as { actions: { action: string; impact: string; why: string; time: string }[] }
      if (parsed.actions?.length) {
        topActions = parsed.actions.map(a => `${a.action} (${a.impact} — ~${a.time} min)`)
      }
    } catch (err) {
      console.error('[audit/evaluate] top actions error', err)
    }

    // 7. Update brand_audit row with all computed fields
    await supabase
      .from('brand_audits')
      .update({
        total_score:         totalScore,
        tier_key:            level.tier,
        tier_label:          tier?.label ?? level.tier,
        level_name:          level.label,
        level_key:           level.key,
        scores:              dimensionScores,
        ai_top_actions:      topActions,
        ai_content_quality:  aiContentQuality ?? null,
      })
      .eq('id', auditId)

    // 8. Log token usage
    if (totalTokensUsed > 0) {
      await supabase
        .from('usage_logs')
        .insert({
          user_id:     null,
          action:      'brand_audit',
          tokens_used: totalTokensUsed,
          metadata:    { audit_id: auditId, score: totalScore },
        })
        .then(() => {})  // fire-and-forget
    }

    // 9. Build and return the AuditResult (is_unlocked: false)
    const result = {
      id:                  audit.id,
      linkedin_url:        audit.linkedin_url,
      linkedin_username:   audit.linkedin_username,
      full_name:           audit.full_name,
      profile_photo_url:   audit.profile_photo_url,
      sample_post_content: cappedPostContent ?? null,
      total_score:         totalScore,
      tier_key:            level.tier,
      tier_label:          tier?.label ?? level.tier,
      level_name:          level.label,
      level_key:           level.key,
      dimension_scores:    dimensionScores,
      ai_top_actions:      topActions,
      ai_content_quality:  aiContentQuality ?? null,
      is_unlocked:         false,
      share_token:         audit.share_token,
      created_at:          audit.created_at,
    }

    return NextResponse.json({ result })
  } catch (err) {
    const anthropicRes = handleAnthropicError(err)
    if (anthropicRes) return anthropicRes
    console.error('[audit/evaluate]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
