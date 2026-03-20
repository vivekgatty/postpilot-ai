export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES  = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const BUCKET         = 'avatars'

// ── POST /api/user/avatar ──────────────────────────────────────────────────────
// Accepts multipart/form-data with a 'file' field.
// Uploads to the Supabase 'avatars' bucket and updates profiles.avatar_url.

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file     = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, WebP, or GIF allowed' }, { status: 400 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large — max 2 MB' }, { status: 400 })
    }

    const ext      = file.name.split('.').pop() ?? 'jpg'
    const path     = `${user.id}/avatar.${ext}`
    const buffer   = Buffer.from(await file.arrayBuffer())

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert:      true,
      })

    if (uploadErr) throw uploadErr

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path)

    // Append cache-busting query so the browser re-fetches after replace
    const avatarUrl = `${publicUrl}?t=${Date.now()}`

    await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    return NextResponse.json({ avatarUrl })
  } catch (err) {
    console.error('[POST /api/user/avatar]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
