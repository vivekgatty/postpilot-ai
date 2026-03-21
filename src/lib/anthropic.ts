import Anthropic from '@anthropic-ai/sdk'
import type { GeneratedPost, HookResult } from '@/types'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const AI_MODEL = 'claude-haiku-4-5-20251001'

const INDIAN_CONTEXT_SUFFIX =
  '\n\nYou write for Indian professionals. Reference Indian context (companies, cities, ₹ not $) ONLY when it genuinely fits — never force it.'

// ── JSON extraction helper ────────────────────────────────────────────────────

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
// toneSystemPrompt — pre-resolved by the API route (system tone or custom tone prompt)
// formatPrompt     — pre-resolved format instruction to append to user message

export async function generateLinkedInPosts(
  topic:             string,
  toneSystemPrompt:  string,
  niche:             string,
  userName?:         string,
  formatPrompt?:     string,
): Promise<GenerateResult> {
  const systemPrompt = toneSystemPrompt + INDIAN_CONTEXT_SUFFIX

  const structureSection = formatPrompt
    ? `\n\nSTRUCTURE: Format each post variation using this structure guideline:\n${formatPrompt}\nFollow this structure for all 3 variations. Each variation should interpret the structure differently while respecting the same skeleton.`
    : ''

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
- Sound like a real human professional — no corporate jargon${structureSection}

Return ONLY valid JSON, no markdown:
{"posts":[{"variation":1,"content":"..."},{"variation":2,"content":"..."},{"variation":3,"content":"..."}]}`

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

  let attempt = await makeCall()
  let parsed: { posts: Array<{ variation: number; content: string }> }

  try {
    parsed = JSON.parse(extractJSON(attempt.text))
  } catch {
    attempt = await makeCall()
    parsed  = JSON.parse(extractJSON(attempt.text))
  }

  const posts: GeneratedPost[] = parsed.posts.map(p => ({
    variation: p.variation,
    content:   p.content,
  }))

  return { posts, tokensUsed: attempt.tokensUsed }
}

// ── Ideas generation ──────────────────────────────────────────────────────────

export async function generatePostIdeas(
  industry: string,
  role:     string,
  count     = 10,
): Promise<string[]> {
  const msg = await anthropic.messages.create({
    model:      AI_MODEL,
    max_tokens: 1024,
    messages: [
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

// ── Hook generation ───────────────────────────────────────────────────────────

export interface HookStyleInput {
  id:       string
  label:    string
  category: string
  template: string
}

export interface GenerateHooksResult {
  hooks:      HookResult[]
  tokensUsed: number
}

export async function generateHooks(
  idea:           string,
  niche:          string,
  goal:           string,
  styles:         HookStyleInput[],
): Promise<GenerateHooksResult> {
  const GOAL_DESCRIPTIONS: Record<string, string> = {
    comments:    'Maximise comments and discussion',
    credibility: 'Build authority and credibility in the niche',
    followers:   'Attract new followers from the target audience',
    leads:       'Generate inbound leads or enquiries',
    story:       'Build emotional connection through storytelling',
    debate:      'Spark healthy debate and contrasting viewpoints',
  }

  const goalDesc = GOAL_DESCRIPTIONS[goal] ?? goal

  const styleList = styles.map((s, i) =>
    `${i + 1}. id="${s.id}" | Style: "${s.label}" (${s.category}) | Template: ${s.template}`
  ).join('\n')

  const systemPrompt =
    'You are an elite LinkedIn copywriter specialising in scroll-stopping opening lines for Indian professionals. ' +
    'You write hooks that feel authentic, human, and impossible to scroll past. ' +
    'Never use hollow phrases like "In today\'s world", "I want to share", or "Have you ever". ' +
    'Reference Indian context (companies, cities, ₹) only when it genuinely fits — never force it.'

  const userMessage = `Write one LinkedIn hook line for each of the following hook styles.

POST IDEA: ${idea}
NICHE: ${niche}
GOAL: ${goalDesc}

HOOK STYLES TO WRITE:
${styleList}

REQUIREMENTS:
- Each hook is a single opening line (or 2 short lines max)
- 80–160 characters each
- Directly relevant to the post idea
- Match the style's energy and template pattern
- Sound like a real Indian professional wrote it
- Never start with "I want to share" or "In today's world"

Return ONLY valid JSON — no markdown, no explanation:
{"hooks":[{"styleId":"...","content":"..."},...]}`

  const msg = await anthropic.messages.create({
    model:      AI_MODEL,
    max_tokens: 1024,
    system:     systemPrompt,
    messages:   [{ role: 'user', content: userMessage }],
  })

  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected Anthropic response type')

  const tokensUsed = msg.usage.input_tokens + msg.usage.output_tokens

  let parsed: { hooks: Array<{ styleId: string; content: string }> }
  try {
    parsed = JSON.parse(extractJSON(block.text))
  } catch {
    throw new Error('Failed to parse hooks response from AI')
  }

  const styleMap = new Map(styles.map(s => [s.id, s]))

  const hooks: HookResult[] = parsed.hooks.map(h => {
    const style = styleMap.get(h.styleId)
    return {
      id:             `${h.styleId}-${Date.now()}`,
      styleId:        h.styleId,
      styleLabel:     style?.label ?? h.styleId,
      category:       style?.category ?? '',
      content:        h.content,
      characterCount: h.content.length,
    }
  })

  return { hooks, tokensUsed }
}
