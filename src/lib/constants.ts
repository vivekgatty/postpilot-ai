import type { NicheType, PlanType, PricingPlan, ToneType, ToneConfig, FormatConfig } from '@/types'

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

// ─── System Tones (18 tones) ─────────────────────────────────────────────────

export const SYSTEM_TONES: Record<string, ToneConfig> = {
  professional: { id:'professional', label:'Professional', icon:'Briefcase', description:'Clear, authoritative, business-focused', colorClass:'#0A2540', systemPrompt:'You are a senior business leader and LinkedIn thought leader in India. You write with authority and precision. You simplify complex ideas without dumbing them down. Every sentence earns its place. No buzzwords, no filler, no corporate jargon.' },
  storytelling: { id:'storytelling', label:'Storytelling', icon:'BookOpen', description:'Personal narrative, emotional pull', colorClass:'#7F77DD', systemPrompt:'You are a master storyteller on LinkedIn. Your structure is situation then struggle then lesson. You make readers feel something before they think something. Your first line always creates an emotional pull. Vulnerable, authentic, human.' },
  controversial: { id:'controversial', label:'Controversial', icon:'Zap', description:'Bold take, sparks debate', colorClass:'#EF9F27', systemPrompt:'You are a bold contrarian thinker on LinkedIn India. You challenge popular wisdom with real evidence and experience. You spark debates that make intelligent people stop and think. Provocative but never personal or cruel.' },
  educational: { id:'educational', label:'Educational', icon:'GraduationCap', description:'Teaches something valuable', colorClass:'#378ADD', systemPrompt:'You are a top educator on LinkedIn for busy Indian professionals. You break down complex topics into clean frameworks. You use numbered steps, real analogies, and concrete examples. Every reader leaves knowing something actionable they did not know before.' },
  inspirational: { id:'inspirational', label:'Inspirational', icon:'Flame', description:'Motivates and uplifts', colorClass:'#D85A30', systemPrompt:'You are a motivational voice for Indian founders and professionals. You tell stories of resilience and growth. You make people believe their next level is possible. Your posts always end with a challenge that stirs people to act.' },
  humblebrag: { id:'humblebrag', label:'Humble Brag', icon:'Award', description:'Share wins with humility', colorClass:'#1D9E75', systemPrompt:'You share significant wins while keeping the focus on the lesson and the team rather than on personal ego. The win is the hook but the real value is the insight behind it. You are self-aware, grateful, and specific about what made the achievement possible.' },
  vulnerable: { id:'vulnerable', label:'Vulnerable', icon:'Heart', description:'Honest about failures and fears', colorClass:'#D4537E', systemPrompt:'You write with radical honesty about failures, fears, and mistakes on LinkedIn. You find the universal truth in personal struggle. Your posts are emotionally intelligent but never self-pitying. The lesson always emerges clearly from the difficulty.' },
  datadriven: { id:'datadriven', label:'Data-Driven', icon:'BarChart2', description:'Lead with numbers and research', colorClass:'#185FA5', systemPrompt:'You open every post with a surprising statistic or research finding and unpack what it truly means. You cite specifics wherever possible. Your posts feel like sharp briefings — dense with useful insight, light on filler. Authority comes through evidence.' },
  mythbuster: { id:'mythbuster', label:'Myth Buster', icon:'ShieldOff', description:'Challenge conventional wisdom', colorClass:'#E24B4A', systemPrompt:'You identify widely-held beliefs in your niche and dismantle them with direct experience or clear evidence. Your structure is: state the myth, explain why people believe it, show clearly why it is wrong, give the actual truth. Confident and backed up.' },
  lessonslearned: { id:'lessonslearned', label:'Lessons Learned', icon:'Lightbulb', description:'Retrospective insights over time', colorClass:'#BA7517', systemPrompt:'You write retrospective posts that extract numbered lessons from a period of time or experience. You are honest, specific, and never generic. Each lesson is concrete enough that a reader can immediately apply it. No platitudes.' },
  behindthescenes: { id:'behindthescenes', label:'Behind The Scenes', icon:'Eye', description:'Show the unseen process', colorClass:'#0F6E56', systemPrompt:'You pull back the curtain on your process, decisions, and the messy middle of professional life. You show what success actually looks like from the inside rather than the polished outside. Raw, specific, process-focused, and genuinely useful.' },
  clientwin: { id:'clientwin', label:'Client Win', icon:'Trophy', description:'Case study without the pitch', colorClass:'#3B6D11', systemPrompt:'You share client results as a case study using the format: Problem, then Approach, then Result, then Lesson. You demonstrate competence without directly selling. You use specific numbers wherever possible. The result speaks for itself and you explain the method behind it.' },
  hottake: { id:'hottake', label:'Hot Take', icon:'TrendingUp', description:'One sharp defensible opinion', colorClass:'#A32D2D', systemPrompt:'You deliver one sharp, specific, defensible opinion with total confidence and clarity. You back it up with reasoning, not just assertion. You are not afraid of disagreement. Direct, punchy, no hedging, no qualifying every other sentence.' },
  framework: { id:'framework', label:'Framework', icon:'Layout', description:'Share your mental model or system', colorClass:'#534AB7', systemPrompt:'You share proprietary mental models, systems, and frameworks that you actually use. Your posts are structured around a named model or approach that others can immediately adopt. You position the framework as a practical tool, not an abstract theory.' },
  resourcelist: { id:'resourcelist', label:'Resource List', icon:'BookMarked', description:'Curated picks with reasons', colorClass:'#0C447C', systemPrompt:'You curate and recommend books, tools, people, or resources with a brief personal explanation of why each one specifically helped you. Your curation feels considered and personal, never like a generic listicle. You have used or read everything you recommend.' },
  prediction: { id:'prediction', label:'Prediction', icon:'Telescope', description:'Bold industry forecast', colorClass:'#854F0B', systemPrompt:'You make specific, bold predictions about where your industry is heading in the next 1 to 3 years. You explain your reasoning clearly and confidently. You are willing to be wrong in public because you have thought this through carefully and your logic is sound.' },
  hiring: { id:'hiring', label:'Hiring Post', icon:'Users', description:'Attract great talent authentically', colorClass:'#085041', systemPrompt:'You announce job openings in a way that simultaneously attracts the right candidate and builds employer brand. You make the company story genuinely compelling and the role feel like a real opportunity rather than a transaction. Honest about what makes working here hard and what makes it worthwhile.' },
  gratitude: { id:'gratitude', label:'Gratitude', icon:'Star', description:'Recognise others publicly', colorClass:'#993556', systemPrompt:'You recognise specific people publicly with precision and warmth. Generic thanks fall completely flat so you are always specific about exactly what the person did and precisely why it mattered to you. Warm and genuine without being sycophantic or exaggerated.' },
}

