export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTodayDateString } from '@/lib/streakConfig'
import { resend } from '@/lib/resend'
import type { StreakState } from '@/types'

const FROM     = process.env.FROM_EMAIL        ?? 'PostPika <hello@postpika.com>'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://postpika.com'

// ── GET /api/cron/streak-reminders ────────────────────────────────────────────
// Runs every hour (0 * * * *). Vercel invokes it across the day; the route
// decides whether each user's preferred reminder time has arrived.

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase  = await createClient()
  const todayStr  = getTodayDateString()
  const now       = new Date()
  let   processed = 0

  // Fetch all reminders with email enabled
  const { data: reminders, error: remErr } = await supabase
    .from('streak_reminders')
    .select('*')
    .eq('email_enabled', true)

  if (remErr) {
    console.error('[cron/streak-reminders] fetch error', remErr)
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
  }

  for (const reminder of (reminders ?? [])) {
    try {
      // Resolve current time in user's timezone
      const tz      = (reminder.timezone as string | undefined) ?? 'Asia/Kolkata'
      const parts   = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
      }).formatToParts(now)

      const currentHour    = parseInt(parts.find(p => p.type === 'hour')?.value    ?? '0')
      const currentMin     = parseInt(parts.find(p => p.type === 'minute')?.value  ?? '0')
      const currentMinutes = currentHour * 60 + currentMin

      const reminderStr     = (reminder.reminder_time as string | undefined) ?? '09:00'
      const [remH, remM]    = reminderStr.split(':').map(Number)
      const reminderMinutes = remH * 60 + remM

      // Skip if not within 30-minute window
      if (Math.abs(currentMinutes - reminderMinutes) > 30) continue

      // Skip if already sent today
      const sentAtRaw = reminder.last_reminder_sent_at as string | undefined | null
      if (sentAtRaw && new Date(sentAtRaw).toISOString().split('T')[0] === todayStr) continue

      // Fetch streak state
      const { data: stateData } = await supabase
        .from('streak_states')
        .select('*')
        .eq('user_id', reminder.user_id)
        .maybeSingle()
      if (!stateData) continue

      const state = stateData as StreakState
      if (state.publish_streak <= 0)          continue // no active streak to protect
      if (state.publish_last_date === todayStr) continue // already posted today

      // Fetch profile for email address
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', reminder.user_id)
        .single()
      if (!profile?.email) continue

      const streak = state.publish_streak
      const name   = (profile.full_name as string | null) ?? 'there'

      await resend.emails.send({
        from:    FROM,
        to:      profile.email as string,
        subject: `Your ${streak}-day streak is at risk 🔥`,
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
              Hi ${name} 🔥
            </h1>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
              Your <strong>${streak}-day publishing streak</strong> is at risk of ending today.
              Post on LinkedIn now to keep your streak alive!
            </p>
            <div style="text-align:center;margin:0 0 32px;padding:24px;
                        background:#FEF3C7;border-radius:12px;">
              <p style="margin:0;font-size:56px;line-height:1;">🔥</p>
              <p style="margin:8px 0 0;font-size:36px;font-weight:800;color:#1D9E75;">
                ${streak} days
              </p>
              <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">current streak</p>
            </div>
            <p style="text-align:center;margin:0;">
              <a href="${BASE_URL}/dashboard/streak"
                 style="display:inline-block;background-color:#1D9E75;color:#ffffff;
                        text-decoration:none;font-size:15px;font-weight:700;
                        padding:14px 28px;border-radius:10px;">
                Keep my streak alive →
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

      // Mark reminder sent
      await supabase
        .from('streak_reminders')
        .update({ last_reminder_sent_at: now.toISOString() })
        .eq('user_id', reminder.user_id)

      processed++
    } catch (err) {
      console.error('[cron/streak-reminders] error for user', reminder.user_id, err)
    }
  }

  return NextResponse.json({ processed })
}
