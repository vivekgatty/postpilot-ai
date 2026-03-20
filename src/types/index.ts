export type UserRole = 'free' | 'pro' | 'team'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  headline: string | null
  role: UserRole
  linkedin_url: string | null
  industry: string | null
  tone_preference: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  tone: string
  status: 'draft' | 'scheduled' | 'published'
  scheduled_at: string | null
  published_at: string | null
  likes: number
  comments: number
  impressions: number
  created_at: string
  updated_at: string
}

export interface Idea {
  id: string
  user_id: string
  title: string
  description: string | null
  tags: string[]
  used: boolean
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan: UserRole
  razorpay_subscription_id: string | null
  status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface UsageStats {
  posts_generated: number
  posts_limit: number
  ideas_generated: number
  ideas_limit: number
  period_start: string
  period_end: string
}

export type Tone =
  | 'professional'
  | 'casual'
  | 'storytelling'
  | 'inspirational'
  | 'educational'
  | 'humorous'

export interface GeneratePostRequest {
  topic: string
  tone: Tone
  keywords?: string[]
  language?: 'en' | 'hi' | 'hinglish'
}

export interface GenerateIdeasRequest {
  industry: string
  role: string
  count?: number
}

export interface PricingPlan {
  id: UserRole
  name: string
  price_monthly: number
  price_yearly: number
  features: string[]
  posts_per_month: number
  ideas_per_month: number
  highlighted?: boolean
}
