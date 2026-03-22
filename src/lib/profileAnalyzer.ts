import { anthropic } from '@/lib/anthropic'
import type {
  ProfileInputData,
  ProfileAuditDimension,
  ProfileRecommendation,
  KeywordRecommendation,
  CompetitiveAnalysis,
  RewrittenExperience,
} from '@/types'
import { DIMENSION_CONFIG } from '@/lib/profileOptimizerConfig'

const SONNET_MODEL = 'claude-sonnet-4-6'
const HAIKU_MODEL = 'claude-haiku-4-5-20251001'

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  return text.trim()
}

// ── Function 1: generateRecommendations ──────────────────────────────────────

export interface RecommendationsResult {
  recommendations: ProfileRecommendation[]
  rewritten_headline: string[]
  rewritten_about: string
  rewritten_experiences: RewrittenExperience[]
  keyword_recommendations: KeywordRecommendation[]
}

export async function generateRecommendations(
  profileData: ProfileInputData,
  dimensionScores: Record<string, ProfileAuditDimension>,
  targetKeywords: string[],
  goal: string,
  targetAudience: string,
  niche: string,
  plan: string
): Promise<RecommendationsResult> {
  const systemPrompt = `You are the world's leading LinkedIn profile optimisation expert. You have helped thousands of Indian professionals build profiles that rank on page 1 of LinkedIn search, attract inbound clients, and dramatically increase post reach. You write specific, actionable, copy-ready recommendations. You never give generic advice. Every rewrite you produce sounds authentically human and is ready to copy-paste into LinkedIn. You understand LinkedIn's search algorithm deeply and map every recommendation to a specific algorithmic benefit.`

  const prevRolesText = profileData.previous_roles
    .slice(0, 2)
    .map(
      (r, i) =>
        `PREVIOUS ROLE ${i + 1}: ${r.title} at ${r.company}\n${r.description}`
    )
    .join('\n\n')

  const dimensionScoresText = Object.entries(dimensionScores)
    .map(([, v]) => `${v.label}: ${v.score}/${v.max_score} (${v.tier})`)
    .join('\n')

  const freePlanNote =
    plan === 'free'
      ? 'FREE PLAN: Generate top 3 recommendations only. No rewrites.'
      : ''

  const userMessage = `Analyse this LinkedIn profile and produce a complete optimisation report.

PROFILE OWNER DETAILS:
Name: ${profileData.full_name}
Current title: ${profileData.current_title}
Company: ${profileData.current_company}
Location: ${profileData.location}
Goal on LinkedIn: ${goal}
Target audience: ${targetAudience}
Niche: ${niche}
Target keywords: ${targetKeywords.join(', ')}

CURRENT PROFILE CONTENT:
HEADLINE (${profileData.headline.length} chars):
${profileData.headline}

ABOUT (${profileData.about.length} chars):
${profileData.about}

CURRENT ROLE DESCRIPTION:
${profileData.current_role_description}

${prevRolesText}

SKILLS:
${profileData.skills.join(', ')}

DIMENSION SCORES:
${dimensionScoresText}

PLAN LEVEL: ${plan}
${freePlanNote}

Generate a complete optimisation report. Return ONLY valid JSON with no markdown:
{
  "recommendations": [
    {
      "id": "rec_headline_1",
      "dimension_id": "headline",
      "title": "Short action title",
      "type": "rewrite",
      "priority": "high",
      "current_state": "quote of current weak element",
      "why_weak": "specific analysis of what is wrong",
      "recommended_action": "exactly what to do",
      "rewritten_content": "ready to paste content if rewrite type",
      "alternatives": ["alternative 1", "alt 2"] or null,
      "seo_impact": "specific LinkedIn SEO benefit",
      "projected_views_increase": "20-35%",
      "projected_reach_increase": "15-25%",
      "projected_messages_increase": "2-4x",
      "estimated_points": 4,
      "is_done": false,
      "linkedin_where_to_apply": "LinkedIn profile → Edit intro → Headline field"
    }
  ],
  "rewritten_headline": [
    "Option 1: full rewritten headline",
    "Option 2: different angle",
    "Option 3: most keyword-rich version"
  ],
  "rewritten_about": "Complete rewritten About section 1500+ chars ready to paste",
  "rewritten_experiences": [
    {
      "role_index": 0,
      "title": "Current role title",
      "company": "Company name",
      "original": "first 100 chars of original",
      "rewritten": "Complete achievement-focused rewrite"
    }
  ],
  "keyword_recommendations": [
    {
      "keyword": "specific keyword phrase",
      "estimated_monthly_searches": "500-2000",
      "placement": ["headline", "about", "skills"],
      "example_usage": "exact sentence using this keyword naturally",
      "current_in_profile": true
    }
  ]
}

Requirements:
- Generate 8-12 recommendations covering all weak dimensions
- For free plan: generate only the top 3 most impactful
- Prioritise dimensions with lowest percentage scores
- Every rewritten_content must be complete and ready to paste
- rewritten_about must be 1500+ characters
- Projected metrics must be realistic ranges not exact numbers
- keyword_recommendations: 15 keywords for paid plans, 5 for free
- All content must sound like the actual person wrote it
- Reference specific details from their profile (their company, their actual achievements, their specific niche)`

  const makeCall = async (): Promise<string> => {
    const msg = await anthropic.messages.create({
      model: SONNET_MODEL,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })
    const block = msg.content[0]
    if (block.type !== 'text') throw new Error('Unexpected Anthropic response type')
    return block.text
  }

  let raw = await makeCall()
  let parsed: RecommendationsResult

  try {
    parsed = JSON.parse(extractJSON(raw)) as RecommendationsResult
  } catch {
    raw = await makeCall()
    parsed = JSON.parse(extractJSON(raw)) as RecommendationsResult
  }

  return parsed
}

