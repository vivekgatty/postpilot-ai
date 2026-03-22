export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { handleAnthropicError } from '@/lib/handleAnthropicError'
import { getLevelFromScore, getNextLevel } from '@/lib/auditConfig'
import type { AuditDimensionScore } from '@/types'

function extractJSON(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in response')
  return JSON.parse(match[0])
}

export async function POST(req: NextRequest) {
  try {
    let body: { auditId?: string }
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const { auditId } = body

    if (!auditId) {
      return NextResponse.json({ error: 'auditId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Auth check — user must be logged in to call this (dashboard use)
    // For the gate-less public flow, we skip auth check since it's a paid feature
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch the audit
    const { data: audit, error: fetchErr } = await supabase
      .from('brand_audits')
      .select('*')
      .eq('id', auditId)
      .single()

    if (fetchErr || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    // If user is authenticated, verify ownership
    if (user && audit.user_id && audit.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Rate-limit: max 3 improvement requests per audit per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'brand_audit_improve')
      .contains('metadata', { audit_id: auditId })
      .gte('created_at', oneHourAgo)

    if ((recentCount ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }

    const currentScore    = audit.total_score ?? 0
    const targetScore     = Math.min(currentScore + 5, 100)
    const currentLevel    = getLevelFromScore(currentScore)
    const nextLevel       = getNextLevel(currentLevel.key)
    const dimensionScores: AuditDimensionScore[] = Array.isArray(audit.scores) ? audit.scores : []

    const dimList = dimensionScores
      .map(d => `${d.label}: ${d.earned}/${d.max} points (${d.percentage}%)`)
      .join('\n')

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      system: 'You are a LinkedIn personal brand coach for Indian professionals. You give specific, actionable, prioritised advice.',
      messages: [
        {
          role: 'user',
          content: `LinkedIn user scored ${currentScore}/100. They are currently "${currentLevel.label}" and want to reach the next level "${nextLevel.label}".

Their dimension breakdown:
${dimList}

Generate 5 specific improvement suggestions that will help them gain the next 5 points. Focus ONLY on their weakest 2 dimensions. Each suggestion must be concrete, specific to their situation, and completable this week.

Return ONLY valid JSON:
{
  "current_score": ${currentScore},
  "target_score": ${targetScore},
  "current_level": "${currentLevel.label}",
  "next_level": "${nextLevel.label}",
  "suggestions": [
    {
      "title": "short action title",
      "detail": "specific instruction",
      "dimension": "which area this fixes",
      "points_gain": "estimated points gain"
    }
  ]
}`,
        },
      ],
    })

    const tokensUsed = msg.usage.input_tokens + msg.usage.output_tokens
    const raw        = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    const parsed     = extractJSON(raw) as {
      current_score: number
      target_score: number
      current_level: string
      next_level: string
      suggestions: { title: string; detail: string; dimension: string; points_gain: string }[]
    }

    // Log usage
    await supabase
      .from('usage_logs')
      .insert({
        user_id:     user?.id ?? null,
        action:      'brand_audit_improve',
        tokens_used: tokensUsed,
        metadata:    { audit_id: auditId },
      })
      .then(() => {})

    return NextResponse.json({ improvement: parsed })
  } catch (err) {
    const anthropicRes = handleAnthropicError(err)
    if (anthropicRes) return anthropicRes
    console.error('[audit/improve]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
