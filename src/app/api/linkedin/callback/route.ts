export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// ── GET /api/linkedin/callback ────────────────────────────────────────────────
// Handles OAuth callback from LinkedIn after user grants posting permissions.

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`)
    }

    const { searchParams } = req.nextUrl
    const code  = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('[linkedin/callback] OAuth error:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/planner?linkedin_error=${error}`,
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/planner?linkedin_error=no_code`,
      )
    }

    // Validate CSRF state
    const cookieStore = await cookies()
    const storedState = cookieStore.get('li_oauth_state')?.value
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/planner?linkedin_error=state_mismatch`,
      )
    }

    // Clear state cookie
    cookieStore.delete('li_oauth_state')

    // Exchange code for access token
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin/callback`

    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  redirectUri,
        client_id:     process.env.LINKEDIN_CLIENT_ID     ?? '',
        client_secret: process.env.LINKEDIN_CLIENT_SECRET ?? '',
      }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error('[linkedin/callback] Token exchange failed:', errText)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/planner?linkedin_error=token_exchange_failed`,
      )
    }

    const tokenData = await tokenRes.json() as {
      access_token: string
      expires_in:   number
    }

    const { access_token, expires_in } = tokenData
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    // Fetch LinkedIn URN from userinfo endpoint
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!profileRes.ok) {
      console.error('[linkedin/callback] Profile fetch failed')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/planner?linkedin_error=profile_fetch_failed`,
      )
    }

    const profileData = await profileRes.json() as { sub: string }
    const linkedinUrn = profileData.sub  // Just the ID portion

    // Upsert into linkedin_connections
    const { error: upsertErr } = await supabase
      .from('linkedin_connections')
      .upsert(
        {
          user_id:          user.id,
          linkedin_urn:     linkedinUrn,
          access_token,
          token_expires_at: tokenExpiresAt,
          scopes:           ['w_member_social', 'openid', 'profile', 'email'],
          connected_at:     new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )

    if (upsertErr) {
      console.error('[linkedin/callback] Upsert failed:', upsertErr)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/planner?linkedin_error=save_failed`,
      )
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/planner?linkedin_connected=true`,
    )
  } catch (err) {
    console.error('[GET /api/linkedin/callback]', err)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/planner?linkedin_error=server_error`,
    )
  }
}
