import { anthropic, AI_MODEL } from '@/lib/anthropic'
import { SYSTEM_TONES } from '@/lib/constants'
import type { RepurposeAngle, RepurposeSettings, RepurposedPost, CarouselSlide } from '@/types'

function extractJSON(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return JSON.parse(fenced[1].trim())
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj) return JSON.parse(obj[0])
  return JSON.parse(text.trim())
}

function getTonePrompt(toneId: string): string {
  const tone = SYSTEM_TONES[toneId] ?? SYSTEM_TONES['professional']
  return tone.systemPrompt
}

export async function generateRepurposedPosts(
  extractedText:  string,
  sourceTitle:    string,
  sourceAuthor:   string,
  angles:         RepurposeAngle[],
  settings:       RepurposeSettings,
  userFullName?:  string,
): Promise<RepurposedPost[]> {
  const tonePrompt = getTonePrompt(settings.tone_id)

  const anglesText = angles
    .map(
      (a, i) =>
        `Angle ${i + 1}: ${a.title}\nFormat: ${a.format}\nWhat to cover: ${a.description}`,
    )
    .join('\n\n')

  const attributionNote = settings.add_attribution
    ? `- End each post with attribution: "(From: ${sourceTitle}${sourceAuthor ? ` by ${sourceAuthor}` : ''})"`
    : ''

  const userPrompt = `Repurpose the following content into LinkedIn posts. Generate one post per angle listed.

SOURCE TITLE: ${sourceTitle}
SOURCE AUTHOR: ${sourceAuthor}
${userFullName ? `POST AUTHOR (writing as): ${userFullName}` : ''}
NICHE: ${settings.niche}
TONE STYLE: ${tonePrompt}

SOURCE CONTENT:
${extractedText.slice(0, 5000)}${extractedText.length > 5000 ? '\n[Content continues — use insights from above]' : ''}

ANGLES TO GENERATE — create one post per angle:
${anglesText}

REQUIREMENTS FOR ALL POSTS:
- Each post uses ONLY information from the source
- 800-1500 characters per text post
- Strong hook on line 1 — no weak openers like "I want to share" or "Today I learned"
- Line breaks every 2-3 sentences
- End with a question or CTA
${settings.add_hashtags ? '- 3-5 relevant hashtags on final line' : '- No hashtags'}
- Write in first person as if YOU read this content and are sharing the insight
${attributionNote}

FOR CAROUSEL ANGLES:
Generate a full carousel structure:
- Title slide: bold statement (max 8 words)
- 6-8 content slides: one insight per slide with a clear heading (max 6 words) and body text (max 40 words per slide)
- Final CTA slide: action for the reader

FOR POLL ANGLES:
Generate the post text plus 4 poll options

Return ONLY valid JSON:
{
  "posts": [
    {
      "angle_id": "angle_1",
      "angle_title": "...",
      "format": "text|carousel|question|poll",
      "content": "full post text",
      "carousel_slides": null,
      "poll_options": null
    }
  ]
}`

  const makeCall = async () => {
    const msg = await anthropic.messages.create({
      model:      AI_MODEL,
      max_tokens: 4000,
      system:
        'You are an expert LinkedIn ghostwriter for Indian professionals. You repurpose existing content into high-performing LinkedIn posts. You extract specific insights, data, stories, and frameworks from source material. You NEVER make up information not present in the source. Your posts sound authentically human.',
      messages: [{ role: 'user', content: userPrompt }],
    })
    const block = msg.content[0]
    if (block.type !== 'text') throw new Error('Unexpected Anthropic response type')
    return {
      text:       block.text,
      tokensUsed: msg.usage.input_tokens + msg.usage.output_tokens,
    }
  }

  let attempt = await makeCall()
  let parsed: {
    posts: Array<{
      angle_id:       string
      angle_title:    string
      format:         string
      content:        string
      carousel_slides: CarouselSlide[] | null
      poll_options:   string[] | null
    }>
  }

  try {
    parsed = extractJSON(attempt.text) as typeof parsed
  } catch {
    // Retry once with simpler prompt
    attempt = await makeCall()
    parsed  = extractJSON(attempt.text) as typeof parsed
  }

  const validFormats = new Set(['text', 'carousel', 'question', 'poll'])

  return parsed.posts.map(p => {
    const format = (validFormats.has(p.format) ? p.format : 'text') as RepurposedPost['format']
    const post: RepurposedPost = {
      angle_id:        p.angle_id ?? '',
      angle_title:     p.angle_title ?? '',
      content:         p.content ?? '',
      format,
      character_count: (p.content ?? '').length,
      tone_id:         settings.tone_id,
    }
    if (format === 'carousel' && Array.isArray(p.carousel_slides)) {
      post.carousel_slides = p.carousel_slides
    }
    if (format === 'poll' && Array.isArray(p.poll_options)) {
      post.poll_options = p.poll_options
    }
    return post
  })
}
