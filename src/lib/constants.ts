import type { PricingPlan } from '@/types'

export const BRAND = {
  name: 'PostPika',
  tagline: 'LinkedIn content AI for Indian professionals',
  primaryColor: '#1D9E75',
  navyColor: '#0A2540',
  domain: 'postpika.com',
} as const

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price_monthly: 0,
    price_yearly: 0,
    features: [
      '5 posts per month',
      '10 ideas per month',
      'Basic tones',
      'Draft saving',
    ],
    posts_per_month: 5,
    ideas_per_month: 10,
  },
  {
    id: 'pro',
    name: 'Pro',
    price_monthly: 999,
    price_yearly: 9990,
    features: [
      '100 posts per month',
      'Unlimited ideas',
      'All tones + Hinglish',
      'Content calendar',
      'Analytics',
      'Priority support',
    ],
    posts_per_month: 100,
    ideas_per_month: -1, // unlimited
    highlighted: true,
  },
  {
    id: 'team',
    name: 'Team',
    price_monthly: 2999,
    price_yearly: 29990,
    features: [
      'Unlimited posts',
      'Unlimited ideas',
      'All Pro features',
      'Team collaboration',
      'Custom branding',
      'Dedicated support',
    ],
    posts_per_month: -1, // unlimited
    ideas_per_month: -1, // unlimited
  },
]

export const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'inspirational', label: 'Inspirational' },
  { value: 'educational', label: 'Educational' },
  { value: 'humorous', label: 'Humorous' },
] as const

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'hinglish', label: 'Hinglish' },
] as const

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/generate', label: 'Generate', icon: 'Wand2' },
  { href: '/calendar', label: 'Calendar', icon: 'Calendar' },
  { href: '/posts', label: 'Posts', icon: 'FileText' },
  { href: '/ideas', label: 'Ideas', icon: 'Lightbulb' },
  { href: '/analytics', label: 'Analytics', icon: 'BarChart2' },
  { href: '/settings', label: 'Settings', icon: 'Settings' },
] as const

export const USAGE_LIMITS: Record<string, { posts: number; ideas: number }> = {
  free: { posts: 5, ideas: 10 },
  pro: { posts: 100, ideas: -1 },
  team: { posts: -1, ideas: -1 },
}
