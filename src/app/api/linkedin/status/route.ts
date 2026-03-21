export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LinkedInConnection } from '@/types'

// ── GET /api/linkedin/status ──────────────────────────────────────────────────
// Returns whether the current user has a valid LinkedIn connection.

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('linkedin_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (!data) {
      return NextResponse.json({ connected: false, connection: null })
    }

    const connection = data as LinkedInConnection
    const isExpired  = new Date(connection.token_expires_at) <= new Date()

    return NextResponse.json({
      connected:  !isExpired,
      connection: isExpired ? null : connection,
    })
  } catch (err) {
    console.error('[GET /api/linkedin/status]', err)
    return NextResponse.json({ connected: false, connection: null })
  }
}
