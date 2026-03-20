import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePostIdeas } from '@/lib/anthropic'
import type { GenerateIdeasRequest } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json() as GenerateIdeasRequest
    const { niche, count = 10 } = body

    if (!niche) {
      return NextResponse.json({ error: 'Niche is required' }, { status: 400 })
    }

    // Pass niche as both industry and role context for the LLM
    const ideas = await generatePostIdeas(niche, niche, count)

    return NextResponse.json({ ideas })
  } catch (error) {
    console.error('Generate ideas error:', error)
    return NextResponse.json({ error: 'Failed to generate ideas' }, { status: 500 })
  }
}
