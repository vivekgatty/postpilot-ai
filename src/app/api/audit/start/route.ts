export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

function extractLinkedInUsername(url: string): string | null {
  const match = url.match(/linkedin\.com\/in\/([^/?#\s]+)/i)
  return match ? match[1].replace(/\/$/, '') : null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      linkedin_url?: string
      full_name?: string
      profile_photo_url?: string
    }

    const { linkedin_url, full_name, profile_photo_url } = body

    // Validate LinkedIn URL
    if (!linkedin_url || !linkedin_url.toLowerCase().includes('linkedin.com/in/')) {
      return NextResponse.json(
        { error: 'Please enter a valid LinkedIn profile URL (e.g. linkedin.com/in/yourname)' },
        { status: 400 },
      )
    }

    const username = extractLinkedInUsername(linkedin_url)
    if (!username) {
      return NextResponse.json(
        { error: 'Could not extract LinkedIn username from the URL provided.' },
        { status: 400 },
      )
    }

    const normalised = linkedin_url.toLowerCase().trim()

    const supabase = await createClient()

    // Check for existing unlocked audit for this URL
    const { data: existing } = await supabase
      .from('brand_audits')
      .select('id')
      .eq('linkedin_url', normalised)
      .eq('is_unlocked', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ exists: true, auditId: existing.id })
    }

    // Generate a unique share token
    const shareToken = randomBytes(20).toString('hex')

    // Insert new brand_audit row
    const { data: newAudit, error: insertErr } = await supabase
      .from('brand_audits')
      .insert({
        linkedin_url:       normalised,
        linkedin_username:  username,
        full_name:          full_name ?? null,
        profile_photo_url:  profile_photo_url ?? null,
        answers:            {},
        total_score:        0,
        is_unlocked:        false,
        share_token:        shareToken,
      })
      .select('id')
      .single()

    if (insertErr || !newAudit) {
      console.error('[audit/start]', insertErr)
      return NextResponse.json({ error: 'Failed to create audit session.' }, { status: 500 })
    }

    return NextResponse.json({ auditId: newAudit.id })
  } catch (err) {
    console.error('[audit/start]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
