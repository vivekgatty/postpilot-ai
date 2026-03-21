// ─── Planner Goals ────────────────────────────────────────────────────────────

export const PLANNER_GOALS = [
  { id: 'clients',    label: 'Get consulting or freelance clients' },
  { id: 'authority',  label: 'Build authority in my niche' },
  { id: 'investors',  label: 'Attract investors or funding' },
  { id: 'job',        label: 'Find a new job or career opportunity' },
  { id: 'network',    label: 'Grow my network in a specific industry' },
  { id: 'speaking',   label: 'Build personal brand for speaking or media' },
  { id: 'traffic',    label: 'Drive traffic to newsletter, podcast or product' },
  { id: 'visibility', label: 'General professional visibility' },
]

// ─── Pillar Colours ───────────────────────────────────────────────────────────

export const PILLAR_COLORS = [
  '#1D9E75',
  '#534AB7',
  '#BA7517',
  '#993556',
  '#185FA5',
  '#D85A30',
]

// ─── Pillar Suggestions by Niche ─────────────────────────────────────────────

export const PILLAR_SUGGESTIONS: Record<string, { name: string; description: string; tone_id: string }[]> = {
  'Tech/SaaS': [
    { name: 'Building in public',   description: 'Behind the scenes of building a product',         tone_id: 'behindthescenes' },
    { name: 'Growth lessons',       description: 'What I learn from scaling a SaaS',                 tone_id: 'lessonslearned' },
    { name: 'Founder mindset',      description: 'Mental models and leadership thinking',            tone_id: 'framework' },
  ],
  'Finance': [
    { name: 'Market insights',      description: 'Analysis of financial trends and news',            tone_id: 'datadriven' },
    { name: 'Client wins',          description: 'Results and case studies (anonymised)',             tone_id: 'clientwin' },
    { name: 'Financial literacy',   description: 'Education for non-finance professionals',          tone_id: 'educational' },
  ],
  'Marketing': [
    { name: 'Campaign breakdowns',  description: "What worked, what didn't and why",                 tone_id: 'behindthescenes' },
    { name: 'Marketing frameworks', description: 'Systems and models I actually use',                tone_id: 'framework' },
    { name: 'Industry hot takes',   description: 'Contrarian views on marketing trends',             tone_id: 'hottake' },
  ],
  'Consulting': [
    { name: 'Client transformations', description: 'Real results from client work',                  tone_id: 'clientwin' },
    { name: 'Consulting craft',     description: 'How great consulting actually works',              tone_id: 'educational' },
    { name: 'Founder stories',      description: 'My own journey and decisions',                    tone_id: 'storytelling' },
  ],
  'HR/Talent': [
    { name: 'Hiring insights',      description: 'What great hiring looks like',                     tone_id: 'educational' },
    { name: 'Culture and teams',    description: 'Building high-performance environments',           tone_id: 'framework' },
    { name: 'Career growth',        description: 'Advice for professionals at all levels',           tone_id: 'inspirational' },
  ],
  'Sales': [
    { name: 'Deal breakdowns',      description: 'How I won and lost specific deals',                tone_id: 'behindthescenes' },
    { name: 'Sales frameworks',     description: 'Systems that consistently close',                  tone_id: 'framework' },
    { name: 'Buyer psychology',     description: 'How customers actually make decisions',            tone_id: 'datadriven' },
  ],
  'Founder/Startup': [
    { name: 'Startup reality',      description: 'The unfiltered truth of building',                 tone_id: 'vulnerable' },
    { name: 'Product lessons',      description: 'What building taught me',                          tone_id: 'lessonslearned' },
    { name: 'Team and culture',     description: 'People decisions that shaped the company',         tone_id: 'storytelling' },
  ],
  'Other': [
    { name: 'My expertise',         description: 'Sharing what I know best',                         tone_id: 'educational' },
    { name: 'My journey',           description: 'Stories from my professional path',                tone_id: 'storytelling' },
    { name: 'Industry views',       description: 'My take on what matters right now',                tone_id: 'controversial' },
  ],
}

// ─── Posting Days ─────────────────────────────────────────────────────────────

export const POSTING_DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]

// ─── Format Display ───────────────────────────────────────────────────────────

export const FORMAT_ICONS: Record<string, string> = {
  text:     'T',
  carousel: '▤',
  poll:     '▦',
  question: '?',
}

export const FORMAT_COLORS: Record<string, string> = {
  text:     '#1D9E75',
  carousel: '#534AB7',
  poll:     '#BA7517',
  question: '#185FA5',
}

// ─── Weight Multipliers ───────────────────────────────────────────────────────

export const WEIGHT_MULTIPLIERS: Record<string, number> = {
  high:   3,
  medium: 2,
  low:    1,
}
