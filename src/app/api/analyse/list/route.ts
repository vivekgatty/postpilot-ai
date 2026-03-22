export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/analyse/list ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '30', 10), 100)
    const source = searchParams.get('source')

    let query = supabase
      .from('post_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (source) {
      query = query.eq('source', source)
    }

    const { data: analyses, error } = await query

    if (error) throw error

    return NextResponse.json({ analyses: analyses ?? [] })
  } catch (err) {
    console.error('[GET /api/analyse/list]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
  }
}
