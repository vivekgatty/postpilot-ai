export const SOURCE_PLATFORMS: Record<
  string,
  {
    label: string
    patterns: string[]
    icon: string
    color: string
    description: string
    manual_only?: boolean
  }
> = {
  youtube: {
    label: 'YouTube',
    patterns: ['youtube.com/watch', 'youtu.be/'],
    icon: 'Youtube',
    color: '#FF0000',
    description: 'Video transcript extracted automatically',
  },
  twitter: {
    label: 'Twitter / X',
    patterns: ['twitter.com/', 'x.com/'],
    icon: 'Twitter',
    color: '#000000',
    description: 'Thread content extracted (best effort)',
  },
  substack: {
    label: 'Substack',
    patterns: ['substack.com/'],
    icon: 'Mail',
    color: '#FF6719',
    description: 'Newsletter content extracted automatically',
  },
  medium: {
    label: 'Medium',
    patterns: ['medium.com/'],
    icon: 'FileText',
    color: '#000000',
    description: 'Article content extracted automatically',
  },
  linkedin: {
    label: 'LinkedIn Post',
    patterns: ['linkedin.com/posts/', 'linkedin.com/pulse/'],
    icon: 'Linkedin',
    color: '#0A66C2',
    description: 'Paste the post text manually',
    manual_only: true,
  },
  google_docs: {
    label: 'Google Docs',
    patterns: ['docs.google.com/'],
    icon: 'FileText',
    color: '#4285F4',
    description: 'Document must be set to "Anyone with link"',
  },
  beehiiv: {
    label: 'Beehiiv',
    patterns: ['beehiiv.com/'],
    icon: 'Mail',
    color: '#000000',
    description: 'Newsletter content extracted automatically',
  },
  notion: {
    label: 'Notion',
    patterns: ['notion.so/', 'notion.site/'],
    icon: 'FileText',
    color: '#000000',
    description: 'Page must be set to public',
  },
}

export function detectPlatform(url: string): string {
  const lower = url.toLowerCase()
  for (const [key, config] of Object.entries(SOURCE_PLATFORMS)) {
    if (config.patterns.some(p => lower.includes(p))) {
      return key
    }
  }
  return 'website'
}

export function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com/watch') || url.includes('youtu.be/')
}

export function isLinkedInUrl(url: string): boolean {
  return url.includes('linkedin.com/posts/') || url.includes('linkedin.com/pulse/')
}

export function isGoogleDocsUrl(url: string): boolean {
  return url.includes('docs.google.com/')
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export const REPURPOSE_LIMITS: Record<
  string,
  { sessions_per_day: number; posts_per_session: number; pdf: boolean }
> = {
  free:    { sessions_per_day: 1,  posts_per_session: 5,  pdf: false },
  starter: { sessions_per_day: 5,  posts_per_session: 8,  pdf: true  },
  pro:     { sessions_per_day: -1, posts_per_session: 12, pdf: true  },
  agency:  { sessions_per_day: -1, posts_per_session: 12, pdf: true  },
}

export const GENERIC_ANGLES_FREE = [
  { id: 'key_insight',      title: 'Key insight',        description: 'Share the single most valuable insight from this content', format: 'text'     as const, emotional_hook: 'curiosity'    },
  { id: 'how_to',           title: 'How-to breakdown',   description: 'Turn the main process or method into actionable steps',    format: 'text'     as const, emotional_hook: 'inspiration'  },
  { id: 'lessons_learned',  title: 'Lessons learned',    description: 'Extract the key lessons and present them retrospectively', format: 'text'     as const, emotional_hook: 'validation'   },
  { id: 'hot_take',         title: 'Hot take',           description: 'Take a contrarian angle on the topic',                     format: 'text'     as const, emotional_hook: 'surprise'     },
  { id: 'carousel_summary', title: 'Carousel summary',   description: 'Summarise the key points in carousel slide format',        format: 'carousel' as const, emotional_hook: 'curiosity'    },
]
