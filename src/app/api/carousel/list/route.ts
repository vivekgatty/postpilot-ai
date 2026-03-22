export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/carousel/list ────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('carousels')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json({ carousels: data ?? [] })
  } catch (err) {
    console.error('[GET /api/carousel/list]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to fetch carousels' }, { status: 500 })
  }
}
