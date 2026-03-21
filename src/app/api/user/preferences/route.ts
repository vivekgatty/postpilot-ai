export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_PREFS = {
  favourite_tones:   [] as string[],
  favourite_formats: [] as string[],
  default_tone:      'professional',
  default_format:    'listicle',
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: prefs } = await supabase
      .from('user_content_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({ preferences: prefs ?? { user_id: user.id, ...DEFAULT_PREFS } })
  } catch (err) {
    console.error('[GET /api/user/preferences]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: {
      favourite_tones?: unknown
      favourite_formats?: unknown
      default_tone?: unknown
      default_format?: unknown
    }
    try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const updates: Record<string, unknown> = {
      user_id:    user.id,
      updated_at: new Date().toISOString(),
    }
    if (Array.isArray(body.favourite_tones))   updates.favourite_tones   = body.favourite_tones
    if (Array.isArray(body.favourite_formats)) updates.favourite_formats = body.favourite_formats
    if (typeof body.default_tone === 'string') updates.default_tone      = body.default_tone
    if (typeof body.default_format === 'string') updates.default_format  = body.default_format

    const { data: prefs, error } = await supabase
      .from('user_content_preferences')
      .upsert(updates, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ preferences: prefs })
  } catch (err) {
    console.error('[PATCH /api/user/preferences]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
