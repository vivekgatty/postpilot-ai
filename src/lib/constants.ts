import type { NicheType, PlanType, PricingPlan, ToneType } from '@/types'

// ─── Brand ────────────────────────────────────────────────────────────────────

export const BRAND = {
  name: 'PostPika',
  tagline: 'LinkedIn content AI for Indian professionals',
  primaryColor: '#1D9E75',
  navyColor: '#0A2540',
  domain: 'postpika.com',
} as const


// ─── Plans ────────────────────────────────────────────────────────────────────

/** Monthly AI generation limits per plan. -1 = unlimited. */
export const PLAN_LIMITS: Record<PlanType, number> = {
  free: 5,
  starter: 200,
  pro: -1,
  agency: -1,
}

/** Razorpay plan prices in INR (₹). Free plan has no price entry. */
export const PLAN_PRICES: Record<Exclude<PlanType, 'free'>, number> = {
  starter: 799,
  pro: 1999,
  agency: 4999,
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price_monthly: 0,
    generations_per_month: PLAN_LIMITS.free,
    features: [
      '5 generations per month',
      'All 5 tones',
      'Draft & save posts',
      'Basic post editor',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price_monthly: PLAN_PRICES.starter,
    generations_per_month: PLAN_LIMITS.starter,
    features: [
      '200 generations per month',
      'All 5 tones',
      'Content calendar',
      'Favourite posts',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price_monthly: PLAN_PRICES.pro,
    generations_per_month: PLAN_LIMITS.pro,   // unlimited
    features: [
      'Unlimited generations',
      'All 5 tones',
      'Content calendar',
      'Analytics dashboard',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price_monthly: PLAN_PRICES.agency,
    generations_per_month: PLAN_LIMITS.agency, // unlimited
    features: [
      'Unlimited generations',
      'All 5 tones',
      'Multi-profile management',
      'White-label exports',
      'Dedicated account manager',
    ],
  },
]


// ─── Tones ────────────────────────────────────────────────────────────────────

export const TONE_DESCRIPTIONS: Record<ToneType, string> = {
  professional:   'Polished and authoritative — ideal for thought leadership and industry insights.',
  storytelling:   'Narrative-driven with a personal arc — builds emotional connection and relatability.',
  controversial:  'Bold, opinion-led takes that spark debate and maximise comment engagement.',
  educational:    'Clear, structured breakdowns that teach the reader something actionable.',
  inspirational:  'Motivational and forward-looking — energises your audience to take action.',
}

export const TONES: { value: ToneType; label: string; description: string }[] =
  (Object.keys(TONE_DESCRIPTIONS) as ToneType[]).map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
    description: TONE_DESCRIPTIONS[value],
  }))


// ─── Niches ───────────────────────────────────────────────────────────────────

export const NICHE_OPTIONS: NicheType[] = [
  'Tech/SaaS',
  'Finance',
  'Marketing',
  'Consulting',
  'HR/Talent',
  'Sales',
  'Founder/Startup',
  'Other',
]


// ─── Languages (used on generate page) ───────────────────────────────────────

export const LANGUAGES = [
  { value: 'en',        label: 'English'  },
  { value: 'hi',        label: 'Hindi'    },
  { value: 'hinglish',  label: 'Hinglish' },
] as const


// ─── Navigation ───────────────────────────────────────────────────────────────

export const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard', icon: 'LayoutDashboard', proOnly: false },
  { href: '/generate',   label: 'Generate',  icon: 'Sparkles',        proOnly: false },
  { href: '/posts',      label: 'My Posts',  icon: 'FileText',        proOnly: false },
  { href: '/calendar',   label: 'Calendar',  icon: 'Calendar',        proOnly: false },
  { href: '/ideas',      label: 'Idea Lab',  icon: 'Lightbulb',       proOnly: false },
  { href: '/analytics',  label: 'Analytics', icon: 'BarChart2',       proOnly: true  },
] as const

/** Niche metadata for onboarding cards */
export const NICHE_META: Record<string, { icon: string; example: string }> = {
  'Tech/SaaS':        { icon: '💻', example: 'For founders, PMs and engineers'          },
  'Finance':          { icon: '💰', example: 'For bankers, investors and analysts'       },
  'Marketing':        { icon: '📣', example: 'For marketers and growth leaders'          },
  'Consulting':       { icon: '🤝', example: 'For consultants, advisors and coaches'     },
  'HR/Talent':        { icon: '👥', example: 'For HR and talent professionals'           },
  'Sales':            { icon: '🎯', example: 'For SDRs, AEs and sales leaders'           },
  'Founder/Startup':  { icon: '🚀', example: 'For founders and entrepreneurs'            },
  'Other':            { icon: '✨', example: 'For professionals in any other field'      },
}
