// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived'

export type PlanType = 'free' | 'starter' | 'pro' | 'agency'

export type ToneType =
  | 'professional'
  | 'storytelling'
  | 'controversial'
  | 'educational'
  | 'inspirational'

export type NicheType =
  | 'Tech/SaaS'
  | 'Finance'
  | 'Marketing'
  | 'Consulting'
  | 'HR/Talent'
  | 'Sales'
  | 'Founder/Startup'
  | 'Other'

export type SubscriptionStatus =
  | 'created'
  | 'authenticated'
  | 'active'
  | 'pending'
  | 'halted'
  | 'cancelled'
  | 'completed'
  | 'expired'
  | 'paused'


// ─── Database Row Interfaces (mirror schema exactly) ─────────────────────────

export interface NotificationPrefs {
  weekly_ideas: boolean
  usage_limit: boolean
  monthly_reset: boolean
}

export interface Profile {
  id: string                          // uuid FK → auth.users
  email: string
  full_name: string | null
  avatar_url: string | null
  linkedin_url: string | null
  niche: NicheType
  plan: PlanType
  generations_used_this_month: number
  generations_reset_date: string | null  // timestamptz → ISO string
  onboarding_completed: boolean
  razorpay_customer_id: string | null
  razorpay_subscription_id: string | null
  notification_prefs: NotificationPrefs
  created_at: string
  updated_at: string
}

export interface Post {
  id: string                          // uuid
  user_id: string                     // uuid FK → profiles
  content: string
  title: string | null
  tone: ToneType
  niche: NicheType | null
  topic_input: string | null
  status: PostStatus
  scheduled_for: string | null        // timestamptz → ISO string
  published_at: string | null
  character_count: number | null
  generation_index: number
  is_favourite: boolean
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string                          // uuid
  user_id: string                     // uuid FK → profiles
  razorpay_subscription_id: string
  razorpay_plan_id: string
  plan_name: string
  status: SubscriptionStatus
  current_start: string | null        // timestamptz → ISO string
  current_end: string | null
  created_at: string
  updated_at: string
}

export interface UsageLog {
  id: string                          // uuid
  user_id: string                     // uuid FK → profiles
  action: string
  tokens_used: number
  metadata: Record<string, unknown>
  created_at: string
}


// ─── Application-level Types ──────────────────────────────────────────────────

/** One AI-generated post variation returned from /api/generate */
export interface GeneratedPost {
  variation: number
  content: string
}

/** Usage quota info for the current billing period */
export interface UsageInfo {
  used: number
  limit: number       // -1 = unlimited
  plan: PlanType
  resetDate: string   // ISO date string
}

/** Payload for POST /api/posts */
export interface CreatePostInput {
  content: string
  title?: string
  tone: ToneType
  niche?: NicheType
  topic_input?: string
  status?: PostStatus
  scheduled_for?: string
  generation_index?: number
}

/** Payload for PATCH /api/posts/[id] */
export type UpdatePostInput = Partial<
  Pick<
    Post,
    | 'content'
    | 'title'
    | 'tone'
    | 'niche'
    | 'topic_input'
    | 'status'
    | 'scheduled_for'
    | 'is_favourite'
  >
>

/** Payload for POST /api/generate */
export interface GeneratePostRequest {
  topic: string
  tone: ToneType
  niche?: NicheType
  variations?: number   // default 3
  keywords?: string[]   // passed through to LLM prompt
  language?: 'en' | 'hi' | 'hinglish'
}

/** Payload for POST /api/generate/ideas */
export interface GenerateIdeasRequest {
  niche: NicheType
  count?: number        // default 5
}

/** UI-only idea shape (not persisted to its own table) */
export interface Idea {
  id: string
  user_id: string
  title: string
  description: string | null
  tags: string[]
  used: boolean
  created_at: string
}

/** Pricing plan definition used in the PricingTable component */
export interface PricingPlan {
  id: PlanType
  name: string
  price_monthly: number         // INR paise-free, 0 = free tier
  generations_per_month: number // -1 = unlimited
  features: string[]
  highlighted?: boolean
}

// ─── Tone / Format Config ──────────────────────────────────────────────────────

export interface ToneConfig {
  id: string
  label: string
  icon: string
  description: string
  colorClass: string
  systemPrompt: string
  isCustom?: boolean
  customId?: string
}

export interface FormatConfig {
  id: string
  label: string
  icon: string
  description: string
  example: string
  formatPrompt: string
  isCustom?: boolean
  customId?: string
}

// ─── Custom Tones / Formats (DB rows) ─────────────────────────────────────────

export interface CustomTone {
  id: string
  user_id: string
  name: string
  system_prompt: string
  config_json: {
    base_personality: string
    audience: string[]
    formality: number
    emotion: number
    length: number
    perspective: number
  }
  is_active: boolean
  created_at: string
}

export interface CustomFormat {
  id: string
  user_id: string
  name: string
  structure_type: string
  format_prompt: string
  config_json: {
    skeleton: string
    sections: { label: string; instruction: string }[]
  }
  is_active: boolean
  created_at: string
}

export interface UserContentPreferences {
  user_id: string
  favourite_tones: string[]
  favourite_formats: string[]
  default_tone: string
  default_format: string
}
