export const dynamic = 'force-dynamic'

import { NextResponse }            from 'next/server'
import { createClient }            from '@/lib/supabase/server'
import { createClient as adminClient } from '@supabase/supabase-js'

// ── DELETE /api/user/delete ────────────────────────────────────────────────────
// Deletes the authenticated user's account entirely.
// Order: cancel subscription → delete profile rows → delete auth user.

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Sign out first so the cookie is cleared before we delete the auth record
    await supabase.auth.signOut()

    // 2. Use service-role client to hard-delete the auth user
    //    (anon/user-scoped client cannot delete its own auth.users row)
    const admin = adminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id)
    if (deleteErr) throw deleteErr

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/user/delete]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
