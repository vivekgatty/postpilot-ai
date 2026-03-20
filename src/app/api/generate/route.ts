export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateLinkedInPost } from '@/lib/anthropic'
import { PLAN_LIMITS } from '@/lib/constants'
import type { GeneratePostRequest, GeneratedPost } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Check + enforce plan limits ──────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, generations_used_this_month')
      .eq('id', user.id)
      .single()

    if (profile) {
      const limit = PLAN_LIMITS[profile.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free
      if (limit !== -1 && profile.generations_used_this_month >= limit) {
        return NextResponse.json(
          { error: 'Generation limit reached. Upgrade to continue.' },
          { status: 403 }
        )
      }
    }

    // ── Parse request ────────────────────────────────────────────────────────
    const body = await req.json() as GeneratePostRequest
    const { topic, tone, niche, keywords = [], language = 'en', variations = 3 } = body

    if (!topic || !tone) {
      return NextResponse.json({ error: 'Topic and tone are required' }, { status: 400 })
    }

    // ── Generate all variations in parallel ──────────────────────────────────
    const count = Math.min(Math.max(variations, 1), 3)
    const contents = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        generateLinkedInPost(topic, tone, niche, keywords, language, i + 1)
      )
    )

    const posts: GeneratedPost[] = contents.map((content, i) => ({
      variation: i + 1,
      content,
    }))

    // ── Increment usage count ────────────────────────────────────────────────
    if (profile) {
      await supabase
        .from('profiles')
        .update({ generations_used_this_month: profile.generations_used_this_month + 1 })
        .eq('id', user.id)
    }

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Failed to generate posts' }, { status: 500 })
  }
}
