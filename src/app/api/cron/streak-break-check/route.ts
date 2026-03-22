export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTodayDateString } from '@/lib/streakConfig'
import { resend } from '@/lib/resend'
import type { StreakState } from '@/types'

const FROM     = process.env.FROM_EMAIL         ?? 'PostPika <hello@postpika.com>'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://postpika.com'

// ── GET /api/cron/streak-break-check ─────────────────────────────────────────
// Runs daily at 18:30 UTC (= midnight IST).
// Finds streaks that have broken and sends a notification email.

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase  = await createClient()
  const todayStr  = getTodayDateString()
  const today     = new Date()
  today.setHours(0, 0, 0, 0)

  let processed = 0

  // Fetch all streak states where publish_streak > 0
  const { data: states, error: statesErr } = await supabase
    .from('streak_states')
    .select('*')
    .gt('publish_streak', 0)

  if (statesErr) {
    console.error('[cron/streak-break-check] fetch error', statesErr)
    return NextResponse.json({ error: 'Failed to fetch states' }, { status: 500 })
  }

  for (const stateRow of (states ?? [])) {
    try {
      const state = stateRow as StreakState

      if (!state.publish_last_date) continue

      const lastDate = new Date(state.publish_last_date)
      lastDate.setHours(0, 0, 0, 0)
      const diffDays = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      )

      // Streak still alive (0 or 1 day gap)
      if (diffDays < 2) continue

      // Streak has broken — reset publish_streak to 0
      await supabase
        .from('streak_states')
        .update({ publish_streak: 0 })
        .eq('user_id', state.user_id)

      // Fetch reminder settings
      const { data: reminder } = await supabase
        .from('streak_reminders')
        .select('*')
        .eq('user_id', state.user_id)
        .maybeSingle()

      if (!reminder?.email_enabled) continue

      // Skip if break notification already sent today
      const notifiedAtRaw = reminder.streak_break_notified_at as string | undefined | null
      if (notifiedAtRaw && new Date(notifiedAtRaw).toISOString().split('T')[0] === todayStr) {
        continue
      }

      // Fetch profile for email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', state.user_id)
        .single()
      if (!profile?.email) continue

      const n    = state.publish_streak
      const name = (profile.full_name as string | null) ?? 'there'

      await resend.emails.send({
        from:    FROM,
        to:      profile.email as string,
        subject: `Your ${n}-day streak ended 😔`,
        html: `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background-color:#f5f5f3;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background-color:#f5f5f3;padding:48px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background-color:#ffffff;border-radius:16px;overflow:hidden;
                    box-shadow:0 4px 24px rgba(0,0,0,0.07);">
        <tr>
          <td style="background-color:#1D9E75;padding:28px 40px;text-align:center;">
            <span style="font-size:26px;font-weight:800;color:#ffffff;">PostPika</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0A2540;">
              Hi ${name},
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
              Your ${n}-day publishing streak has ended. But today is a new day —
              restart your streak now.
            </p>
            <p style="text-align:center;margin:0 0 16px;font-size:48px;">😔</p>
            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;text-align:center;">
              Your streak was
            </p>
            <p style="margin:0 0 32px;text-align:center;font-size:32px;
                      font-weight:800;color:#1D9E75;">
              ${n} days
            </p>
            <p style="text-align:center;margin:0;">
              <a href="${BASE_URL}/dashboard/streak"
                 style="display:inline-block;background-color:#1D9E75;color:#ffffff;
                        text-decoration:none;font-size:15px;font-weight:700;
                        padding:14px 28px;border-radius:10px;">
                Restart my streak →
              </a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f9f9f7;border-top:1px solid #eeeeec;
                     padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              <a href="${BASE_URL}/unsubscribe"
                 style="color:#9ca3af;text-decoration:none;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      })

      // Update streak_break_notified_at in streak_reminders
      await supabase
        .from('streak_reminders')
        .update({ streak_break_notified_at: new Date().toISOString() })
        .eq('user_id', state.user_id)

      processed++
    } catch (err) {
      console.error('[cron/streak-break-check] error for user', stateRow.user_id, err)
    }
  }

  return NextResponse.json({ processed })
}