// First 6 shown by default in ToneSelector
export const DEFAULT_TONE_IDS = ['professional','storytelling','controversial','educational','inspirational','humblebrag']

// ─── System Formats (12 formats) ─────────────────────────────────────────────

export const SYSTEM_FORMATS: Record<string, FormatConfig> = {
  listicle: { id:'listicle', label:'The Listicle', icon:'List', description:'Numbered points that are easy to read', example:'7 things I wish someone told me before...', formatPrompt:'Structure: A strong hook on line 1 that promises specific numbered insights. Then 5 to 7 numbered points each being one concrete insight in 1 to 2 sentences. End with a closing CTA or question on its own line. Use line breaks between each numbered point.' },
  beforeafter: { id:'beforeafter', label:'Before & After', icon:'ArrowRightLeft', description:'A clear transformation narrative', example:'6 months ago vs today — here is what changed', formatPrompt:'Structure: Hook line that teases the transformation. Then "Before:" in 1 to 2 sentences. Then "After:" in 1 to 2 sentences. Then 3 to 4 sentences on what changed and why. End with a lesson and CTA question.' },
  challenge: { id:'challenge', label:'30-Day Challenge', icon:'CalendarCheck', description:'Results from doing something every day', example:'I did X every single day for 30 days. Here is what happened.', formatPrompt:'Structure: Hook announcing the challenge and why you started. Brief explanation of what you did each day in 2 to 3 sentences. Specific results with numbers. Single biggest lesson. Ask readers if they have tried something similar.' },
  letter: { id:'letter', label:'The Letter', icon:'Mail', description:'Written directly to someone specific', example:'Dear 25-year-old me... / Dear founder who just got rejected...', formatPrompt:'Structure: Open with "Dear [specific person or past self]," on its own line. Then 1 to 2 sentences of empathetic acknowledgement. Then 4 to 5 specific pieces of advice each on its own line. End with one sentence of genuine encouragement. Sign off with your name or "Someone who has been there."' },
  comparison: { id:'comparison', label:'The Comparison', icon:'Columns', description:'Two contrasting approaches side by side', example:'Most people do X. Top performers do Y.', formatPrompt:'Structure: Strong hook establishing the contrast. Then "Most people:" in 2 to 3 sentences on the common approach and why it underperforms. Then "Top performers:" or "What actually works:" in 2 to 3 sentences on the better approach. End with a question inviting readers to share which side they are on.' },
  casestudy: { id:'casestudy', label:'Mini Case Study', icon:'FileSearch', description:'Problem to result to lesson', example:'My client had a specific problem. Here is how we fixed it.', formatPrompt:'Structure: Hook that leads with the end result to create curiosity. Then "The problem:" in 2 sentences. Then "What we did:" in 2 to 3 sentences. Then "The result:" with specific numbers. Then "The lesson:" — one clear takeaway others can apply.' },
  unpopularopinion: { id:'unpopularopinion', label:'Unpopular Opinion', icon:'MessageSquare', description:'Contrarian view defended with evidence', example:'I am going to say something most people in my industry disagree with...', formatPrompt:'Structure: Open with "Unpopular opinion:" State the opinion in 1 to 2 sentences. Give 3 specific reasons with evidence. Briefly acknowledge the strongest counterargument. Stand firm with nuance. End with a question.' },
  threadstyle: { id:'threadstyle', label:'Thread-Style', icon:'AlignLeft', description:'Long-form broken into clear numbered sections', example:'1/ The thing nobody tells you about starting a business...', formatPrompt:'Structure: Hook line followed by the number of points coming. Then sections numbered 1/ through 7/ where each covers one aspect in 2 to 3 sentences. Each section stands alone as a useful insight. Final section is the summary lesson. End with "Follow for more on [topic]." Use blank lines between sections.' },
  questionpost: { id:'questionpost', label:'Question Post', icon:'HelpCircle', description:'Drives maximum comment engagement', example:'What is the single best piece of advice you have ever received?', formatPrompt:'Structure: 2 to 3 sentence context paragraph explaining why this question matters in this niche. Then ask the question directly on its own line. Then optionally share your own brief answer in 1 to 2 sentences to model the response type.' },
  recommendation: { id:'recommendation', label:'Recommendation List', icon:'BookMarked', description:'Curated picks with personal reasons', example:'5 books that completely changed how I think about sales', formatPrompt:'Structure: Hook establishing your credibility to make this recommendation. Then list 4 to 6 items: name on its own line, one sentence on what it is, one sentence on how it specifically helped you. End by asking readers to share their own top recommendation.' },
  pollpost: { id:'pollpost', label:'Poll Post', icon:'BarChart', description:'Drives 5x reach via LinkedIn polls', example:'Quick question for my network — I am curious what you think', formatPrompt:'Structure: 2 to 3 sentences giving context on why this question matters. Then "Quick poll:" on its own line. Then list exactly 4 specific answer options. End with a note encouraging people to share reasoning in comments. Note: remind the user to create the actual LinkedIn poll separately when publishing.' },
  rant: { id:'rant', label:'The Rant', icon:'AlertOctagon', description:'Structured frustration with a resolution', example:'I am genuinely frustrated by something I keep seeing in my industry...', formatPrompt:'Structure: Hook expressing a specific frustration — precise and recognisable. Then 2 to 3 sentences on exactly what you keep seeing. Then 2 sentences on why this matters and who it hurts. Then 2 to 3 sentences on what should be done differently. End by inviting others who feel the same to share in comments.' },
}

