export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateLinkedInPosts } from '@/lib/anthropic'
import { handleAnthropicError } from '@/lib/handleAnthropicError'
import { PLAN_LIMITS, SYSTEM_TONES, SYSTEM_FORMATS } from '@/lib/constants'
import type { NicheType } from '@/types'

const VALID_NICHES = new Set<string>([
  'Tech/SaaS', 'Finance', 'Marketing', 'Consulting',
  'HR/Talent', 'Sales', 'Founder/Startup', 'Other',
])

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('plan, generations_used_this_month, generations_reset_date, full_name')
      .eq('id', user.id)
      .single()

    if (profileErr || !profile)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // 3. Rate limit — 10 per minute
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()
    const { count: recentCount } = await supabase
      .from('usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action', 'generate')
      .gte('created_at', oneMinuteAgo)

    if ((recentCount ?? 0) >= 10)
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before generating again.' },
        { status: 429 }
      )

    // 4. Usage gate
    const planLimit = PLAN_LIMITS[profile.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free
    const atLimit   = planLimit !== -1 && profile.generations_used_this_month >= planLimit

    if (profile.plan === 'free' && atLimit)
      return NextResponse.json({ error: 'LIMIT_REACHED', message: 'Upgrade to continue' }, { status: 403 })

    // 5. Validate body
    let body: {
      topic?: unknown
      tone?: unknown
      niche?: unknown
      customTonePrompt?: unknown
      selectedFormat?: unknown
      customFormatPrompt?: unknown
    }
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { topic, tone, niche, customTonePrompt, selectedFormat, customFormatPrompt } = body

    if (typeof topic !== 'string' || topic.trim().length < 20)
      return NextResponse.json({ error: 'Topic must be at least 20 characters' }, { status: 400 })

    if (typeof tone !== 'string' || tone.trim().length === 0)
      return NextResponse.json({ error: 'tone is required' }, { status: 400 })

    const isCustomTone = typeof customTonePrompt === 'string' && customTonePrompt.trim().length > 0
    if (!isCustomTone && !SYSTEM_TONES[tone])
      return NextResponse.json(
        { error: `Unknown tone "${tone}". Provide a valid tone id or pass customTonePrompt.` },
        { status: 400 }
      )

    if (typeof niche !== 'string' || !VALID_NICHES.has(niche))
      return NextResponse.json(
        { error: `Invalid niche. Must be one of: ${Array.from(VALID_NICHES).join(', ')}` },
        { status: 400 }
      )

    // Resolve system prompt (custom overrides system)
    const resolvedTonePrompt = isCustomTone
      ? (customTonePrompt as string).trim()
      : SYSTEM_TONES[tone].systemPrompt

    // Resolve format prompt (custom overrides system)
    const isCustomFormat = typeof customFormatPrompt === 'string' && customFormatPrompt.trim().length > 0
    const formatKey      = typeof selectedFormat === 'string' && selectedFormat.trim() ? selectedFormat : 'listicle'
    const resolvedFormatPrompt = isCustomFormat
      ? (customFormatPrompt as string).trim()
      : (SYSTEM_FORMATS[formatKey]?.formatPrompt ?? SYSTEM_FORMATS.listicle.formatPrompt)

    // 6. Generate
    const { posts, tokensUsed } = await generateLinkedInPosts(
      topic.trim(),
      resolvedTonePrompt,
      niche as NicheType,
      profile.full_name ?? undefined,
      resolvedFormatPrompt,
    )

    // 7. Increment usage counter
    const newUsed = profile.generations_used_this_month + 1
    await supabase
      .from('profiles')
      .update({ generations_used_this_month: newUsed })
      .eq('id', user.id)

    // 8. Usage log
    await supabase.from('usage_logs').insert({
      user_id:     user.id,
      action:      'generate',
      tokens_used: tokensUsed,
      metadata: {
        tone,
        niche,
        is_custom_tone:   isCustomTone,
        selected_format:  formatKey,
        is_custom_format: isCustomFormat,
      },
    })

    // 9. Return
    const resetDate = profile.generations_reset_date
      ?? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()

    return NextResponse.json({
      posts,
      usage: { used: newUsed, limit: planLimit, plan: profile.plan, resetDate },
    })

  } catch (err) {
    const anthropicRes = handleAnthropicError(err)
    if (anthropicRes) return anthropicRes
    console.error('[POST /api/generate]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
