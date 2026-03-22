export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, AI_MODEL } from '@/lib/anthropic'
import { handleAnthropicError } from '@/lib/handleAnthropicError'
import { SYSTEM_TONES } from '@/lib/constants'
import type { RepurposeAngle, RepurposeSettings, RepurposedPost, CarouselSlide } from '@/types'

function extractJSON(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return JSON.parse(fenced[1].trim())
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj) return JSON.parse(obj[0])
  return JSON.parse(text.trim())
}

// ── POST /api/repurpose/regenerate-post ───────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: {
      session_id:       string
      angle:            RepurposeAngle
      settings:         RepurposeSettings
      previous_content: string
    }
    try { body = await req.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { session_id, angle, settings, previous_content } = body

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('repurpose_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const toneConfig   = SYSTEM_TONES[settings.tone_id] ?? SYSTEM_TONES['professional']
    const tonePrompt   = toneConfig.systemPrompt

    const prompt = `Regenerate this LinkedIn post from the same source material but with a COMPLETELY DIFFERENT approach.

SOURCE: ${session.source_title ?? ''}
ANGLE: ${angle.title} — ${angle.description}
FORMAT: ${angle.format}
TONE: ${tonePrompt}

SOURCE EXCERPT:
${(session.extracted_text ?? '').slice(0, 3000)}

PREVIOUS VERSION (do NOT repeat this approach or hook):
${previous_content.slice(0, 500)}

Generate one fresh post with a different hook, different structure, and different examples from the source material.

Return ONLY valid JSON:
{
  "content": "...",
  "carousel_slides": null,
  "poll_options": null
}`

    const msg = await anthropic.messages.create({
      model:      AI_MODEL,
      max_tokens: 1000,
      messages:   [{ role: 'user', content: prompt }],
    })

    const block = msg.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response type')

    const parsed = extractJSON(block.text) as {
      content:          string
      carousel_slides:  CarouselSlide[] | null
      poll_options:     string[] | null
    }

    const validFormats = new Set(['text', 'carousel', 'question', 'poll'])
    const post: RepurposedPost = {
      angle_id:        angle.id,
      angle_title:     angle.title,
      content:         parsed.content ?? '',
      format:          (validFormats.has(angle.format) ? angle.format : 'text') as RepurposedPost['format'],
      character_count: (parsed.content ?? '').length,
      tone_id:         settings.tone_id,
    }
    if (post.format === 'carousel' && Array.isArray(parsed.carousel_slides)) {
      post.carousel_slides = parsed.carousel_slides
    }
    if (post.format === 'poll' && Array.isArray(parsed.poll_options)) {
      post.poll_options = parsed.poll_options
    }

    return NextResponse.json({ post })
  } catch (err) {
    const anthropicRes = handleAnthropicError(err)
    if (anthropicRes) return anthropicRes
    console.error('[POST /api/repurpose/regenerate-post]', err)
    return NextResponse.json({ error: 'Failed to regenerate post' }, { status: 500 })
  }
}
