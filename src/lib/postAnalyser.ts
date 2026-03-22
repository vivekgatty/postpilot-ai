import { anthropic } from '@/lib/anthropic'
import type {
  AnalysisSuggestion,
  TimingRecommendation,
  BulkAnalysisPost,
} from '@/types'
import type { DeterministicScores } from '@/lib/postScoring'
import { TIMING_BY_TYPE } from '@/lib/analyserConfig'

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  return text.trim()
}

// ── Function 1: runAiAnalysis ─────────────────────────────────────────────────

export async function runAiAnalysis(
  content: string,
  postType: string,
  niche: string,
  deterministicScores: DeterministicScores,
  plan: string
): Promise<{
  aiScores: Record<string, number>
  suggestions: AnalysisSuggestion[]
  hook_alternatives: string[]
  cta_alternatives: string[]
  timing_recommendation: TimingRecommendation
}> {
  const systemPrompt =
    'You are an expert LinkedIn content analyst. ' +
    'You evaluate posts with precision and give specific, actionable feedback. ' +
    'You understand LinkedIn\'s algorithm deeply. ' +
    'You score honestly — never inflate scores to make users feel good. ' +
    'A score of 70+ should be genuinely earned.'

  const suggestionsCount = plan === 'free' ? 1 : 5

  const userMessage = `Analyse this LinkedIn post and return scores and suggestions.

POST TYPE: ${postType}
NICHE: ${niche}
CHARACTER COUNT: ${deterministicScores.character_count}
HAS EXTERNAL LINK: ${deterministicScores.has_external_link}
WEAK OPENER DETECTED: ${deterministicScores.has_weak_opener}
CORPORATE FILLER DETECTED: ${deterministicScores.has_corporate_filler}
FILLER PHRASES FOUND: ${deterministicScores.filler_matches.join(', ') || 'none'}

POST CONTENT:
${content}

Score these qualitative dimensions (use the exact key names, return numbers only):
- hook_quality: 0-12 (does line 1 create curiosity, tension, or a strong promise? Is it concrete rather than abstract?)
- readability_quality: 0-9 (sentence rhythm, variety, visual scanability, bullet use)
- value: 0-15 (specific insight, original angle, reader learns something new)
- cta_quality: 0-6 (is ending question specific and genuinely engaging? relevant to content?)
- authenticity_quality: 0-7 (sounds human, has personal detail, genuine perspective)
- specificity_quality: 0-6 (concrete examples, believable claims, real situations referenced)
- emotion: 0-8 (clear emotional hook: curiosity / inspiration / surprise / validation / controversy)
- relevance: 0-3 (single focused topic, professional)

Also generate:
- 3 alternative hook rewrites (if hook_quality < 9)
- 3 alternative CTA questions (if cta_quality < 4)
- Up to ${suggestionsCount} specific improvement suggestions for the weakest dimensions

Return ONLY valid JSON:
{
  "scores": {
    "hook_quality": 0,
    "readability_quality": 0,
    "value": 0,
    "cta_quality": 0,
    "authenticity_quality": 0,
    "specificity_quality": 0,
    "emotion": 0,
    "relevance": 0
  },
  "hook_alternatives": [
    "Alternative hook 1",
    "Alternative hook 2",
    "Alternative hook 3"
  ],
  "cta_alternatives": [
    "Alternative CTA question 1",
    "Alternative CTA question 2",
    "Alternative CTA question 3"
  ],
  "suggestions": [
    {
      "id": "sug_1",
      "dimension_id": "hook",
      "type": "hook_rewrite",
      "title": "Short action title",
      "problem": "Specific description of the problem",
      "suggestion": "Specific instruction of what to do",
      "rewritten_content": "Ready to paste replacement text if applicable",
      "alternatives": null,
      "estimated_points_gain": 5,
      "is_applied": false
    }
  ]
}`

  const makeCall = async () => {
    const msg = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })
    const block = msg.content[0]
    if (block.type !== 'text') throw new Error('Unexpected Anthropic response type')
    return block.text
  }

  let text = await makeCall()

  let parsed: {
    scores: Record<string, number>
    hook_alternatives: string[]
    cta_alternatives: string[]
    suggestions: Array<{
      id: string
      dimension_id: string
      type: string
      title: string
      problem: string
      suggestion: string
      rewritten_content?: string | null
      alternatives?: string[] | null
      estimated_points_gain: number
      is_applied: boolean
    }>
  }

  try {
    parsed = JSON.parse(extractJSON(text))
  } catch {
    text = await makeCall()
    parsed = JSON.parse(extractJSON(text))
  }

  const suggestions: AnalysisSuggestion[] = (parsed.suggestions || []).map(s => ({
    id: s.id,
    dimension_id: s.dimension_id,
    type: s.type as AnalysisSuggestion['type'],
    title: s.title,
    problem: s.problem,
    suggestion: s.suggestion,
    rewritten_content: s.rewritten_content ?? undefined,
    alternatives: s.alternatives ?? undefined,
    estimated_points_gain: s.estimated_points_gain,
    is_applied: s.is_applied,
  }))

  const timing = TIMING_BY_TYPE[postType as keyof typeof TIMING_BY_TYPE] || TIMING_BY_TYPE.text
  const timing_recommendation: TimingRecommendation = {
    best_day: timing.day,
    best_time: timing.time,
    reason: timing.reason,
    post_type_note: 'Optimal for ' + postType + ' posts',
  }

  return {
    aiScores: parsed.scores || {},
    suggestions,
    hook_alternatives: parsed.hook_alternatives || [],
    cta_alternatives: parsed.cta_alternatives || [],
    timing_recommendation,
  }
}

// ── Function 2: runBulkAnalysis ───────────────────────────────────────────────

export async function runBulkAnalysis(
  posts: string[],
  postType: string,
  niche: string
): Promise<{ posts: BulkAnalysisPost[]; winner_index: number }> {
  const systemPrompt =
    'You are an expert LinkedIn content analyst. ' +
    'You evaluate posts with precision and give specific, actionable feedback. ' +
    'You understand LinkedIn\'s algorithm deeply. ' +
    'You score honestly — never inflate scores to make users feel good. ' +
    'A score of 70+ should be genuinely earned.'

  const userMessage = `Compare these ${posts.length} LinkedIn posts and score each one.

NICHE: ${niche}
POST TYPE: ${postType}

${posts.map((p, i) => `POST ${i + 1}:\n${p}`).join('\n\n---\n\n')}

For each post give:
- overall score 0-100
- grade (A+/A/B/C/D/F)
- hook_score 0-20
- one sentence summary of its main strength and main weakness

Return ONLY valid JSON:
{
  "posts": [
    {
      "score": 72,
      "grade": "B",
      "hook_score": 14,
      "summary": "Strong hook but weak CTA"
    }
  ],
  "winner_index": 0
}`

  const msg = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected Anthropic response type')

  const parsed: {
    posts: Array<{ score: number; grade: string; hook_score: number; summary: string }>
    winner_index: number
  } = JSON.parse(extractJSON(block.text))

  const resultPosts: BulkAnalysisPost[] = parsed.posts.map((p, i) => ({
    content: posts[i],
    score: p.score,
    grade: p.grade,
    hook_score: p.hook_score,
    summary: p.summary,
  }))

  return {
    posts: resultPosts,
    winner_index: parsed.winner_index,
  }
}
