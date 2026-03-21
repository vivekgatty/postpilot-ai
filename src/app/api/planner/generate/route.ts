export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import type { PlanType, ContentPillar, PlannerSettings } from '@/types'

// Plans allowed to generate for future months
const FUTURE_MONTH_LIMITS: Record<PlanType, number> = {
  free:    0,  // current month only
  starter: 1,  // current + 1 ahead
  pro:     99,
  agency:  99,
}

function extractJSON(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in response')
  return JSON.parse(match[0])
}

function getPostingDatesForMonth(
  year: number,
  month: number,
  preferredDays: string[],
): string[] {
  const dayMap: Record<string, number> = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6,
  }
  const allowedNums = preferredDays.map((d) => dayMap[d] ?? -1).filter((n) => n >= 0)
  const dates: string[] = []

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let day = 1; day <= daysInMonth; day++) {
    const date    = new Date(year, month, day)
    const weekday = date.getDay()
    if (allowedNums.includes(weekday)) {
      const mm  = String(month + 1).padStart(2, '0')
      const dd  = String(day).padStart(2, '0')
      dates.push(`${year}-${mm}-${dd}`)
    }
  }
  return dates
}

// ── POST /api/planner/generate ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      month:          string  // YYYY-MM
      regenerateAll?: boolean
      pillarIds?:     string[]
    }

    const { month, regenerateAll = false } = body

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'month must be in YYYY-MM format' }, { status: 400 })
    }

    // Plan-based future month limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, niche')
      .eq('id', user.id)
      .single()

    const plan  = (profile?.plan ?? 'free') as PlanType
    const niche = profile?.niche ?? 'Other'

    const [targetYear, targetMonthIdx] = month.split('-').map(Number)
    const now          = new Date()
    const currentYear  = now.getFullYear()
    const currentMonth = now.getMonth() // 0-indexed

    const monthsAhead = (targetYear - currentYear) * 12 + ((targetMonthIdx - 1) - currentMonth)
    const allowed     = FUTURE_MONTH_LIMITS[plan]

    if (monthsAhead > allowed) {
      return NextResponse.json(
        { error: `Your plan allows generating up to ${allowed} month(s) ahead` },
        { status: 403 },
      )
    }

    // Fetch settings
    const { data: settings } = await supabase
      .from('planner_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!settings || !settings.setup_completed) {
      return NextResponse.json({ error: 'SETUP_REQUIRED' }, { status: 400 })
    }

    const plannerSettings = settings as PlannerSettings

    // Fetch active pillars
    let pillarsQuery = supabase
      .from('content_pillars')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (body.pillarIds?.length) {
      pillarsQuery = pillarsQuery.in('id', body.pillarIds)
    }

    const { data: pillars } = await pillarsQuery
    if (!pillars || pillars.length === 0) {
      return NextResponse.json({ error: 'No active content pillars found' }, { status: 400 })
    }

    // Calculate posting dates for the month
    const allDates = getPostingDatesForMonth(
      targetYear,
      targetMonthIdx - 1,
      plannerSettings.preferred_days,
    )

    let datesToFill = allDates

    if (!regenerateAll) {
      // Skip dates that already have non-idea posts
      const { data: existing } = await supabase
        .from('planned_posts')
        .select('planned_date, status')
        .eq('user_id', user.id)
        .gte('planned_date', `${month}-01`)
        .lte('planned_date', `${month}-31`)
        .neq('status', 'idea')

      const occupiedDates = new Set((existing ?? []).map((p) => p.planned_date))
      datesToFill = allDates.filter((d) => !occupiedDates.has(d))
    }

    if (datesToFill.length === 0) {
      return NextResponse.json({ posts: [], count: 0 })
    }

    // Format date for prompt
    const dateLabels = datesToFill.map((d) => {
      const dt = new Date(d + 'T00:00:00')
      return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'long' })
    })

    const pillarList = (pillars as ContentPillar[])
      .map((p) => `- ${p.name} (${p.weight} priority): ${p.description}`)
      .join('\n')

    const { format_mix } = plannerSettings

    const prompt = `Create a LinkedIn content plan for the following professional.

PROFILE:
Niche: ${niche}
Goals: ${plannerSettings.goals.join(', ') || 'General professional visibility'}
Posting frequency: ${plannerSettings.posting_frequency} times per week
Preferred days: ${plannerSettings.preferred_days.join(', ')}

CONTENT PILLARS:
${pillarList}

DATES NEEDING CONTENT:
${dateLabels.join('\n')}

FORMAT MIX TARGET:
Text posts: ${format_mix.text}%
Carousels: ${format_mix.carousel}%
Poll posts: ${format_mix.poll}%
Question posts: ${format_mix.question}%

INSTRUCTIONS:
1. Assign exactly one topic per date listed
2. Assign each post to the most appropriate pillar
3. Distribute formats according to the mix target
4. High-weight pillars should appear more often
5. Never put two controversial or vulnerable posts back to back
6. Schedule highest-impact posts (controversial, data-driven, hot takes) on Tuesday and Thursday
7. Educational and inspirational content works well on Monday and Wednesday
8. End-of-week posts should be lighter and more personal
9. Topics must be SPECIFIC — not 'leadership tips' but 'The day I had to fire my best employee and what I wish I had known'
10. Include one carousel every 7-10 posts as they get highest reach

Return ONLY valid JSON:
{
  "posts": [
    {
      "planned_date": "YYYY-MM-DD",
      "title": "Short title max 60 chars",
      "topic": "Specific topic description",
      "hook_suggestion": "First line of the post",
      "format": "text|carousel|poll|question",
      "pillar_name": "exact pillar name",
      "tone_id": "tone key",
      "why_this_week": "One sentence on timing"
    }
  ]
}`

    const msg = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system:     'You are a LinkedIn content strategist for Indian professionals. You create specific, compelling, varied content plans. You understand what performs well on LinkedIn India. You never suggest generic topics — every suggestion is concrete, specific, and immediately actionable.',
      messages:   [{ role: 'user', content: prompt }],
    })

    const rawText   = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    const tokensUsed = msg.usage.input_tokens + msg.usage.output_tokens

    const parsed = extractJSON(rawText) as { posts: {
      planned_date:    string
      title:           string
      topic:           string
      hook_suggestion: string
      format:          string
      pillar_name:     string
      tone_id:         string
      why_this_week:   string
    }[] }

    const pillarMap = new Map((pillars as ContentPillar[]).map((p) => [p.name.toLowerCase(), p.id]))

    const plannedTime = plannerSettings.preferred_time ?? '08:00'

    // Delete existing 'idea' status posts for this month if regenerateAll
    if (regenerateAll) {
      await supabase
        .from('planned_posts')
        .delete()
        .eq('user_id', user.id)
        .eq('status', 'idea')
        .gte('planned_date', `${month}-01`)
        .lte('planned_date', `${month}-31`)
    }

    const inserts = parsed.posts.map((p) => ({
      user_id:         user.id,
      pillar_id:       pillarMap.get(p.pillar_name?.toLowerCase()) ?? null,
      post_id:         null,
      title:           (p.title ?? '').slice(0, 60),
      topic:           p.topic ?? '',
      hook_suggestion: p.hook_suggestion ?? '',
      format:          (['text', 'carousel', 'poll', 'question'].includes(p.format) ? p.format : 'text') as 'text' | 'carousel' | 'poll' | 'question',
      tone_id:         p.tone_id ?? 'professional',
      why_this_week:   p.why_this_week ?? '',
      planned_date:    p.planned_date,
      planned_time:    plannedTime,
      status:          'idea' as const,
    }))

    const { data: saved, error: insertError } = await supabase
      .from('planned_posts')
      .insert(inserts)
      .select(`*, pillar:content_pillars(*)`)

    if (insertError) throw insertError

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id:     user.id,
      action:      'generate_plan',
      tokens_used: tokensUsed,
      metadata:    { month, posts_count: inserts.length },
    })

    return NextResponse.json({ posts: saved ?? [], count: (saved ?? []).length })
  } catch (err) {
    console.error('[POST /api/planner/generate]', err)
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}
