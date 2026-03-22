import type { AnalysisDimension } from '@/types'
import {
  WEAK_OPENER_PATTERNS,
  CORPORATE_FILLER_PATTERNS,
  ANALYSIS_DIMENSIONS,
  getDimensionGrade,
  TIMING_BY_TYPE,
} from '@/lib/analyserConfig'

export interface DeterministicScores {
  hook_structural: number
  readability_structural: number
  algorithm_structural: number
  character_count: number
  has_external_link: boolean
  hashtag_count: number
  first_line: string
  line_count: number
  has_weak_opener: boolean
  weak_opener_matched: string
  has_corporate_filler: boolean
  filler_matches: string[]
  has_numbers: boolean
  has_cta_pattern: boolean
  ends_with_question: boolean
  post_type_timing: { day: string; time: string; reason: string }
}

export function runDeterministicChecks(
  content: string,
  postType: string
): DeterministicScores {
  // 1. Basic metrics
  const lines = content.split('\n')
  const nonEmptyLines = lines.filter(l => l.trim().length > 0)
  const character_count = content.length
  const firstLine = nonEmptyLines[0]?.trim() || ''
  const words = firstLine.split(/\s+/).filter(Boolean)

  // 2. Weak opener detection
  const has_weak_opener = WEAK_OPENER_PATTERNS.some(p => p.test(content.trim()))
  const weak_opener_matched =
    WEAK_OPENER_PATTERNS.find(p => p.test(content.trim()))?.toString() || ''

  // 3. Corporate filler detection
  const contentLower = content.toLowerCase()
  const filler_matches = CORPORATE_FILLER_PATTERNS.filter(f =>
    contentLower.includes(f)
  )
  const has_corporate_filler = filler_matches.length > 0

  // 4. External link detection
  const has_external_link = /https?:\/\/(?!linkedin\.com\/in\/)/.test(content)

  // 5. Hashtag count
  const hashtag_count = (content.match(/#\w+/g) || []).length

  // 6. Numbers in content
  const has_numbers = /\d+/.test(content)

  // 7. CTA patterns
  const cta_patterns = [
    /\?[\s"']*$/m,
    /what (do|would|did|have|has|are|were|is|was) you/i,
    /have you ever/i,
    /let me know/i,
    /share (your|in the comments)/i,
    /comment (below|with|your)/i,
    /drop (a|your)/i,
    /tag someone/i,
    /follow (me|for)/i,
    /save (this|for later)/i,
  ]
  const has_cta_pattern = cta_patterns.some(p => p.test(content))
  const ends_with_question = /\?[\s\S]{0,50}$/.test(content.trim())

  // 8. Readability structural checks
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  const longParagraphs = paragraphs.filter(p => {
    const paraLines = p.split('\n').filter(l => l.trim())
    return paraLines.length > 3
  })
  const readability_structural =
    longParagraphs.length === 0 ? 6 : longParagraphs.length === 1 ? 3 : 0

  // 9. Algorithm structural score
  let algorithm_structural = 0
  if (character_count >= 800 && character_count <= 1500) {
    algorithm_structural += 3
  } else if (character_count >= 500 && character_count < 800) {
    algorithm_structural += 1
  } else if (character_count > 1500 && character_count <= 2000) {
    algorithm_structural += 2
  }
  if (!has_external_link) algorithm_structural += 2
  if (hashtag_count <= 5 && hashtag_count > 0) {
    algorithm_structural += 2
  } else if (hashtag_count === 0) {
    algorithm_structural += 1
  }

  // 10. Hook structural score
  let hook_structural = 0
  if (words.length <= 12 && words.length >= 3) {
    hook_structural += 4
  } else if (words.length <= 15) {
    hook_structural += 2
  }
  if (!has_weak_opener) hook_structural += 4
  if (has_numbers && /\d/.test(firstLine)) hook_structural += 4

  // 11. Timing
  const post_type_timing =
    TIMING_BY_TYPE[postType as keyof typeof TIMING_BY_TYPE] || TIMING_BY_TYPE.text

  return {
    hook_structural,
    readability_structural,
    algorithm_structural,
    character_count,
    has_external_link,
    hashtag_count,
    first_line: firstLine,
    line_count: lines.length,
    has_weak_opener,
    weak_opener_matched,
    has_corporate_filler,
    filler_matches,
    has_numbers,
    has_cta_pattern,
    ends_with_question,
    post_type_timing,
  }
}

export function mergeScores(
  deterministic: DeterministicScores,
  aiScores: Record<string, number>,
  _postType: string
): Record<string, AnalysisDimension> {
  const result: Record<string, AnalysisDimension> = {}

  for (const [key, dim] of Object.entries(ANALYSIS_DIMENSIONS)) {
    let final_score: number

    switch (key) {
      case 'hook':
        final_score = Math.min(
          deterministic.hook_structural + (aiScores.hook_quality || 0),
          20
        )
        break
      case 'readability':
        final_score = Math.min(
          deterministic.readability_structural + (aiScores.readability_quality || 0),
          15
        )
        break
      case 'value':
        final_score = Math.min(aiScores.value || 0, 15)
        break
      case 'cta': {
        const cta_structural = deterministic.has_cta_pattern ? 4 : 0
        final_score = Math.min(cta_structural + (aiScores.cta_quality || 0), 10)
        break
      }
      case 'authenticity': {
        const auth_structural = deterministic.has_corporate_filler ? 0 : 3
        final_score = Math.min(
          auth_structural + (aiScores.authenticity_quality || 0),
          10
        )
        break
      }
      case 'specificity': {
        const spec_structural = deterministic.has_numbers ? 4 : 0
        final_score = Math.min(
          spec_structural + (aiScores.specificity_quality || 0),
          10
        )
        break
      }
      case 'emotion':
        final_score = Math.min(aiScores.emotion || 0, 8)
        break
      case 'algorithm':
        final_score = Math.min(deterministic.algorithm_structural, 7)
        break
      case 'relevance':
        final_score = Math.min(aiScores.relevance || 0, 3)
        break
      case 'timing':
        final_score = 2
        break
      default:
        final_score = 0
    }

    const percentage = Math.round((final_score / dim.max_score) * 100)

    result[key] = {
      id: dim.id,
      label: dim.label,
      score: final_score,
      max_score: dim.max_score,
      percentage,
      grade: getDimensionGrade(percentage),
      feedback: buildFeedback(dim.id, final_score, dim.max_score, deterministic),
      has_suggestions: percentage < 70,
    }
  }

  return result
}

export function buildFeedback(
  dimensionId: string,
  score: number,
  _maxScore: number,
  det: DeterministicScores
): string {
  switch (dimensionId) {
    case 'hook':
      if (score >= 17) return 'Scroll-stopping hook — competes with video thumbnails'
      if (score >= 13) return 'Strong hook — will earn the click from interested readers'
      if (score >= 8)
        return det.has_weak_opener
          ? `Weak opener detected: '${det.weak_opener_matched.slice(0, 40)}...'`
          : 'Hook lacks specificity — add a number or bold claim'
      return 'This hook will be scrolled past — rewrite before publishing'

    case 'readability':
      if (score >= 13) return 'Excellent formatting — easy to scan on mobile'
      if (score >= 9) return 'Mostly readable with some long paragraphs'
      return 'Long blocks of text — break into shorter lines'

    case 'value':
      if (score >= 13) return 'High-value content — reader learns something useful'
      if (score >= 8) return 'Good value but could be more specific'
      return 'Post lacks a concrete insight — add one actionable takeaway'

    case 'cta':
      if (score >= 8) return 'Strong CTA — invites genuine engagement'
      if (score >= 5) return 'CTA present but could be more specific'
      return det.ends_with_question
        ? 'Question too generic — make it specific to the topic'
        : 'No call to action — post is missing its engagement driver'

    case 'authenticity':
      if (score >= 8) return 'Sounds authentically human — algorithm rewards this'
      if (det.has_corporate_filler)
        return 'Corporate filler detected: ' + det.filler_matches.slice(0, 2).join(', ')
      return 'Could sound more personal — add a specific detail'

    case 'specificity':
      if (score >= 8) return 'Specific and credible — backed by real data'
      if (det.has_numbers) return 'Has numbers but could use more concrete examples'
      return 'No specific numbers or examples — add at least one'

    case 'emotion':
      if (score >= 6) return 'Creates a clear emotional response'
      if (score >= 4) return 'Some emotional pull — strengthen with more tension'
      return 'Emotionally flat — add curiosity, surprise, or validation'

    case 'algorithm':
      if (score >= 6) return 'Well-optimised for LinkedIn\'s algorithm'
      if (det.has_external_link) return 'External link in body reduces reach by 60%'
      if (det.hashtag_count > 5) return 'Too many hashtags — reduce to 3-5'
      if (det.character_count < 500) return 'Too short — aim for 800-1500 chars'
      return 'Character count or formatting needs adjustment'

    case 'relevance':
      if (score >= 3) return 'Focused on one clear professional topic'
      return 'Post covers too many topics — pick one and go deep'

    case 'timing':
      return det.post_type_timing.day + ' at ' + det.post_type_timing.time

    default:
      return ''
  }
}
