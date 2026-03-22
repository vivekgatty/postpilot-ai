import type { ProfileInputData, ProfileAuditDimension, ProfileRecommendation } from '@/types'
import { DIMENSION_CONFIG, getDimensionTier } from '@/lib/profileOptimizerConfig'

function isOnlyJobTitle(headline: string, title: string): boolean {
  const h = headline.toLowerCase().trim()
  const t = title.toLowerCase().trim()
  return Math.abs(h.length - t.length) <= 20 && h.includes(t)
}

function makeDimension(
  id: keyof typeof DIMENSION_CONFIG,
  score: number,
  summary: string
): ProfileAuditDimension {
  const config = DIMENSION_CONFIG[id]
  const clamped = Math.min(score, config.max_score)
  const percentage = Math.round((clamped / config.max_score) * 100)
  return {
    id,
    label: config.label,
    score: clamped,
    max_score: config.max_score,
    percentage,
    tier: getDimensionTier(percentage),
    summary,
    recommendations: [],
  }
}

function scoreCompleteness(data: ProfileInputData): ProfileAuditDimension {
  let score = 0
  if (data.has_profile_photo) score += 2
  if (data.has_custom_banner) score += 2
  const headlineIsMoreThanTitle =
    data.headline.length > 0 && !isOnlyJobTitle(data.headline, data.current_title)
  if (headlineIsMoreThanTitle) score += 2
  if (data.about.length >= 200) score += 2
  if (data.current_role_description.length >= 100) score += 2
  const hasPrevWithDesc = data.previous_roles.some(r => r.description.length > 50)
  if (hasPrevWithDesc) score += 1
  if (data.education.length > 10) score += 1
  if (data.skills.length >= 10) score += 1
  if (data.has_featured_items && data.featured_items_count >= 1) score += 1
  if (data.has_custom_url) score += 1

  let summary: string
  if (score < 8) {
    summary = 'Critical gaps — profile is incomplete and being suppressed in LinkedIn search'
  } else if (score <= 11) {
    summary = 'Partially complete — missing elements that LinkedIn rewards with higher visibility'
  } else if (score <= 14) {
    summary = 'Nearly complete — a few quick fixes will unlock full LinkedIn All-Star status'
  } else {
    summary = 'Fully complete — LinkedIn All-Star status achieved'
  }

  return makeDimension('completeness', score, summary)
}

function scoreHeadline(
  data: ProfileInputData,
  targetKeywords: string[]
): ProfileAuditDimension {
  let score = 0
  const headlineLen = data.headline.length

  if (headlineLen >= 100 && headlineLen <= 220) score += 3
  else if (headlineLen >= 60 && headlineLen < 100) score += 1

  const keywordsInHeadline = targetKeywords.filter(kw =>
    data.headline.toLowerCase().includes(kw.toLowerCase())
  ).length
  score += Math.min(keywordsInHeadline * 1.5, 3)

  const hasValueProp = !isOnlyJobTitle(data.headline, data.current_title)
  if (hasValueProp) score += 3

  const hasDifferentiator =
    data.headline.includes('|') ||
    data.headline.includes('—') ||
    data.headline.length > 120
  if (hasDifferentiator) score += 3

  const notOnlyTitle = !isOnlyJobTitle(data.headline, data.current_title)
  if (notOnlyTitle) score += 3

  score = Math.min(Math.round(score), 15)

  const pct = Math.round((score / 15) * 100)
  const summary =
    pct < 40
      ? 'Headline is just a job title — invisible to recruiters and prospects searching LinkedIn'
      : pct < 65
      ? 'Headline has some value but missing keywords and differentiators that drive clicks'
      : pct < 85
      ? 'Solid headline — a few refinements could meaningfully increase profile views'
      : 'Strong headline communicating value, keywords, and differentiation effectively'

  return makeDimension('headline', score, summary)
}

