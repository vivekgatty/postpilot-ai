export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── DELETE /api/hooks/saved/[id] ──────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    if (!id || typeof id !== 'string')
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { error } = await supabase
      .from('saved_hooks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // RLS also enforces this, but be explicit

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/hooks/saved/[id]]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to delete saved hook' }, { status: 500 })
  }
}