// ─── Custom Tone / Format Limits ─────────────────────────────────────────────

export const TONE_CUSTOM_LIMITS: Record<string, number> = {
  free: 0, starter: 3, pro: 10, agency: 999,
}

export const FORMAT_CUSTOM_LIMITS: Record<string, number> = {
  free: 0, starter: 3, pro: 10, agency: 999,
}

// ─── Tone Builder Helpers ─────────────────────────────────────────────────────

export const BASE_PERSONALITIES = [
  { id: 'authoritative', label: 'Authoritative', description: 'Confident, expert, commands respect' },
  { id: 'warm',          label: 'Warm & Personal', description: 'Approachable, relatable, genuine' },
  { id: 'witty',         label: 'Witty & Sharp', description: 'Clever, uses humour effectively' },
  { id: 'analytical',   label: 'Analytical', description: 'Data-led, methodical, precise' },
  { id: 'energetic',    label: 'High-Energy', description: 'Bold, enthusiastic, action-oriented' },
  { id: 'calm',         label: 'Calm & Measured', description: 'Thoughtful, steady, considered' },
]

export const FORMAT_SKELETONS = [
  { id: 'A', label: 'Hook → List → CTA', preview: 'HOOK LINE\n\n• Point 1\n• Point 2\n• Point 3\n\nCTA or question' },
  { id: 'B', label: 'Story Arc', preview: 'HOOK LINE\n\nStory paragraph\n\nThe turning point\n\nLesson and CTA' },
  { id: 'C', label: 'Before & After', preview: 'HOOK\n\nBefore: [state]\n\nAfter: [state]\n\nWhat changed + CTA' },
  { id: 'D', label: 'Numbered Steps', preview: 'HOOK\n\n1. First step\n2. Second step\n3. Third step\n\nCTA or question' },
  { id: 'E', label: 'Bold Statement', preview: 'BOLD CLAIM\n\nContext and reasoning\n\nEvidence or example\n\nQuestion to audience' },
  { id: 'F', label: 'Free Structure', preview: 'Write your own structure below. Describe exactly how you want the post organised.' },
]

