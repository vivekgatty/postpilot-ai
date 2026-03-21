// ─── Audit Levels (20 tiers across 100 points) ───────────────────────────────

export const AUDIT_LEVELS = [
  { key: 'digital_dust',       label: 'Digital Dust',        min: 0,   max: 5,   tier: 'ghost_mode'    },
  { key: 'the_ghost',          label: 'The Ghost',            min: 6,   max: 10,  tier: 'ghost_mode'    },
  { key: 'the_lurker',         label: 'The Lurker',           min: 11,  max: 15,  tier: 'ghost_mode'    },
  { key: 'background_extra',   label: 'Background Extra',     min: 16,  max: 20,  tier: 'ghost_mode'    },
  { key: 'the_wallflower',     label: 'The Wallflower',       min: 21,  max: 25,  tier: 'ghost_mode'    },
  { key: 'almost_noticed',     label: 'Almost Noticed',       min: 26,  max: 30,  tier: 'ghost_mode'    },
  { key: 'the_rookie',         label: 'The Rookie',           min: 31,  max: 35,  tier: 'warming_up'    },
  { key: 'the_apprentice',     label: 'The Apprentice',       min: 36,  max: 40,  tier: 'warming_up'    },
  { key: 'the_contender',      label: 'The Contender',        min: 41,  max: 45,  tier: 'warming_up'    },
  { key: 'the_riser',          label: 'The Riser',            min: 46,  max: 50,  tier: 'warming_up'    },
  { key: 'the_storyteller',    label: 'The Storyteller',      min: 51,  max: 55,  tier: 'finding_voice' },
  { key: 'the_professional',   label: 'The Professional',     min: 56,  max: 60,  tier: 'finding_voice' },
  { key: 'the_strategist',     label: 'The Strategist',       min: 61,  max: 65,  tier: 'finding_voice' },
  { key: 'the_connector',      label: 'The Connector',        min: 66,  max: 70,  tier: 'in_the_room'   },
  { key: 'the_influencer',     label: 'The Influencer',       min: 71,  max: 75,  tier: 'in_the_room'   },
  { key: 'the_thought_leader', label: 'The Thought Leader',   min: 76,  max: 80,  tier: 'in_the_room'   },
  { key: 'the_authority',      label: 'The Authority',        min: 81,  max: 85,  tier: 'legend_status' },
  { key: 'the_luminary',       label: 'The Luminary',         min: 86,  max: 90,  tier: 'legend_status' },
  { key: 'the_pioneer',        label: 'The Pioneer',          min: 91,  max: 95,  tier: 'legend_status' },
  { key: 'the_linkedin_legend',label: 'The LinkedIn Legend',  min: 96,  max: 100, tier: 'legend_status' },
] as const

export type AuditLevelKey = typeof AUDIT_LEVELS[number]['key']
export type AuditTierKey  = 'ghost_mode' | 'warming_up' | 'finding_voice' | 'in_the_room' | 'legend_status'

// ─── Audit Tiers ──────────────────────────────────────────────────────────────

export const AUDIT_TIERS: Record<AuditTierKey, {
  label: string; color: string; bg: string; min: number; max: number
}> = {
  ghost_mode:    { label: 'Ghost Mode',           color: '#888780', bg: '#F1EFE8', min: 0,  max: 30  },
  warming_up:    { label: 'Warming Up',            color: '#BA7517', bg: '#FAEEDA', min: 31, max: 50  },
  finding_voice: { label: 'Finding Your Voice',   color: '#185FA5', bg: '#E6F1FB', min: 51, max: 65  },
  in_the_room:   { label: 'In The Room',           color: '#534AB7', bg: '#EEEDFE', min: 66, max: 80  },
  legend_status: { label: 'Legend Status',         color: '#0F6E56', bg: '#E1F5EE', min: 81, max: 100 },
}

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getLevelFromScore(score: number) {
  return AUDIT_LEVELS.find(l => score >= l.min && score <= l.max) ?? AUDIT_LEVELS[0]
}

export function getTierFromLevel(tierKey: string) {
  return AUDIT_TIERS[tierKey as AuditTierKey]
}

