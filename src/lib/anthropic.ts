import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const AI_MODEL = 'claude-haiku-4-5-20251001'

export async function generateLinkedInPost(
  topic: string,
  tone: string,
  keywords: string[] = [],
  language = 'en'
): Promise<string> {
  const langInstruction =
    language === 'hi'
      ? 'Write entirely in Hindi (Devanagari script).'
      : language === 'hinglish'
        ? 'Write in Hinglish (mix of Hindi and English, using Roman script for Hindi words).'
        : 'Write in English.'

  const keywordsInstruction =
    keywords.length > 0
      ? `Include these keywords naturally: ${keywords.join(', ')}.`
      : ''

  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a LinkedIn content expert for Indian professionals. Write a compelling LinkedIn post.

Topic: ${topic}
Tone: ${tone}
${langInstruction}
${keywordsInstruction}

Requirements:
- 150-300 words optimal length
- Use line breaks for readability
- Add 3-5 relevant hashtags at the end
- Make it authentic and engaging for the Indian professional audience
- Do not use generic corporate speak

Write only the post content, nothing else.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return content.text
}

export async function generatePostIdeas(
  industry: string,
  role: string,
  count = 10
): Promise<string[]> {
  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Generate ${count} LinkedIn post ideas for an Indian professional.

Industry: ${industry}
Role: ${role}

Requirements:
- Each idea should be specific and actionable
- Mix personal stories, industry insights, tips, and thought leadership
- Relevant to the Indian market and professional context
- Return ONLY a JSON array of strings, no other text

Example format: ["Idea 1", "Idea 2", ...]`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  try {
    return JSON.parse(content.text) as string[]
  } catch {
    return content.text
      .split('\n')
      .filter(Boolean)
      .slice(0, count)
  }
}
