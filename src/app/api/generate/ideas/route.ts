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
    const { industry, role, count = 10 } = body

    if (!industry || !role) {
      return NextResponse.json({ error: 'Industry and role are required' }, { status: 400 })
    }

    const ideas = await generatePostIdeas(industry, role, count)

    return NextResponse.json({ ideas })
  } catch (error) {
    console.error('Generate ideas error:', error)
    return NextResponse.json({ error: 'Failed to generate ideas' }, { status: 500 })
  }
}