export function getNextLevel(currentLevelKey: string) {
  const idx = AUDIT_LEVELS.findIndex(l => l.key === currentLevelKey)
  return AUDIT_LEVELS[idx + 1] ?? AUDIT_LEVELS[AUDIT_LEVELS.length - 1]
}

// ─── Share copy ───────────────────────────────────────────────────────────────

export const SHARE_COPY: Record<string, string> = {
  ghost_mode: `PostPika just called me "[LEVEL]" on LinkedIn and honestly... they're not wrong.\n\nI scored [SCORE]/100 on my LinkedIn Personal Brand Audit.\n\nI'm fixing this. What's your score? 👇\n\nCheck yours free → postpika.com/audit\n\n#LinkedInAudit #PersonalBrand #PostPika`,
  warming_up: `Just got ranked "[LEVEL]" on LinkedIn by PostPika's Personal Brand Audit.\n\nScored [SCORE]/100. Better than I expected, worse than I want.\n\nDrop your score below — let's see who's in the same boat.\n\nFree 4-min audit → postpika.com/audit\n\n#LinkedInAudit #PersonalBrand #PostPika`,
  finding_voice: `Apparently I'm "[LEVEL]" on LinkedIn — scored [SCORE]/100 on PostPika's Personal Brand Audit.\n\nTop 35% of professionals in my niche.\n\nNow I want to know where my network stands. Take the free 4-minute audit 👇\n\npostpika.com/audit\n\n#LinkedInAudit #PersonalBrand #PostPika`,
  in_the_room: `PostPika ranked me "[LEVEL]" — [SCORE]/100 on their LinkedIn Personal Brand Audit.\n\nThat puts me in the top 15%.\n\nI'm curious how many people in my network are at this level or above.\n\nCheck yours free → postpika.com/audit\n\n#LinkedInAudit #PersonalBrand #PostPika`,
  legend_status: `Just scored [SCORE]/100 on PostPika's LinkedIn Personal Brand Audit — ranked "[LEVEL]".\n\nLess than 5% of professionals reach this tier.\n\nIf you're serious about LinkedIn, take the free 4-minute audit and see where you actually stand 👇\n\npostpika.com/audit\n\n#LinkedInAudit #PersonalBrand #PostPika`,
}

// ─── Dimension weights (max points per dimension) ─────────────────────────────

export const DIMENSION_WEIGHTS: Record<string, number> = {
  profile_completeness: 20,
  content_consistency:  20,
  content_quality:      20,
  audience_relevance:   15,
  engagement_behaviour: 15,
  niche_authority:      10,
}

export const DIMENSION_LABELS: Record<string, string> = {
  profile_completeness: 'Profile Completeness',
  content_consistency:  'Content Consistency',
  content_quality:      'Content Quality',
  audience_relevance:   'Audience Relevance',
  engagement_behaviour: 'Engagement Behaviour',
  niche_authority:      'Niche Authority',
}

// ─── Questions ────────────────────────────────────────────────────────────────

export type QuestionType = 'yesno' | 'choice'

export interface AuditQuestionOption {
  label: string
  value: string
  points: number
}

export interface AuditQuestion {
  id: string
  dimension: string
  question: string
  hint?: string
  type: QuestionType
  points?: { yes: number; no: number }
  options?: AuditQuestionOption[]
}

