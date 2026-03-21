export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLinkedInAuthUrl } from '@/lib/linkedinPosting'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

// ── GET /api/linkedin/connect ─────────────────────────────────────────────────
// Redirects user to LinkedIn OAuth for w_member_social scope.

export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate CSRF state
    const state = randomBytes(16).toString('hex')

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/callback`
    const authUrl     = getLinkedInAuthUrl(redirectUri, state)

    // Store state in cookie for CSRF validation
    const cookieStore = await cookies()
    cookieStore.set('li_oauth_state', state, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      maxAge:   600, // 10 minutes
      path:     '/',
      sameSite: 'lax',
    })

    return NextResponse.redirect(authUrl)
  } catch (err) {
    console.error('[GET /api/linkedin/connect]', err)
    return NextResponse.json({ error: 'Failed to initiate LinkedIn auth' }, { status: 500 })
  }
}
