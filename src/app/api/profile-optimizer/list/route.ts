export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/profile-optimizer/list ──────────────────────────────────────────

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: audits, error } = await supabase
      .from('profile_audits')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Fetch history for each audit
    const auditIds = (audits ?? []).map((a: { id: string }) => a.id)
    let historyMap: Record<string, unknown[]> = {}

    if (auditIds.length > 0) {
      const { data: historyRows } = await supabase
        .from('profile_audit_history')
        .select('*')
        .in('audit_id', auditIds)
        .order('scored_at', { ascending: false })

      for (const row of historyRows ?? []) {
        const r = row as { audit_id: string }
        if (!historyMap[r.audit_id]) historyMap[r.audit_id] = []
        historyMap[r.audit_id].push(row)
      }
    }

    const enriched = (audits ?? []).map((a: { id: string }) => ({
      ...a,
      history: historyMap[a.id] ?? [],
    }))

    return NextResponse.json({ audits: enriched })
  } catch (err) {
    console.error('[GET /api/profile-optimizer/list]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to fetch audits' }, { status: 500 })
  }
}
