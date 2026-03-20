export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateLinkedInPosts } from '@/lib/anthropic'
import { PLAN_LIMITS } from '@/lib/constants'
import type { ToneType, NicheType } from '@/types'

// ── Valid enum values for request validation ──────────────────────────────────

const VALID_TONES  = new Set<string>(['professional', 'storytelling', 'controversial', 'educational', 'inspirational'])
const VALID_NICHES = new Set<string>(['Tech/SaaS', 'Finance', 'Marketing', 'Consulting', 'HR/Talent', 'Sales', 'Founder/Startup', 'Other'])

// ── POST /api/generate ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // ── 1. Auth check ────────────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── 2. Load profile ──────────────────────────────────────────────────────
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('plan, generations_used_this_month, generations_reset_date, full_name')
      .eq('id', user.id)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // ── 3. Rate limit: max 10 generate requests per user per minute ──────────
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()
    const { count: recentCount } = await supabase
      .from('usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action', 'generate')
      .gte('created_at', oneMinuteAgo)

    if ((recentCount ?? 0) >= 10) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before generating again.' },
        { status: 429 }
      )
    }

    // ── 4. Usage gate ────────────────────────────────────────────────────────
    const planLimit = PLAN_LIMITS[profile.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free
    const isFreePlan = profile.plan === 'free'
    const atLimit    = planLimit !== -1 && profile.generations_used_this_month >= planLimit

    if (isFreePlan && atLimit) {
      return NextResponse.json(
        {
          error:   'LIMIT_REACHED',
          message: 'Upgrade to continue',
        },
        { status: 403 }
      )
    }

    // ── 5. Validate request body ─────────────────────────────────────────────
    let body: { topic?: unknown; tone?: unknown; niche?: unknown }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { topic, tone, niche } = body

    if (typeof topic !== 'string' || topic.trim().length < 20) {
      return NextResponse.json(
        { error: 'Topic must be at least 20 characters' },
        { status: 400 }
      )
    }
    if (typeof tone !== 'string' || !VALID_TONES.has(tone)) {
      return NextResponse.json(
        { error: `Invalid tone. Must be one of: ${Array.from(VALID_TONES).join(', ')}` },
        { status: 400 }
      )
    }
    if (typeof niche !== 'string' || !VALID_NICHES.has(niche)) {
      return NextResponse.json(
        { error: `Invalid niche. Must be one of: ${Array.from(VALID_NICHES).join(', ')}` },
        { status: 400 }
      )
    }

    // ── 6. Generate posts ────────────────────────────────────────────────────
    const { posts, tokensUsed } = await generateLinkedInPosts(
      topic.trim(),
      tone    as ToneType,
      niche   as NicheType,
      profile.full_name ?? undefined,
    )

    // ── 7. Increment usage counter ───────────────────────────────────────────
    const newUsed = profile.generations_used_this_month + 1
    await supabase
      .from('profiles')
      .update({ generations_used_this_month: newUsed })
      .eq('id', user.id)

    // ── 8. Write usage log ───────────────────────────────────────────────────
    await supabase.from('usage_logs').insert({
      user_id:     user.id,
      action:      'generate',
      tokens_used: tokensUsed,
      metadata:    { tone, niche },
    })

    // ── 9. Return posts + updated usage ─────────────────────────────────────
    const resetDate = profile.generations_reset_date
      ?? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()

    return NextResponse.json({
      posts,
      usage: {
        used:      newUsed,
        limit:     planLimit,
        plan:      profile.plan,
        resetDate,
      },
    })

  } catch (err) {
    // ── 10. Safe 500 — no stack traces exposed ───────────────────────────────
    console.error('[POST /api/generate]', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