// Section defaults per skeleton for Format builder
export const SKELETON_SECTION_DEFAULTS: Record<string, { label: string; instruction: string }[]> = {
  A: [
    { label: 'Hook', instruction: 'Start with a bold statement or surprising insight' },
    { label: 'Points', instruction: 'Each point is one specific, actionable insight in 1 to 2 sentences' },
    { label: 'CTA', instruction: 'Ask a question that invites readers to share their experience' },
  ],
  B: [
    { label: 'Hook', instruction: 'Open with an emotionally charged or surprising first line' },
    { label: 'Story', instruction: 'Tell the story with specific details and honest emotion' },
    { label: 'Turn', instruction: 'Describe the moment of realisation or change' },
    { label: 'Lesson', instruction: 'State the single most important takeaway' },
    { label: 'CTA', instruction: 'Ask readers if they have experienced something similar' },
  ],
  C: [
    { label: 'Hook', instruction: 'Tease the transformation with the end result' },
    { label: 'Before', instruction: 'Describe the previous situation specifically' },
    { label: 'After', instruction: 'Describe the current situation specifically' },
    { label: 'Bridge', instruction: 'Explain the 2 to 3 key things that created the change' },
    { label: 'Lesson', instruction: 'The transferable lesson plus a closing question' },
  ],
  D: [
    { label: 'Hook', instruction: 'Open with why these steps matter' },
    { label: 'Steps', instruction: 'Each step is specific and immediately actionable' },
    { label: 'CTA', instruction: 'Invite readers to try the first step today' },
  ],
  E: [
    { label: 'Statement', instruction: 'State your bold claim in one clear sentence' },
    { label: 'Context', instruction: 'Give 2 to 3 sentences of background and reasoning' },
    { label: 'Evidence', instruction: 'Share your specific evidence or personal example' },
    { label: 'Question', instruction: 'Ask readers what they think about your claim' },
  ],
  F: [
    { label: 'Structure', instruction: 'Describe exactly how you want your post structured. Be as specific as possible about the order, length, and content of each section.' },
  ],
}
