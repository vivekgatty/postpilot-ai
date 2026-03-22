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
  // repurpose columns (added via SQL migration)
  repurpose_session_id: string | null
  is_repurposed: boolean
  repurpose_angle: string | null
  source_url: string | null
  source_title: string | null
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

// ─── Hook Generator ────────────────────────────────────────────────────────────

export interface HookStyle {
  id: string
  label: string
  category: string
  description: string
  template: string
  example: string
  isPremium: boolean
}

export interface HookResult {
  id: string
  styleId: string
  styleLabel: string
  category: string
  content: string
  characterCount: number
}

export interface GenerateHooksRequest {
  idea: string
  niche: string
  goal: 'comments' | 'credibility' | 'followers' | 'leads' | 'story' | 'debate'
  selectedStyles: string[]
}

export interface SavedHook {
  id: string
  user_id: string
  content: string
  style_id: string
  style_label: string
  idea_input: string
  niche: string
  created_at: string
}

// ─── Content Planner ─────────────────────────────────────────────────────────

export interface ContentPillar {
  id: string
  user_id: string
  name: string
  description: string
  color: string
  weight: 'high' | 'medium' | 'low'
  tone_id: string
  position: number
  is_active: boolean
  created_at: string
}

export interface PlannerSettings {
  user_id: string
  goals: string[]
  posting_frequency: number
  preferred_days: string[]
  preferred_time: string
  format_mix: {
    text: number
    carousel: number
    poll: number
    question: number
  }
  setup_completed: boolean
}

export interface PlannedPost {
  id: string
  user_id: string
  pillar_id: string | null
  post_id: string | null
  title: string
  topic: string
  hook_suggestion: string
  format: 'text' | 'carousel' | 'poll' | 'question'
  tone_id: string
  why_this_week: string
  planned_date: string
  planned_time: string
  status: 'idea' | 'draft' | 'scheduled' | 'published' | 'missed'
  linkedin_post_id: string | null
  linkedin_posted_at: string | null
  linkedin_post_url: string | null
  is_recurring: boolean
  recurring_pattern: string | null
  pillar?: ContentPillar
}

export interface ContentBankItem {
  id: string
  user_id: string
  title: string
  topic: string
  hook: string
  pillar_id: string | null
  format: string
  source: 'manual' | 'idea_lab' | 'hook_generator' | 'ai_suggestion'
  is_used: boolean
  created_at: string
  pillar?: ContentPillar
}

export interface LinkedInConnection {
  user_id: string
  linkedin_urn: string
  access_token: string
  token_expires_at: string
  scopes: string[]
  connected_at: string
}

export interface PublishQueueItem {
  id: string
  user_id: string
  planned_post_id: string
  post_id: string
  content: string
  scheduled_for: string
  status: 'pending' | 'processing' | 'published' | 'failed' | 'cancelled'
  linkedin_post_id: string | null
  linkedin_post_url: string | null
  error_message: string | null
  attempts: number
}

export interface MonthStats {
  planned: number
  completed: number
  missed: number
  streak: number
  pillar_distribution: Record<string, number>
  format_distribution: Record<string, number>
  variety_score: number
  format_score: number
  consistency_score: number
}

// ─── Content Repurposer ───────────────────────────────────────────────────────

export interface RepurposeSettings {
  post_count: number
  tone_id: string
  include_carousel: boolean
  include_poll: boolean
  add_hashtags: boolean
  add_attribution: boolean
  selected_angles: string[]
  niche: string
}

export interface RepurposeSession {
  id: string
  user_id: string
  source_type: 'url' | 'text' | 'pdf' | 'youtube' | 'twitter' | 'newsletter' | 'google_docs'
  source_url: string | null
  source_title: string | null
  source_author: string | null
  source_platform: string | null
  extracted_text: string | null
  extracted_topics: string[]
  word_count: number
  settings: RepurposeSettings
  posts_generated: number
  posts_saved: number
  status: 'extracting' | 'extracted' | 'generating' | 'complete' | 'failed'
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface ExtractedContent {
  title: string
  author: string
  text: string
  platform: string
  source_type: string
  word_count: number
  error?: string
  needs_manual_paste?: boolean
}

export interface RepurposeAngle {
  id: string
  title: string
  description: string
  format: 'text' | 'carousel' | 'question' | 'poll'
  emotional_hook: string
}

export interface CarouselSlide {
  id: string
  slide_number: number
  type: 'title' | 'content' | 'summary' | 'cta'
  heading: string
  body: string
  sub_line?: string
  cta_text?: string
  author_handle?: string
  author_name?: string
  number_badge?: string
  supporting_element?: string
}

export interface CarouselTheme {
  id: string
  label: string
  description: string
  plan_required: 'free' | 'starter' | 'pro' | 'agency'
  background: string
  text_color: string
  accent_color: string
  secondary_text: string
  heading_font_size: number
  body_font_size: number
  preview_gradient?: string[]
}

export interface CarouselType {
  id: string
  label: string
  description: string
  best_for: string
  slide_structure: string[]
  plan_required: 'free' | 'starter' | 'pro' | 'agency'
  icon: string
  example_title: string
}

export interface CarouselConfig {
  topic: string
  carousel_type: string
  theme_id: string
  slide_count: number
  tone_id: string
  niche: string
  aspect_ratio: 'square' | 'portrait'
  accent_color?: string
  show_slide_numbers: boolean
  show_author_handle: boolean
  show_branding: boolean
  font_style: 'professional' | 'modern' | 'bold'
}

export interface CarouselData {
  id?: string
  title: string
  topic: string
  carousel_type: string
  theme_id: string
  aspect_ratio: 'square' | 'portrait'
  accent_color?: string
  show_slide_numbers: boolean
  show_author_handle: boolean
  show_branding: boolean
  font_style: string
  slides: CarouselSlide[]
  status: 'draft' | 'exported' | 'published'
  niche?: string
  tone_id?: string
}

export interface AuthorBranding {
  full_name: string
  handle: string
  avatar_url?: string
  niche?: string
}

export interface RepurposedPost {
  angle_id: string
  angle_title: string
  content: string
  format: 'text' | 'carousel' | 'question' | 'poll'
  carousel_slides?: CarouselSlide[]
  poll_options?: string[]
  character_count: number
  tone_id: string
  saved?: boolean
  post_id?: string
}

// ─── Personal Brand Audit ──────────────────────────────────────────────────────

export interface AuditAnswer {
  questionId: string
  value: string
  points: number
}

export interface AuditDimensionScore {
  dimension: string
  label: string
  earned: number
  max: number
  percentage: number
  feedback: string
}

export interface AuditResult {
  id: string
  linkedin_url: string
  linkedin_username: string
  full_name: string | null
  profile_photo_url: string | null
  sample_post_content: string | null
  total_score: number
  tier_key: string
  tier_label: string
  level_name: string
  level_key: string
  dimension_scores: AuditDimensionScore[]
  ai_top_actions: string[]
  ai_content_quality: {
    hook_score: number
    readability_score: number
    value_score: number
    cta_score: number
    authenticity_score: number
    feedback: string
  } | null
  is_unlocked: boolean
  share_token: string
  created_at: string
}
