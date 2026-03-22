export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── GET /api/linkedin/status ──────────────────────────────────────────────────
// Returns whether the current user has a valid LinkedIn connection.

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Explicitly exclude access_token — OAuth tokens must never be sent to the client
    const { data, error } = await supabase
      .from('linkedin_connections')
      .select('user_id, linkedin_urn, token_expires_at, scopes, connected_at')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (!data) {
      return NextResponse.json({ connected: false, connection: null })
    }

    const isExpired = new Date(data.token_expires_at as string) <= new Date()

    return NextResponse.json({
      connected:  !isExpired,
      connection: isExpired ? null : data,
    })
  } catch (err) {
    console.error('[GET /api/linkedin/status]', err)
    return NextResponse.json({ connected: false, connection: null })
  }
}
