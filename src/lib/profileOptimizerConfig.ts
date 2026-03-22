export const PROFILE_GOALS = [
  { id: 'clients', label: 'Get consulting or freelance clients' },
  { id: 'job', label: 'Find a new job or career opportunity' },
  { id: 'authority', label: 'Build thought leadership and authority' },
  { id: 'investors', label: 'Attract investors or funding' },
  { id: 'network', label: 'Grow a strategic professional network' },
  { id: 'speaking', label: 'Get speaking or media opportunities' },
]

export const DIMENSION_CONFIG = {
  completeness: {
    id: 'completeness',
    label: 'Profile Completeness',
    max_score: 15,
    icon: 'CheckSquare',
    color: '#1D9E75',
    description: 'Whether all key LinkedIn profile fields are filled',
  },
  headline: {
    id: 'headline',
    label: 'Headline Optimisation',
    max_score: 15,
    icon: 'Heading',
    color: '#534AB7',
    description: 'How well your headline communicates value and contains keywords',
  },
  about: {
    id: 'about',
    label: 'About Section Quality',
    max_score: 15,
    icon: 'AlignLeft',
    color: '#BA7517',
    description: 'Strength of your professional summary and storytelling',
  },
  experience: {
    id: 'experience',
    label: 'Experience Depth',
    max_score: 12,
    icon: 'Briefcase',
    color: '#185FA5',
    description: 'How achievement-focused and detailed your experience descriptions are',
  },
  keywords: {
    id: 'keywords',
    label: 'Keywords and SEO',
    max_score: 12,
    icon: 'Search',
    color: '#993556',
    description: 'How well your profile is optimised for LinkedIn search',
  },
  social_proof: {
    id: 'social_proof',
    label: 'Social Proof',
    max_score: 10,
    icon: 'Star',
    color: '#854F0B',
    description: 'Featured content, recommendations, and endorsements',
  },
  photo: {
    id: 'photo',
    label: 'Profile Photo Quality',
    max_score: 8,
    icon: 'Camera',
    color: '#D85A30',
    description: 'How professional and engaging your profile photo is',
  },
  engagement: {
    id: 'engagement',
    label: 'Engagement Signals',
    max_score: 8,
    icon: 'Activity',
    color: '#0F6E56',
    description: 'How active you are on LinkedIn — a key algorithm signal',
  },
  visual_branding: {
    id: 'visual_branding',
    label: 'Visual Branding',
    max_score: 5,
    icon: 'Image',
    color: '#888780',
    description: 'Your banner image and overall visual presentation',
  },
}

export const SCORE_TIERS = [
  { min: 0, max: 25, tier: 'invisible', label: 'Invisible', color: '#E24B4A', description: 'Your profile is actively working against you' },
  { min: 26, max: 40, tier: 'basic', label: 'Basic', color: '#D85A30', description: 'Present but forgettable — no competitive advantage' },
  { min: 41, max: 55, tier: 'developing', label: 'Developing', color: '#BA7517', description: 'Some elements working, major gaps holding you back' },
  { min: 56, max: 70, tier: 'solid', label: 'Solid', color: '#185FA5', description: 'Above average — some intentionality but not optimised' },
  { min: 71, max: 85, tier: 'strong', label: 'Strong', color: '#1D9E75', description: 'Top 20% — profile attracts the right attention' },
  { min: 86, max: 95, tier: 'elite', label: 'Elite', color: '#534AB7', description: 'Top 5% — profile is a genuine business asset' },
  { min: 96, max: 100, tier: 'gold', label: 'LinkedIn Gold', color: '#C9A84C', description: 'Fully optimised — maximum algorithmic advantage' },
]

export const OPTIMIZER_LIMITS = {
  free: {
    audits_per_month: 1,
    full_recommendations: false,
    rewrites: false,
    keyword_research: false,
    metrics: false,
    competitive: false,
    history: false,
  },
  starter: {
    audits_per_month: 2,
    full_recommendations: true,
    rewrites: true,
    keyword_research: true,
    metrics: true,
    competitive: false,
    history: false,
  },
  pro: {
    audits_per_month: -1,
    full_recommendations: true,
    rewrites: true,
    keyword_research: true,
    metrics: true,
    competitive: true,
    history: true,
  },
  agency: {
    audits_per_month: -1,
    full_recommendations: true,
    rewrites: true,
    keyword_research: true,
    metrics: true,
    competitive: true,
    history: true,
  },
}

export function getTierFromScore(score: number) {
  return SCORE_TIERS.find(t => score >= t.min && score <= t.max) ?? SCORE_TIERS[0]
}

export function getDimensionTier(
  percentage: number
): 'weak' | 'average' | 'strong' | 'excellent' {
  if (percentage < 40) return 'weak'
  if (percentage < 65) return 'average'
  if (percentage < 85) return 'strong'
  return 'excellent'
}

export const DIMENSION_TIER_COLORS = {
  weak: '#E24B4A',
  average: '#BA7517',
  strong: '#185FA5',
  excellent: '#1D9E75',
}
