export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic'
import { handleAnthropicError } from '@/lib/handleAnthropicError'
import type { ContentPillar } from '@/types'

function extractJSON(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found')
  return JSON.parse(match[0])
}

// ── POST /api/planner/regenerate-post ────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: { postId: string; keepDate?: boolean }
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const { postId } = body

    // Fetch the post
    const { data: post, error: postErr } = await supabase
      .from('planned_posts')
      .select(`*, pillar:content_pillars(*)`)
      .eq('id', postId)
      .eq('user_id', user.id)
      .single()

    if (postErr || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('niche')
      .eq('id', user.id)
      .single()

    const niche   = profile?.niche ?? 'Other'
    const pillar  = post.pillar as ContentPillar | null
    const dateObj = new Date(post.planned_date + 'T00:00:00')
    const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'long' })

    const prompt = `Generate one LinkedIn post idea for:
Date: ${post.planned_date} (${dayName})
Pillar: ${pillar?.name ?? 'General'} — ${pillar?.description ?? ''}
Tone: ${post.tone_id}
Niche: ${niche}

The previous suggestion was: ${post.topic}

Generate something DIFFERENT and more specific. Return ONLY valid JSON:
{"title":"...","topic":"...","hook_suggestion":"...","why_this_week":"..."}`

    const msg = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system:     'You are a LinkedIn content strategist for Indian professionals. Generate specific, compelling post ideas.',
      messages:   [{ role: 'user', content: prompt }],
    })

    const rawText = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    const parsed  = extractJSON(rawText) as {
      title: string
      topic: string
      hook_suggestion: string
      why_this_week: string
    }

    const { data: updated, error: updateErr } = await supabase
      .from('planned_posts')
      .update({
        title:           parsed.title           ?? post.title,
        topic:           parsed.topic           ?? post.topic,
        hook_suggestion: parsed.hook_suggestion ?? post.hook_suggestion,
        why_this_week:   parsed.why_this_week   ?? post.why_this_week,
      })
      .eq('id', postId)
      .eq('user_id', user.id)
      .select(`*, pillar:content_pillars(*)`)
      .single()

    if (updateErr) throw updateErr

    return NextResponse.json({ post: updated })
  } catch (err) {
    const anthropicRes = handleAnthropicError(err)
    if (anthropicRes) return anthropicRes
    console.error('[POST /api/planner/regenerate-post]', err)
    return NextResponse.json({ error: 'Failed to regenerate post' }, { status: 500 })
  }
}
