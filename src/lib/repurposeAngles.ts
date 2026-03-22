import { anthropic, AI_MODEL } from '@/lib/anthropic'
import { GENERIC_ANGLES_FREE } from '@/lib/repurposeConfig'
import type { RepurposeAngle } from '@/types'

function extractJSON(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return JSON.parse(fenced[1].trim())
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj) return JSON.parse(obj[0])
  return JSON.parse(text.trim())
}

export async function generateAngles(
  extractedText: string,
  title:         string,
  author:        string,
  niche:         string,
  postCount:     number,
  isPaid:        boolean,
): Promise<{ angles: RepurposeAngle[]; is_generic: boolean }> {
  if (!isPaid) {
    return { angles: GENERIC_ANGLES_FREE, is_generic: true }
  }

  const prompt = `Analyse this content and identify ${postCount} distinct angles for LinkedIn posts. Each angle must be specific to this actual content.

TITLE: ${title}
AUTHOR: ${author}
NICHE AUDIENCE: ${niche}
CONTENT: ${extractedText.slice(0, 4000)}${extractedText.length > 4000 ? '\n[...content continues...]' : ''}

Generate exactly ${postCount} angles. Each must:
- Reference something SPECIFIC from this content (a data point, an example, a framework, a story)
- Have a clear LinkedIn-appropriate hook
- Target a different emotion or reader goal
- Suggest the best format for that angle

Distribute formats approximately: 60% text posts, 25% carousel, 10% question posts, 5% poll posts.

Return ONLY valid JSON:
{
  "angles": [
    {
      "id": "angle_1",
      "title": "Short angle title (max 60 chars)",
      "description": "What specific insight from the content this post will cover (1-2 sentences)",
      "format": "text|carousel|question|poll",
      "emotional_hook": "The emotion this post triggers: curiosity|inspiration|surprise|validation|urgency"
    }
  ]
}`

  try {
    const msg = await anthropic.messages.create({
      model:      AI_MODEL,
      max_tokens: 1500,
      system:
        'You are a LinkedIn content strategist expert at identifying unique angles within long-form content. You find specific, concrete, memorable insights that will resonate with professional audiences. Never suggest generic angles — always tie each angle to something specific in the content.',
      messages: [{ role: 'user', content: prompt }],
    })

    const block = msg.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response type')

    const parsed = extractJSON(block.text) as {
      angles: Array<{
        id: string
        title: string
        description: string
        format: string
        emotional_hook: string
      }>
    }

    const validFormats = new Set(['text', 'carousel', 'question', 'poll'])
    const angles: RepurposeAngle[] = parsed.angles.map((a, i) => ({
      id:            a.id ?? `angle_${i + 1}`,
      title:         (a.title ?? '').slice(0, 60),
      description:   a.description ?? '',
      format:        (validFormats.has(a.format) ? a.format : 'text') as RepurposeAngle['format'],
      emotional_hook: a.emotional_hook ?? 'curiosity',
    }))

    return { angles, is_generic: false }
  } catch {
    return { angles: GENERIC_ANGLES_FREE, is_generic: true }
  }
}
