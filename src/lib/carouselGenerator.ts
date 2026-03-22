import { anthropic, AI_MODEL } from '@/lib/anthropic'
import { SYSTEM_TONES } from '@/lib/constants'
import { getTypeById } from '@/lib/carouselConfig'
import type { CarouselSlide, CarouselConfig, AuthorBranding } from '@/types'

// ── JSON extraction helper ────────────────────────────────────────────────────

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  return text.trim()
}

// ── System prompt ─────────────────────────────────────────────────────────────

const CAROUSEL_SYSTEM_PROMPT =
  'You are an expert LinkedIn carousel content creator for Indian professionals. ' +
  'You write slide content that is specific, punchy, and immediately valuable. ' +
  'Every slide must stand alone as a useful insight. ' +
  'Headlines are short (3-7 words). ' +
  'Body text is concise (20-40 words per slide). ' +
  'You write in a professional voice that sounds human.'

// ── Main generator ────────────────────────────────────────────────────────────

export async function generateCarouselSlides(
  config: CarouselConfig,
  authorBranding: AuthorBranding,
): Promise<{ slides: CarouselSlide[]; title: string; tokensUsed: number }> {
  const carouselType = getTypeById(config.carousel_type)
  const tone = SYSTEM_TONES[config.tone_id] ?? SYSTEM_TONES['professional']
  const toneDescription = tone.description

  const userMessage = `Create a LinkedIn carousel with exactly ${config.slide_count} slides.

TOPIC: ${config.topic}
CAROUSEL TYPE: ${carouselType?.label ?? config.carousel_type} — ${carouselType?.description ?? ''}
NICHE: ${config.niche}
TONE: ${toneDescription}
AUTHOR: ${authorBranding.full_name}
AUTHOR HANDLE: @${authorBranding.handle}

SLIDE STRUCTURE REQUIRED:
Slide 1: TITLE slide — the hook that stops scrolling. Strong 6-10 word headline. Optional 1-sentence sub-line.
Slides 2 to ${config.slide_count - 1}: CONTENT slides — one idea per slide. Short bold heading 3-6 words. Body 20-40 words. For list or how-to types include a number_badge like 01, 02 etc.
Slide ${config.slide_count}: CTA slide — one clear action for the reader. Include the author name and handle.

CRITICAL REQUIREMENTS:
- Title slide hook must be specific to the topic — no generic openers
- Each content slide covers exactly ONE idea
- Body text fits in 40 words maximum
- Content must be specific to the actual topic provided — no generic placeholder advice
- The CTA slide must tell readers exactly what to do next (follow, comment with X, save this)
- Use Indian context where natural (rupee not dollar, Indian companies as examples if relevant)

Return ONLY valid JSON with no markdown:
{
  "carousel_title": "Short descriptive title",
  "slides": [
    {
      "id": "slide_1",
      "slide_number": 1,
      "type": "title",
      "heading": "...",
      "body": "...",
      "sub_line": "optional sub-line"
    },
    {
      "id": "slide_2",
      "slide_number": 2,
      "type": "content",
      "heading": "...",
      "body": "...",
      "number_badge": "01"
    },
    {
      "id": "slide_N",
      "slide_number": ${config.slide_count},
      "type": "cta",
      "heading": "...",
      "body": "...",
      "cta_text": "Follow me for more",
      "author_name": "${authorBranding.full_name}",
      "author_handle": "@${authorBranding.handle}"
    }
  ]
}`

  const makeCall = async () => {
    const msg = await anthropic.messages.create({
      model:      AI_MODEL,
      max_tokens: 2500,
      system:     CAROUSEL_SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: userMessage }],
    })
    const block = msg.content[0]
    if (block.type !== 'text') throw new Error('Unexpected Anthropic response type')
    return {
      text:       block.text,
      tokensUsed: msg.usage.input_tokens + msg.usage.output_tokens,
    }
  }

  let attempt = await makeCall()
  let parsed: { carousel_title: string; slides: CarouselSlide[] }

  try {
    parsed = JSON.parse(extractJSON(attempt.text))
  } catch {
    // Retry once with simplified prompt
    const retryMsg = await anthropic.messages.create({
      model:      AI_MODEL,
      max_tokens: 2500,
      system:     CAROUSEL_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userMessage },
        { role: 'assistant', content: attempt.text },
        {
          role: 'user',
          content:
            'Your response was not valid JSON. Return ONLY the raw JSON object with no markdown fences, no explanation, no text before or after the JSON.',
        },
      ],
    })
    const retryBlock = retryMsg.content[0]
    if (retryBlock.type !== 'text') throw new Error('Unexpected Anthropic response type on retry')
    attempt = {
      text:       retryBlock.text,
      tokensUsed: attempt.tokensUsed + retryMsg.usage.input_tokens + retryMsg.usage.output_tokens,
    }
    parsed = JSON.parse(extractJSON(attempt.text))
  }

  return {
    slides:     parsed.slides,
    title:      parsed.carousel_title,
    tokensUsed: attempt.tokensUsed,
  }
}

// ── Single slide regenerator ──────────────────────────────────────────────────

export async function regenerateSingleSlide(
  slide:    CarouselSlide,
  topic:    string,
  niche:    string,
  tone_id:  string,
  context:  string,
): Promise<CarouselSlide> {
  const userMessage = `Regenerate slide ${slide.slide_number} for a carousel about: ${topic}
Slide type: ${slide.type}
Current content — do NOT repeat this:
  Heading: ${slide.heading}
  Body: ${slide.body}
Context from other slides: ${context}
Generate a completely fresh version.
Return ONLY valid JSON matching this shape:
{ "id": "...", "slide_number": ${slide.slide_number}, "type": "${slide.type}", "heading": "...", "body": "...", "sub_line": "...", "number_badge": "...", "cta_text": "...", "author_name": "...", "author_handle": "..." }`

  const msg = await anthropic.messages.create({
    model:      AI_MODEL,
    max_tokens: 400,
    system:     CAROUSEL_SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: userMessage }],
  })

  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected Anthropic response type')

  const raw = JSON.parse(extractJSON(block.text)) as Partial<CarouselSlide>

  return {
    ...raw,
    id:           slide.id,
    slide_number: slide.slide_number,
    type:         slide.type,
    heading:      raw.heading ?? slide.heading,
    body:         raw.body    ?? slide.body,
  }
}