function scoreAbout(
  data: ProfileInputData,
  targetKeywords: string[]
): ProfileAuditDimension {
  let score = 0
  const aboutLen = data.about.length

  if (aboutLen >= 1500) score += 3
  else if (aboutLen >= 800) score += 2
  else if (aboutLen >= 300) score += 1

  const firstThreeLines = data.about.split('\n').slice(0, 3).join(' ')
  const hasHook =
    firstThreeLines.length > 50 &&
    !firstThreeLines.toLowerCase().startsWith('i am a') &&
    !firstThreeLines.toLowerCase().startsWith('experienced')
  if (hasHook) score += 3

  const hasNumbers = /\d+/.test(data.about)
  if (hasNumbers) score += 1

  const hasFirstPerson =
    data.about.toLowerCase().includes(' i ') || data.about.startsWith('I ')
  if (hasFirstPerson) score += 1

  const hasCTA =
    data.about.toLowerCase().includes('reach out') ||
    data.about.toLowerCase().includes('contact') ||
    data.about.toLowerCase().includes('connect') ||
    data.about.toLowerCase().includes('dm') ||
    data.about.toLowerCase().includes('message')
  if (hasCTA) score += 2

  const keywordsInAbout = targetKeywords.filter(kw =>
    data.about.toLowerCase().includes(kw.toLowerCase())
  ).length
  score += Math.min(keywordsInAbout, 5)

  score = Math.min(Math.round(score), 15)

  const pct = Math.round((score / 15) * 100)
  const summary =
    pct < 40
      ? 'About section is weak or missing — the most valuable real estate on your profile is wasted'
      : pct < 65
      ? 'About section exists but lacks a hook, metrics, or clear call-to-action'
      : pct < 85
      ? 'Good About section — adding a stronger hook and CTA would push this to excellent'
      : 'Compelling About section with strong hook, social proof, and clear next step'

  return makeDimension('about', score, summary)
}

function scoreExperience(data: ProfileInputData): ProfileAuditDimension {
  let score = 0

  if (data.current_role_description.length >= 200) score += 3
  else if (data.current_role_description.length >= 100) score += 1

  const hasQuantifiedAchievement =
    /\d+%|\d+x|₹\d+|\$\d+|\d+ (clients|customers|users|team|people|crore|lakh|million)/i.test(
      data.current_role_description
    )
  if (hasQuantifiedAchievement) score += 3

  const prevWithLongDesc = data.previous_roles.filter(
    r => r.description.length >= 100
  ).length
  score += Math.min(prevWithLongDesc * 1.5, 3)

  const achievementWords = [
    'achieved', 'grew', 'built', 'launched', 'led', 'increased', 'reduced',
    'generated', 'delivered', 'transformed', 'drove', 'scaled', 'created',
  ]
  const usesAchievementLanguage = achievementWords.some(w =>
    data.current_role_description.toLowerCase().includes(w)
  )
  if (usesAchievementLanguage) score += 3

  score = Math.min(Math.round(score), 12)

  const pct = Math.round((score / 12) * 100)
  const summary =
    pct < 40
      ? 'Experience reads like a job description — no achievements or metrics to impress visitors'
      : pct < 65
      ? 'Some detail present but lacking quantified results that build credibility fast'
      : pct < 85
      ? 'Decent experience section — adding more metrics would significantly strengthen it'
      : 'Achievement-focused experience with metrics that demonstrate real business impact'

  return makeDimension('experience', score, summary)
}

function scoreKeywords(
  data: ProfileInputData,
  targetKeywords: string[]
): ProfileAuditDimension {
  let score = 0

  const kwInHeadline = targetKeywords.filter(kw =>
    data.headline.toLowerCase().includes(kw.toLowerCase())
  ).length
  score += Math.min(kwInHeadline * 2, 6)

  const aboutFirst300 = data.about.slice(0, 300).toLowerCase()
  const kwInAbout = targetKeywords.filter(kw =>
    aboutFirst300.includes(kw.toLowerCase())
  ).length
  score += Math.min(kwInAbout * 1, 3)

  const kwInExperience = targetKeywords.filter(kw =>
    data.current_role_description.toLowerCase().includes(kw.toLowerCase())
  ).length
  score += Math.min(kwInExperience * 0.5, 1.5)

  const skillsLower = data.skills.map(s => s.toLowerCase())
  const kwInSkills = targetKeywords.filter(kw =>
    skillsLower.some(s => s.includes(kw.toLowerCase()))
  ).length
  if (kwInSkills >= 3) score += 2
  else if (kwInSkills >= 1) score += 1

  score = Math.min(Math.round(score), 12)

  const pct = Math.round((score / 12) * 100)
  const summary =
    pct < 40
      ? 'Profile is not optimised for LinkedIn search — target keywords are largely absent'
      : pct < 65
      ? 'Some keywords present but not placed strategically for maximum search visibility'
      : pct < 85
      ? 'Good keyword coverage — improving placement in headline and about opener would help'
      : 'Well-optimised for LinkedIn search with keywords in all high-impact sections'

  return makeDimension('keywords', score, summary)
}

