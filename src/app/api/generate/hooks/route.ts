export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateHooks } from '@/lib/anthropic'
import { handleAnthropicError } from '@/lib/handleAnthropicError'
import { PLAN_LIMITS, HOOK_STYLES } from '@/lib/constants'

const VALID_NICHES = new Set([
  'Tech/SaaS', 'Finance', 'Marketing', 'Consulting',
  'HR/Talent', 'Sales', 'Founder/Startup', 'Other',
])

const VALID_GOALS = new Set(['comments', 'credibility', 'followers', 'leads', 'story', 'debate'])

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 2. Profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('plan, generations_used_this_month')
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
      .eq('action', 'generate_hooks')
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
      idea?: unknown
      niche?: unknown
      goal?: unknown
      selectedStyles?: unknown
    }
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { idea, niche, goal, selectedStyles } = body

    if (typeof idea !== 'string' || idea.trim().length < 10)
      return NextResponse.json({ error: 'idea must be at least 10 characters' }, { status: 400 })

    if (typeof niche !== 'string' || !VALID_NICHES.has(niche))
      return NextResponse.json({ error: `Invalid niche` }, { status: 400 })

    if (typeof goal !== 'string' || !VALID_GOALS.has(goal))
      return NextResponse.json({ error: `Invalid goal` }, { status: 400 })

    if (!Array.isArray(selectedStyles) || selectedStyles.length === 0)
      return NextResponse.json({ error: 'selectedStyles must be a non-empty array' }, { status: 400 })

    const styleIds = selectedStyles.filter((s): s is string => typeof s === 'string')
    if (styleIds.length === 0)
      return NextResponse.json({ error: 'No valid style ids provided' }, { status: 400 })

    // Cap at 8 styles per request
    const cappedIds = styleIds.slice(0, 8)

    // Check premium styles — only paid plans can use them
    const isPaid = profile.plan !== 'free'
    const styleObjects = HOOK_STYLES.filter(s => cappedIds.includes(s.id))
    const hasPremium   = styleObjects.some(s => s.isPremium)
    if (hasPremium && !isPaid)
      return NextResponse.json({ error: 'Premium hook styles require a paid plan' }, { status: 403 })

    if (styleObjects.length === 0)
      return NextResponse.json({ error: 'No matching hook styles found' }, { status: 400 })

    // 6. Generate
    const { hooks, tokensUsed } = await generateHooks(
      idea.trim(),
      niche,
      goal,
      styleObjects.map(s => ({ id: s.id, label: s.label, category: s.category, template: s.template })),
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
      action:      'generate_hooks',
      tokens_used: tokensUsed,
      metadata:    { niche, goal, style_count: styleObjects.length },
    })

    return NextResponse.json({ hooks })

  } catch (err) {
    const anthropicRes = handleAnthropicError(err)
    if (anthropicRes) return anthropicRes
    console.error('[POST /api/generate/hooks]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
