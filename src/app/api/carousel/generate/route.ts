export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCarouselSlides } from '@/lib/carouselGenerator'
import { handleAnthropicError } from '@/lib/handleAnthropicError'
import { getTypeById, CAROUSEL_LIMITS } from '@/lib/carouselConfig'
import type { PlanType, CarouselConfig, AuthorBranding } from '@/types'

const PLAN_ORDER = ['free', 'starter', 'pro', 'agency']

// ── POST /api/carousel/generate ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('plan, full_name, avatar_url, niche, linkedin_url, email')
      .eq('id', user.id)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const plan = (profile.plan ?? 'free') as PlanType

    // Monthly usage limit check
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: monthCount } = await supabase
      .from('carousels')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    const used = monthCount ?? 0

    if (plan === 'free' && used >= 2) {
      return NextResponse.json(
        { error: 'MONTHLY_LIMIT', message: 'Free plan allows 2 carousels per month. Upgrade for more.' },
        { status: 403 },
      )
    }
    if (plan === 'starter' && used >= 15) {
      return NextResponse.json(
        { error: 'MONTHLY_LIMIT', message: 'Upgrade to Pro for unlimited carousels.' },
        { status: 403 },
      )
    }

    // Parse and validate body
    let body: Partial<CarouselConfig>
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const {
      topic,
      carousel_type,
      theme_id,
      slide_count,
      tone_id       = 'professional',
      niche         = profile.niche ?? 'Other',
      aspect_ratio  = 'square',
      accent_color,
      show_slide_numbers = true,
      show_author_handle = true,
      show_branding      = true,
      font_style    = 'professional',
    } = body

    if (!topic || typeof topic !== 'string' || topic.trim().length < 10) {
      return NextResponse.json({ error: 'topic is required (min 10 characters)' }, { status: 400 })
    }
    if (!carousel_type) return NextResponse.json({ error: 'carousel_type is required' }, { status: 400 })
    if (!theme_id)      return NextResponse.json({ error: 'theme_id is required' }, { status: 400 })
    if (!slide_count || typeof slide_count !== 'number' || slide_count < 4 || slide_count > 10) {
      return NextResponse.json({ error: 'slide_count must be a number between 4 and 10' }, { status: 400 })
    }

    // Check plan allows the requested carousel_type
    const carouselType = getTypeById(carousel_type)
    if (!carouselType) {
      return NextResponse.json({ error: 'Invalid carousel_type' }, { status: 400 })
    }

    const planRank     = PLAN_ORDER.indexOf(plan)
    const typeMinRank  = PLAN_ORDER.indexOf(carouselType.plan_required)

    if (planRank < typeMinRank) {
      return NextResponse.json(
        {
          error:         'PLAN_REQUIRED',
          required_plan: carouselType.plan_required,
          message:       `This carousel type requires ${carouselType.plan_required} plan`,
        },
        { status: 403 },
      )
    }

    // Clamp slide_count to plan max
    const planLimits   = CAROUSEL_LIMITS[plan]
    const clampedCount = Math.min(slide_count, planLimits.max_slides)

    // Build author branding
    let handle = ''
    if (profile.linkedin_url && profile.linkedin_url.includes('/in/')) {
      const after = profile.linkedin_url.split('/in/')[1] ?? ''
      handle = after.replace(/\/$/, '').split('/')[0] ?? ''
    }
    if (!handle) {
      handle = (user.email ?? profile.email ?? '').split('@')[0] ?? 'author'
    }

    const authorBranding: AuthorBranding = {
      full_name: profile.full_name ?? 'Author',
      handle,
      avatar_url: profile.avatar_url ?? undefined,
      niche:      profile.niche ?? undefined,
    }

    const config: CarouselConfig = {
      topic:              topic.trim(),
      carousel_type,
      theme_id,
      slide_count:        clampedCount,
      tone_id,
      niche,
      aspect_ratio,
      accent_color,
      show_slide_numbers,
      show_author_handle,
      show_branding,
      font_style: font_style as 'professional' | 'modern' | 'bold',
    }

    // Generate slides
    const result = await generateCarouselSlides(config, authorBranding)

    // Force branding on free plan
    const finalShowBranding = plan === 'free' ? true : show_branding

    // Insert into carousels table
    const { data: saved, error: insertErr } = await supabase
      .from('carousels')
      .insert({
        user_id:            user.id,
        title:              result.title,
        topic:              config.topic,
        carousel_type,
        theme_id,
        aspect_ratio,
        accent_color:       accent_color ?? null,
        slides:             result.slides,
        show_slide_numbers,
        show_author_handle,
        show_branding:      finalShowBranding,
        font_style,
        slide_count:        result.slides.length,
        niche,
        tone_id,
        status:             'draft',
      })
      .select('id')
      .single()

    if (insertErr) throw insertErr

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id:     user.id,
      action:      'carousel_generate',
      tokens_used: result.tokensUsed,
      metadata:    { carousel_type, theme_id, slide_count: result.slides.length },
    })

    return NextResponse.json({
      carousel_id: saved.id,
      slides:      result.slides,
      title:       result.title,
    }, { status: 201 })
  } catch (err) {
    const anthropicRes = handleAnthropicError(err)
    if (anthropicRes) return anthropicRes
    console.error('[POST /api/carousel/generate]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to generate carousel' }, { status: 500 })
  }
}