// ── Function 2: generateCompetitiveAnalysis ───────────────────────────────────

export async function generateCompetitiveAnalysis(
  niche: string,
  goal: string,
  dimensionScores: Record<string, ProfileAuditDimension>,
  totalScore: number
): Promise<CompetitiveAnalysis> {
  void dimensionScores // available for future prompt enrichment

  const userMessage = `Generate a competitive benchmarking analysis for a LinkedIn profile in the ${niche} niche with a goal of ${goal}. Current profile score is ${totalScore}/100.

Based on your knowledge of high-performing LinkedIn profiles in this niche, describe what a typical top-performing profile looks like.

Return ONLY valid JSON:
{
  "niche": "${niche}",
  "top_performer_headline": "example of a strong headline pattern in this niche",
  "top_performer_about_length": "typical character count range",
  "top_performer_skills_count": "typical number",
  "top_performer_posts_per_week": "typical frequency",
  "gaps": [
    "specific gap this profile has vs top performers"
  ],
  "advantages": [
    "area where this profile may already be competitive"
  ]
}`

  const msg = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 800,
    messages: [{ role: 'user', content: userMessage }],
  })

  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected Anthropic response type')

  return JSON.parse(extractJSON(block.text)) as CompetitiveAnalysis
}

// ── Function 3: generateRescoredDimension ────────────────────────────────────

export async function generateRescoredDimension(
  dimensionId: string,
  updatedText: string,
  originalData: ProfileInputData,
  targetKeywords: string[]
): Promise<{ new_score: number; feedback: string }> {
  const config = DIMENSION_CONFIG[dimensionId as keyof typeof DIMENSION_CONFIG]

  const fieldMap: Record<string, string> = {
    headline: originalData.headline,
    about: originalData.about,
    experience: originalData.current_role_description,
    keywords: originalData.headline + ' ' + originalData.about,
    completeness: JSON.stringify({
      has_profile_photo: originalData.has_profile_photo,
      has_custom_banner: originalData.has_custom_banner,
      has_custom_url: originalData.has_custom_url,
      skills_count: originalData.skills.length,
    }),
    social_proof: JSON.stringify({
      recommendations_count: originalData.recommendations_count,
      featured_items_count: originalData.featured_items_count,
      skills_with_endorsements: originalData.skills_with_endorsements,
    }),
    photo: JSON.stringify({
      has_profile_photo: originalData.has_profile_photo,
      photo_is_headshot: originalData.photo_is_headshot,
      photo_background_clean: originalData.photo_background_clean,
      photo_is_recent: originalData.photo_is_recent,
      photo_is_professional: originalData.photo_is_professional,
    }),
    engagement: JSON.stringify({
      posts_per_week: originalData.posts_per_week,
      comments_per_week: originalData.comments_per_week,
      connections_count: originalData.connections_count,
      has_recent_post_with_engagement: originalData.has_recent_post_with_engagement,
    }),
    visual_branding: JSON.stringify({
      has_custom_banner: originalData.has_custom_banner,
      banner_description: originalData.banner_description,
    }),
  }

  const originalText = fieldMap[dimensionId] ?? ''
  const maxScore = config?.max_score ?? 10

  const userMessage = `Re-evaluate this LinkedIn profile dimension after the user has made improvements.

DIMENSION: ${dimensionId}
TARGET KEYWORDS: ${targetKeywords.join(', ')}
ORIGINAL TEXT: ${originalText}
UPDATED TEXT: ${updatedText}

Score this dimension out of ${maxScore}.

Return ONLY valid JSON:
{
  "new_score": number,
  "feedback": "one sentence on what improved and what (if anything) could still be better"
}`

  const msg = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 300,
    messages: [{ role: 'user', content: userMessage }],
  })

  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected Anthropic response type')

  return JSON.parse(extractJSON(block.text)) as { new_score: number; feedback: string }
}
