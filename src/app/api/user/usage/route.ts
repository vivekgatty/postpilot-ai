import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { USAGE_LIMITS } from '@/lib/constants'
import type { UsageStats } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = (profile?.role as string) ?? 'free'
    const limits = USAGE_LIMITS[role] ?? USAGE_LIMITS.free

    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', periodStart)

    const { count: ideasCount } = await supabase
      .from('ideas')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', periodStart)

    const stats: UsageStats = {
      posts_generated: postsCount ?? 0,
      posts_limit: limits.posts,
      ideas_generated: ideasCount ?? 0,
      ideas_limit: limits.ideas,
      period_start: periodStart,
      period_end: periodEnd,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('GET /api/user/usage error:', error)
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 })
  }
}
