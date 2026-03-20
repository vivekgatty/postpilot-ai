import Anthropic from '@anthropic-ai/sdk'
import type { ToneType, GeneratedPost } from '@/types'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const AI_MODEL = 'claude-haiku-4-5-20251001'

// ── Tone system prompts ───────────────────────────────────────────────────────

export const TONE_SYSTEM_PROMPTS: Record<ToneType, string> = {
  professional:
    'You are a senior business leader and LinkedIn thought leader in India. You write with authority and precision. You simplify complex ideas without dumbing them down. Every sentence earns its place. No buzzwords, no filler.',

  storytelling:
    'You are a master storyteller on LinkedIn. You write with vulnerability and authenticity. Your structure: situation → struggle → lesson. You make readers feel something before they think something. Your first line always creates an emotional pull.',

  controversial:
    'You are a bold contrarian thinker on LinkedIn India. You challenge popular wisdom with evidence and real experience. You spark debates that make intelligent people stop and think. You are provocative but never personal or cruel.',

  educational:
    'You are a top educator on LinkedIn for busy Indian professionals. You break down complex topics into clean frameworks. You use numbered steps, real analogies and concrete examples. Every reader leaves knowing something useful.',

  inspirational:
    'You are a motivational voice for Indian founders and professionals. You tell stories of resilience and growth. You make people believe their next level is possible. Your posts always end with a challenge that stirs people to act.',
}

const INDIAN_CONTEXT_SUFFIX =
  '\n\nYou write for Indian professionals. Reference Indian context (companies, cities, ₹ not $) ONLY when it genuinely fits — never force it.'

// ── JSON extraction helper ────────────────────────────────────────────────────
// Model sometimes wraps output in ```json ... ``` fences — strip them.

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  return text.trim()
}

// ── Return type ───────────────────────────────────────────────────────────────

export interface GenerateResult {
  posts:      GeneratedPost[]
  tokensUsed: number
}

// ── Main generation function ──────────────────────────────────────────────────

export async function generateLinkedInPosts(
  topic:     string,
  tone:      ToneType,
  niche:     string,
  userName?: string,
): Promise<GenerateResult> {
  const systemPrompt = TONE_SYSTEM_PROMPTS[tone] + INDIAN_CONTEXT_SUFFIX

  const userMessage = `Generate exactly 3 different LinkedIn post variations about:

TOPIC: ${topic}
NICHE: ${niche}${userName ? `\nAUTHOR: ${userName}` : ''}

HARD REQUIREMENTS:
- Each post: 800–1500 characters exactly (count carefully)
- Variation 1: QUESTION hook opening
- Variation 2: BOLD STATEMENT or STATISTIC hook
- Variation 3: PERSONAL STORY or SCENARIO hook
- Line breaks every 2–3 sentences for readability
- End every post with a specific question or CTA that invites comments
- Include 3–5 relevant hashtags on the FINAL line only
- NEVER open with: 'I want to share', 'Today I learned', 'In today's world', 'Have you ever'
- Sound like a real human professional — no corporate jargon

Return ONLY valid JSON, no markdown:
{"posts":[{"variation":1,"content":"..."},{"variation":2,"content":"..."},{"variation":3,"content":"..."}]}`

  // ── Single API call that returns all 3 variations ─────────────────────────

  const makeCall = async () => {
    const msg = await anthropic.messages.create({
      model:      AI_MODEL,
      max_tokens: 2000,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userMessage }],
    })

    const block = msg.content[0]
    if (block.type !== 'text') throw new Error('Unexpected Anthropic response type')

    return {
      text:       block.text,
      tokensUsed: msg.usage.input_tokens + msg.usage.output_tokens,
    }
  }

  // ── Parse with one retry on JSON failure ──────────────────────────────────

  let attempt = await makeCall()

  let parsed: { posts: Array<{ variation: number; content: string }> }

  try {
    parsed = JSON.parse(extractJSON(attempt.text))
  } catch {
    // Retry once — model may have hallucinated extra text
    attempt = await makeCall()
    parsed  = JSON.parse(extractJSON(attempt.text))
  }

  const posts: GeneratedPost[] = parsed.posts.map(p => ({
    variation: p.variation,
    content:   p.content,
  }))

  return { posts, tokensUsed: attempt.tokensUsed }
}

// ── Ideas generation (unchanged) ─────────────────────────────────────────────

export async function generatePostIdeas(
  industry: string,
  role:     string,
  count     = 10,
): Promise<string[]> {
  const msg = await anthropic.messages.create({
    model:      AI_MODEL,
    max_tokens: 1024,
    messages:   [
      {
        role:    'user',
        content: `Generate ${count} LinkedIn post ideas for an Indian professional.

Industry: ${industry}
Role: ${role}

Requirements:
- Each idea should be specific and actionable
- Mix personal stories, industry insights, tips, and thought leadership
- Relevant to the Indian market and professional context
- Return ONLY a JSON array of strings, no other text

Example format: ["Idea 1", "Idea 2", ...]`,
      },
    ],
  })

  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')

  try {
    return JSON.parse(block.text) as string[]
  } catch {
    return block.text.split('\n').filter(Boolean).slice(0, count)
  }
}
