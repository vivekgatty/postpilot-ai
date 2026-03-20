export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateLinkedInPost } from '@/lib/anthropic'
import type { GeneratePostRequest } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json() as GeneratePostRequest
    const { topic, tone, keywords = [], language = 'en' } = body

    if (!topic || !tone) {
      return NextResponse.json({ error: 'Topic and tone are required' }, { status: 400 })
    }

    const content = await generateLinkedInPost(topic, tone, keywords, language)

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Failed to generate post' }, { status: 500 })
  }
}