function scoreSocialProof(data: ProfileInputData): ProfileAuditDimension {
  let score = 0

  if (data.featured_items_count >= 3) score += 3
  else if (data.featured_items_count >= 1) score += 1

  if (data.has_articles) score += 2

  if (data.recommendations_count >= 3) score += 3
  else if (data.recommendations_count >= 1) score += 1

  if (data.skills_with_endorsements >= 5) score += 2
  else if (data.skills_with_endorsements >= 1) score += 1

  score = Math.min(score, 10)

  const pct = Math.round((score / 10) * 100)
  const summary =
    pct < 40
      ? 'No social proof — visitors have no third-party validation of your claims'
      : pct < 65
      ? 'Limited social proof — a few recommendations and featured items would add credibility'
      : pct < 85
      ? 'Decent social proof — growing recommendations and endorsements would strengthen this'
      : 'Strong social proof with featured content, recommendations, and skill endorsements'

  return makeDimension('social_proof', score, summary)
}

function scorePhoto(data: ProfileInputData): ProfileAuditDimension {
  let score = 0

  if (data.photo_is_headshot) score += 2
  if (data.photo_background_clean) score += 2
  if (data.photo_is_recent) score += 2
  if (data.photo_is_professional) score += 2

  score = Math.min(score, 8)

  const pct = Math.round((score / 8) * 100)
  const summary =
    !data.has_profile_photo
      ? 'No profile photo — profiles without photos get 14x fewer views'
      : pct < 40
      ? 'Photo quality is hurting your profile — unprofessional photos reduce connection requests'
      : pct < 65
      ? 'Photo is adequate but not optimised — small improvements could increase profile clicks'
      : pct < 85
      ? 'Good photo — ensuring it is recent and professional will maximise first impressions'
      : 'Professional, high-quality headshot that builds trust and encourages connections'

  return makeDimension('photo', score, summary)
}

function scoreEngagement(data: ProfileInputData): ProfileAuditDimension {
  let score = 0

  if (data.posts_per_week === 'daily') score += 3
  else if (data.posts_per_week === 'several') score += 2
  else if (data.posts_per_week === 'weekly') score += 1

  if (data.has_recent_post_with_engagement) score += 2

  if (data.comments_per_week === 'daily') score += 2
  else if (data.comments_per_week === 'several') score += 1

  if (data.connections_count === '500plus') score += 1

  score = Math.min(score, 8)

  const pct = Math.round((score / 8) * 100)
  const summary =
    pct < 40
      ? 'Inactive profile — LinkedIn suppresses profiles with no recent activity in search'
      : pct < 65
      ? 'Low activity signals — posting and commenting more would increase algorithmic reach'
      : pct < 85
      ? 'Moderate activity — consistent posting and commenting would unlock more visibility'
      : 'Strong engagement signals — LinkedIn algorithm is actively boosting your content'

  return makeDimension('engagement', score, summary)
}

function scoreVisualBranding(data: ProfileInputData): ProfileAuditDimension {
  let score = 0

  if (data.has_custom_banner) score += 2

  if (data.banner_description.length > 20) score += 2
  else if (data.has_custom_banner) score += 1

  if (
    data.has_custom_banner &&
    !data.banner_description.toLowerCase().includes('stock')
  )
    score += 1

  score = Math.min(score, 5)

  const pct = Math.round((score / 5) * 100)
  const summary =
    !data.has_custom_banner
      ? 'No custom banner — the default grey banner signals an unoptimised, inactive profile'
      : pct < 60
      ? 'Banner exists but appears generic — a branded banner would reinforce your positioning'
      : 'Custom banner present — ensures it clearly communicates your value proposition'

  return makeDimension('visual_branding', score, summary)
}

export function scoreProfile(
  data: ProfileInputData,
  targetKeywords: string[]
): Record<string, ProfileAuditDimension> {
  return {
    completeness: scoreCompleteness(data),
    headline: scoreHeadline(data, targetKeywords),
    about: scoreAbout(data, targetKeywords),
    experience: scoreExperience(data),
    keywords: scoreKeywords(data, targetKeywords),
    social_proof: scoreSocialProof(data),
    photo: scorePhoto(data),
    engagement: scoreEngagement(data),
    visual_branding: scoreVisualBranding(data),
  }
}

export function calculateTotalScore(
  dimensions: Record<string, ProfileAuditDimension>
): number {
  return Object.values(dimensions).reduce((sum, d) => sum + d.score, 0)
}

export function calculateProjectedScore(
  dimensions: Record<string, ProfileAuditDimension>,
  completedIds: string[],
  recommendations: ProfileRecommendation[]
): number {
  const base = calculateTotalScore(dimensions)
  const bonus = completedIds.reduce((sum, id) => {
    const rec = recommendations.find(r => r.id === id)
    return sum + (rec?.estimated_points ?? 0)
  }, 0)
  return Math.min(base + bonus, 100)
}
