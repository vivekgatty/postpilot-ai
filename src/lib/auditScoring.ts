import {
  AUDIT_QUESTIONS,
  DIMENSION_WEIGHTS,
  DIMENSION_LABELS,
} from '@/lib/auditConfig'
import type { AuditDimensionScore } from '@/types'

// ─── AI content quality shape ─────────────────────────────────────────────────

export interface AIContentQuality {
  hook_score:          number  // 0-5
  readability_score:   number  // 0-3
  value_score:         number  // 0-5
  cta_score:           number  // 0-4
  authenticity_score:  number  // 0-3
  feedback:            string
}

// ─── Dimension feedback strings (hardcoded — no Claude call) ─────────────────

const DIMENSION_FEEDBACK: Record<string, { low: string; mid: string; high: string }> = {
  profile_completeness: {
    low:  'Your profile is nearly invisible. Start with a professional photo and rewrite your headline — these two changes alone can double your profile views.',
    mid:  'Your profile is set up but missing its hook. Turn your About section into a client-facing pitch and add a Featured item to drive action.',
    high: 'Strong profile foundation. Next level: add a LinkedIn newsletter or article to the Featured section to establish deeper authority.',
  },
  content_consistency: {
    low:  "You're not showing up consistently — the algorithm rewards regulars. Commit to posting just once a week for the next 30 days to build the habit.",
    mid:  "Good posting frequency, but the pattern may be irregular. A content calendar with 4 banked drafts will keep you consistent on off-weeks.",
    high: "You're posting consistently — that's rare. The next edge is batch-creating content every Sunday so you never scramble for ideas mid-week.",
  },
  content_quality: {
    low:  "Your content isn't standing out yet. Focus on your first line — a bold claim, story opening, or surprising fact stops the scroll better than any hashtag.",
    mid:  "Your content is decent but could be sharper. End every post with one clear question to signal LinkedIn that comments should be boosted.",
    high: "Strong content quality. Push further by experimenting with carousel posts or video once a month to capture different audience segments.",
  },
  audience_relevance: {
    low:  "You're posting for everyone, which means you're reaching no one specifically. Pick one ICP (ideal customer profile) and write every post for that person.",
    mid:  "You have a rough sense of your audience but it's not fully sharp. Write down the exact job title, industry, and challenge of your target reader — then check every post against it.",
    high: "Good audience alignment. The next level is writing directly to your audience's aspirations, not just their pain points — that's what drives shares.",
  },
  engagement_behaviour: {
    low:  "Engagement is a two-way street. Spend 15 minutes a day commenting on 5 posts in your niche — this is the fastest way to grow your visibility without posting.",
    mid:  "You engage occasionally but not systematically. Block 20 minutes after you post to respond to every comment — this doubles your reach in the first hour.",
    high: "Excellent engagement habits. Now focus quality over quantity: leave one truly insightful comment per day on a top creator's post to build network visibility.",
  },
  niche_authority: {
    low:  "You haven't staked a claim in a specific niche yet. Repetition builds authority — pick 2 topics and post about only those for 90 days.",
    mid:  "You're building niche recognition. Accelerate it by tagging relevant people in your posts and creating content that references real industry data or names.",
    high: "Strong niche presence. Become the connector: introduce others in your niche in posts, create roundups, and host LinkedIn Lives to cement your authority.",
  },
}

function getDimensionFeedback(dimension: string, percentage: number): string {
  const fb = DIMENSION_FEEDBACK[dimension] ?? { low: '', mid: '', high: '' }
  if (percentage < 40) return fb.low
  if (percentage < 70) return fb.mid
  return fb.high
}

// ─── Main scoring function ────────────────────────────────────────────────────

export function calculateAuditScore(
  answers: Record<string, string>,
  aiContentQuality?: AIContentQuality,
): { totalScore: number; dimensionScores: AuditDimensionScore[] } {

  // 1. Accumulate raw points per dimension from questionnaire
  const dimensionRaw: Record<string, number> = {}

  for (const q of AUDIT_QUESTIONS) {
    const answer = answers[q.id]
    if (answer === undefined) continue

    let pts = 0
    if (q.type === 'yesno' && q.points) {
      pts = q.points[answer as 'yes' | 'no'] ?? 0
    } else if (q.type === 'choice' && q.options) {
      const opt = q.options.find(o => o.value === answer)
      pts = opt?.points ?? 0
    }

    dimensionRaw[q.dimension] = (dimensionRaw[q.dimension] ?? 0) + pts
  }

  // 2. Apply AI content quality to content_quality dimension
  if (aiContentQuality) {
    const aiPts =
      aiContentQuality.hook_score +
      aiContentQuality.readability_score +
      aiContentQuality.value_score +
      aiContentQuality.cta_score +
      aiContentQuality.authenticity_score  // max 20

    const questionnairePts = dimensionRaw['content_quality'] ?? 0
    dimensionRaw['content_quality'] = aiPts + questionnairePts
  }

  // 3. Build dimension scores (capping at max)
  const dimensions = Object.keys(DIMENSION_WEIGHTS)
  const dimensionScores: AuditDimensionScore[] = dimensions.map(dim => {
    const max    = DIMENSION_WEIGHTS[dim]
    const earned = Math.min(dimensionRaw[dim] ?? 0, max)
    const pct    = Math.round((earned / max) * 100)

    return {
      dimension:  dim,
      label:      DIMENSION_LABELS[dim] ?? dim,
      earned,
      max,
      percentage: pct,
      feedback:   getDimensionFeedback(dim, pct),
    }
  })

  // 4. Total score, capped at 100
  const totalScore = Math.min(
    dimensionScores.reduce((sum, d) => sum + d.earned, 0),
    100,
  )

  return { totalScore, dimensionScores }
}
