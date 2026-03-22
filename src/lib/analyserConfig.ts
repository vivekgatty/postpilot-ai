export const ANALYSIS_DIMENSIONS = {
  hook: {
    id: 'hook',
    label: 'Hook Strength',
    max_score: 20,
    weight: 20,
    icon: 'Zap',
    color: '#E24B4A',
    description: 'How well your opening line stops the scroll',
  },
  readability: {
    id: 'readability',
    label: 'Readability and Format',
    max_score: 15,
    weight: 15,
    icon: 'AlignLeft',
    color: '#534AB7',
    description: 'How scannable and visually clean your post is',
  },
  value: {
    id: 'value',
    label: 'Value Delivery',
    max_score: 15,
    weight: 15,
    icon: 'Lightbulb',
    color: '#BA7517',
    description: 'Whether your post teaches, inspires, or provokes',
  },
  cta: {
    id: 'cta',
    label: 'Call to Action',
    max_score: 10,
    weight: 10,
    icon: 'MessageSquare',
    color: '#185FA5',
    description: 'How well your post drives comments and engagement',
  },
  authenticity: {
    id: 'authenticity',
    label: 'Authenticity and Voice',
    max_score: 10,
    weight: 10,
    icon: 'Heart',
    color: '#993556',
    description: 'Whether your post sounds genuinely human',
  },
  specificity: {
    id: 'specificity',
    label: 'Specificity and Credibility',
    max_score: 10,
    weight: 10,
    icon: 'Target',
    color: '#0F6E56',
    description: 'How concrete and believable your claims are',
  },
  emotion: {
    id: 'emotion',
    label: 'Emotional Resonance',
    max_score: 8,
    weight: 8,
    icon: 'Smile',
    color: '#D85A30',
    description: 'Whether your post creates an emotional response',
  },
  algorithm: {
    id: 'algorithm',
    label: 'Algorithm Signals',
    max_score: 7,
    weight: 7,
    icon: 'TrendingUp',
    color: '#1D9E75',
    description: 'Technical signals LinkedIn rewards with reach',
  },
  relevance: {
    id: 'relevance',
    label: 'Topic Relevance',
    max_score: 3,
    weight: 3,
    icon: 'Crosshair',
    color: '#888780',
    description: 'Whether your post stays focused on one topic',
  },
  timing: {
    id: 'timing',
    label: 'Timing Advice',
    max_score: 2,
    weight: 2,
    icon: 'Clock',
    color: '#5F5E5A',
    description: 'Best day and time to publish this post',
  },
}

export const SCORE_GRADES = [
  { min: 90, max: 100, grade: 'A+', label: 'Exceptional',  color: '#1D9E75', description: 'Ready to publish — high viral potential' },
  { min: 80, max: 89,  grade: 'A',  label: 'Strong',       color: '#0F6E56', description: 'Will perform well — minor polish possible' },
  { min: 70, max: 79,  grade: 'B',  label: 'Good',         color: '#185FA5', description: 'Solid post with 1-2 fixable weaknesses' },
  { min: 60, max: 69,  grade: 'C',  label: 'Average',      color: '#BA7517', description: 'Will get some engagement but underperforming' },
  { min: 50, max: 59,  grade: 'D',  label: 'Weak',         color: '#D85A30', description: 'Significant issues holding this post back' },
  { min: 0,  max: 49,  grade: 'F',  label: 'Do not post',  color: '#E24B4A', description: 'Needs substantial revision before publishing' },
]

export const DIMENSION_GRADE_THRESHOLDS = {
  excellent: 85,
  strong: 70,
  average: 50,
  weak: 30,
}

export const ANALYSER_LIMITS = {
  free:    { per_day: 3,  all_dimensions: false, radar: false, history: false, reanalyse: false, bulk: false, suggestions_count: 1 },
  starter: { per_day: 15, all_dimensions: true,  radar: true,  history: true,  reanalyse: true,  bulk: false, suggestions_count: 10 },
  pro:     { per_day: -1, all_dimensions: true,  radar: true,  history: true,  reanalyse: true,  bulk: true,  suggestions_count: 10 },
  agency:  { per_day: -1, all_dimensions: true,  radar: true,  history: true,  reanalyse: true,  bulk: true,  suggestions_count: 10 },
}

export const WEAK_OPENER_PATTERNS = [
  /^i (am|was|have|had|just|recently|want|wanted|feel|felt|think|thought|believe|believed|know|knew|got|get|made|make|did|do|went|go|saw|see|heard|hear|learned|learn|found|find|decided|decide|started|start|began|begin|tried|try|used|use|worked|work|built|build|created|create|launched|launch|joined|join|left|leave|moved|move|spent|spend|took|take|ran|run|grew|grow|sold|sell|bought|buy|wrote|write|read|remembered|remember|realized|realise|noticed|notice|understood|understand|thought|think|felt|feel)/i,
  /^(excited|thrilled|honoured|honored|humbled|grateful|proud|happy|delighted|pleased) (to|that|about)/i,
  /^after (years|months|weeks|days|working|spending|building|creating|launching|joining|leaving)/i,
  /^(today|this week|this month|this year|recently|just|finally),? i/i,
  /^in today'?s (fast-paced|rapidly changing|ever-changing|competitive|digital|modern)/i,
  /^as (a|an) (leader|professional|founder|entrepreneur|manager|expert|consultant)/i,
]

export const CORPORATE_FILLER_PATTERNS = [
  'leveraging synergies',
  'moving the needle',
  'low-hanging fruit',
  'think outside the box',
  'at the end of the day',
  'game changer',
  'game-changer',
  'paradigm shift',
  'circle back',
  'deep dive',
  'bandwidth',
  'in the weeds',
  'boil the ocean',
  'taking it offline',
  'i am passionate about',
  'i am excited to share',
  'thrilled to announce',
  'honoured and humbled',
  'in today\'s fast-paced world',
  'the future is bright',
  'this is a game changer',
]

export function getGradeFromScore(score: number) {
  return SCORE_GRADES.find(g => score >= g.min && score <= g.max)
    ?? SCORE_GRADES[SCORE_GRADES.length - 1]
}

export function getDimensionGrade(
  percentage: number
): 'excellent' | 'strong' | 'average' | 'weak' | 'poor' {
  if (percentage >= 85) return 'excellent'
  if (percentage >= 70) return 'strong'
  if (percentage >= 50) return 'average'
  if (percentage >= 30) return 'weak'
  return 'poor'
}

export const TIMING_BY_TYPE = {
  text: { day: 'Tuesday or Thursday', time: '7:30am – 9:00am', reason: 'Text posts perform best early morning when professionals check LinkedIn before work.' },
  carousel: { day: 'Tuesday or Wednesday', time: '8:00am – 10:00am', reason: 'Carousels get more swipes during morning browsing sessions.' },
  poll: { day: 'Monday', time: '9:00am – 11:00am', reason: 'Polls get highest participation at the start of the work week.' },
  question: { day: 'Wednesday', time: '12:00pm – 1:00pm', reason: 'Question posts get more responses during lunch hour browsing.' },
}