export const AUDIT_QUESTIONS: AuditQuestion[] = [
  // ── DIMENSION 1: Profile Completeness (20 pts) ─────────────────────────────
  {
    id: 'q1',
    dimension: 'profile_completeness',
    question: 'Do you have a professional profile photo on LinkedIn?',
    type: 'yesno',
    points: { yes: 3, no: 0 },
  },
  {
    id: 'q2',
    dimension: 'profile_completeness',
    question: 'Does your LinkedIn headline go beyond just your job title?',
    hint: '"Founder at X" is a job title. "I help SaaS founders get their first 100 customers | Founder at X" is a headline.',
    type: 'yesno',
    points: { yes: 4, no: 0 },
  },
  {
    id: 'q3',
    dimension: 'profile_completeness',
    question: 'Do you have a custom banner image that reflects your professional focus?',
    type: 'yesno',
    points: { yes: 2, no: 0 },
  },
  {
    id: 'q4',
    dimension: 'profile_completeness',
    question: 'How would you describe your LinkedIn About section?',
    type: 'choice',
    options: [
      { label: 'Empty or just one sentence',                   value: 'empty',        points: 0 },
      { label: 'Mostly my career history',                     value: 'history',      points: 1 },
      { label: 'Over 150 words but mostly career history',     value: 'long_history', points: 3 },
      { label: 'Clearly explains who I help and how',          value: 'targeted',     points: 5 },
    ],
  },
  {
    id: 'q5',
    dimension: 'profile_completeness',
    question: 'Do you have a Featured section with at least one item (post, link, or media)?',
    type: 'yesno',
    points: { yes: 2, no: 0 },
  },
  {
    id: 'q6',
    dimension: 'profile_completeness',
    question: 'Is your LinkedIn profile URL customised (not the default random numbers)?',
    hint: 'e.g. linkedin.com/in/yourname instead of linkedin.com/in/john-smith-8473829',
    type: 'yesno',
    points: { yes: 2, no: 0 },
  },
  {
    id: 'q7',
    dimension: 'profile_completeness',
    question: 'Do all your recent positions have more than just job title and company — with actual descriptions of your work and impact?',
    type: 'yesno',
    points: { yes: 2, no: 0 },
  },

  // ── DIMENSION 2: Content Consistency (20 pts) ──────────────────────────────
  {
    id: 'q8',
    dimension: 'content_consistency',
    question: 'How often do you currently post on LinkedIn?',
    type: 'choice',
    options: [
      { label: 'Daily',                  value: 'daily',    points: 10 },
      { label: '3–4 times a week',       value: 'frequent', points: 8  },
      { label: '1–2 times a week',       value: 'weekly',   points: 5  },
      { label: 'A few times a month',    value: 'monthly',  points: 2  },
      { label: 'Rarely or never',        value: 'never',    points: 0  },
    ],
  },
  {
    id: 'q9',
    dimension: 'content_consistency',
    question: 'Have you posted at least once in the last 7 days?',
    type: 'yesno',
    points: { yes: 3, no: 0 },
  },
  {
    id: 'q10',
    dimension: 'content_consistency',
    question: 'Do you have a content calendar, a topic list, or a posting plan?',
    type: 'yesno',
    points: { yes: 3, no: 0 },
  },
  {
    id: 'q11',
    dimension: 'content_consistency',
    question: 'How long have you been posting consistently at your current frequency?',
    type: 'choice',
    options: [
      { label: 'Less than a month',  value: 'new',         points: 0 },
      { label: '1–3 months',         value: 'early',       points: 1 },
      { label: '3–6 months',         value: 'growing',     points: 2 },
      { label: '6–12 months',        value: 'established', points: 3 },
      { label: 'Over a year',        value: 'veteran',     points: 4 },
    ],
  },

  // ── DIMENSION 3: Content Quality (20 pts) — questionnaire portion ──────────
  {
    id: 'q13_engagement',
    dimension: 'content_quality',
    question: 'What is the approximate engagement on your most recent post?',
    type: 'choice',
    options: [
      { label: '0–5 reactions',    value: 'very_low', points: 0 },
      { label: '6–20 reactions',   value: 'low',      points: 1 },
      { label: '21–100 reactions', value: 'medium',   points: 2 },
      { label: '100+ reactions',   value: 'high',     points: 3 },
      { label: "I don't know",     value: 'unknown',  points: 1 },
    ],
  },

  // ── DIMENSION 4: Audience Relevance (15 pts) ───────────────────────────────
  {
    id: 'q14',
    dimension: 'audience_relevance',
    question: 'How clearly do you know your target audience on LinkedIn?',
    type: 'choice',
    options: [
      { label: 'Very clearly — I post for a specific type of person',           value: 'very_clear', points: 5 },
      { label: 'Somewhat — I have a rough idea',                                value: 'somewhat',   points: 3 },
      { label: 'Not really — I post for a general professional audience',       value: 'vague',      points: 1 },
      { label: 'I post for everyone',                                           value: 'everyone',   points: 0 },
    ],
  },
  {
    id: 'q15',
    dimension: 'audience_relevance',
    question: 'Does your headline contain keywords your target audience would actually search for?',
    type: 'choice',
    options: [
      { label: 'Yes, definitely',          value: 'yes',   points: 4 },
      { label: 'Probably, not sure',        value: 'maybe', points: 2 },
      { label: "No, it's just my job title", value: 'no',   points: 0 },
    ],
  },
  {
    id: 'q16',
    dimension: 'audience_relevance',
    question: 'Do you use 3–5 relevant hashtags on your posts?',
    type: 'choice',
    options: [
      { label: 'Always',    value: 'always',    points: 3 },
      { label: 'Sometimes', value: 'sometimes', points: 2 },
      { label: 'Rarely',    value: 'rarely',    points: 1 },
      { label: 'Never',     value: 'never',     points: 0 },
    ],
  },
  {
    id: 'q17',
    dimension: 'audience_relevance',
    question: 'Do you actively connect with people in your target audience at least once a week?',
    type: 'yesno',
    points: { yes: 3, no: 0 },
  },

  // ── DIMENSION 5: Engagement Behaviour (15 pts) ────────────────────────────
  {
    id: 'q18',
    dimension: 'engagement_behaviour',
    question: 'Do you respond to every comment on your posts within 24 hours?',
    type: 'choice',
    options: [
      { label: 'Always',          value: 'always',    points: 4 },
      { label: 'Usually',         value: 'usually',   points: 3 },
      { label: 'Sometimes',       value: 'sometimes', points: 1 },
      { label: 'Rarely or never', value: 'never',     points: 0 },
    ],
  },
  {
    id: 'q19',
    dimension: 'engagement_behaviour',
    question: "Do you leave meaningful comments (more than \"Great post!\") on others' content at least 3 times a week?",
    type: 'choice',
    options: [
      { label: 'Yes, regularly', value: 'yes',       points: 5 },
      { label: 'Sometimes',      value: 'sometimes', points: 3 },
      { label: 'Rarely',         value: 'rarely',    points: 1 },
      { label: 'Never',          value: 'never',     points: 0 },
    ],
  },
  {
    id: 'q20',
    dimension: 'engagement_behaviour',
    question: 'Do you send personalised connection request notes rather than blank requests?',
    type: 'choice',
    options: [
      { label: 'Always',                              value: 'always',    points: 3 },
      { label: 'Sometimes',                           value: 'sometimes', points: 2 },
      { label: 'Never — I just send blank requests',  value: 'never',     points: 0 },
    ],
  },
  {
    id: 'q21',
    dimension: 'engagement_behaviour',
    question: 'Have you sent a direct message to a new connection in the last 30 days?',
    type: 'yesno',
    points: { yes: 3, no: 0 },
  },

  // ── DIMENSION 6: Niche Authority (10 pts) ─────────────────────────────────
  {
    id: 'q22',
    dimension: 'niche_authority',
    question: 'How focused is your content on LinkedIn?',
    type: 'choice',
    options: [
      { label: 'Very focused — 1 or 2 specific topics',    value: 'focused',  points: 4 },
      { label: 'Mostly focused with some variety',          value: 'mostly',   points: 2 },
      { label: 'I post about many different things',        value: 'scattered', points: 0 },
    ],
  },
  {
    id: 'q23',
    dimension: 'niche_authority',
    question: 'Have you been mentioned, tagged, or featured by others on LinkedIn in the last 3 months?',
    type: 'choice',
    options: [
      { label: 'Yes, multiple times',   value: 'often',       points: 3 },
      { label: 'Once or twice',         value: 'occasionally', points: 2 },
      { label: 'Not that I know of',    value: 'never',       points: 0 },
    ],
  },
  {
    id: 'q24',
    dimension: 'niche_authority',
    question: 'Do people reach out to you on LinkedIn asking for your advice or expertise?',
    type: 'choice',
    options: [
      { label: 'Regularly',          value: 'regularly',   points: 3 },
      { label: 'Occasionally',       value: 'occasionally', points: 2 },
      { label: 'Rarely or never',    value: 'never',       points: 0 },
    ],
  },
]

// ─── Group questions by dimension for the wizard UI ──────────────────────────

export const DIMENSION_ORDER = [
  'profile_completeness',
  'content_consistency',
  'content_quality',
  'audience_relevance',
  'engagement_behaviour',
  'niche_authority',
] as const

export function getQuestionsByDimension(dimension: string): AuditQuestion[] {
  return AUDIT_QUESTIONS.filter(q => q.dimension === dimension)
}
