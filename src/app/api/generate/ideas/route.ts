export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@/lib/supabase/server'
import { anthropic, AI_MODEL }       from '@/lib/anthropic'
import { handleAnthropicError }      from '@/lib/handleAnthropicError'
import type { NicheType }            from '@/types'

// ── Daily rate limit ──────────────────────────────────────────────────────────

const DAILY_LIMIT = 3

async function getIdeasUsedToday(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('usage_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', 'generate_ideas')
    .gte('created_at', startOfDay.toISOString())

  return count ?? 0
}

// ── Extract JSON helper ───────────────────────────────────────────────────────

function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  const start = raw.indexOf('{')
  const end   = raw.lastIndexOf('}')
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1)
  return raw.trim()
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Parse body
    let body: { niche?: NicheType }
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const niche  = body.niche
    if (!niche) return NextResponse.json({ error: 'Niche is required' }, { status: 400 })

    // 3. Daily rate limit (all plans)
    const usedToday = await getIdeasUsedToday(supabase, user.id)
    if (usedToday >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'DAILY_LIMIT_REACHED', message: `You can generate ideas ${DAILY_LIMIT} times per day. Come back tomorrow!` },
        { status: 429 }
      )
    }

    // 4. Generate with claude-haiku
    const prompt = `Generate 7 specific LinkedIn post topic ideas for a ${niche} professional in India, one per weekday Mon-Sun. Make each topic concrete and actionable, not generic. Return ONLY JSON: {"ideas":[{"day":"Monday","topic":"...","hook":"...","why":"..."}]}`

    const message = await anthropic.messages.create({
      model:      AI_MODEL,
      max_tokens: 1500,
      messages:   [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    let parsed: { ideas: Array<{ day: string; topic: string; hook: string; why: string }> }
    try {
      parsed = JSON.parse(extractJSON(raw)) as typeof parsed
    } catch {
      return NextResponse.json({ error: 'AI returned an unexpected response. Please try again.' }, { status: 500 })
    }

    // 5. Log usage
    await supabase.from('usage_logs').insert({
      user_id:    user.id,
      action:     'generate_ideas',
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
      metadata:   { niche },
    })

    return NextResponse.json({
      ideas:       parsed.ideas,
      generatedAt: new Date().toISOString(),
      remaining:   DAILY_LIMIT - usedToday - 1,
    })
  } catch (err) {
    const anthropicRes = handleAnthropicError(err)
    if (anthropicRes) return anthropicRes
    console.error('Generate ideas error:', err)
    return NextResponse.json({ error: 'Failed to generate ideas' }, { status: 500 })
  }
}
