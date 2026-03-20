import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM = process.env.FROM_EMAIL ?? 'PostPika <hello@postpika.com>'

// ── Email layout helper ───────────────────────────────────────────────────────
// All emails share this structure: green header → white card body → grey footer.
// Every style is inlined so the emails render correctly in Gmail.

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PostPika</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f3;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#f5f5f3;padding:48px 0;">
    <tr>
      <td align="center">
        <!-- Card container -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="width:600px;max-width:100%;background-color:#ffffff;border-radius:16px;
                      overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
          <!-- Green header strip -->
          <tr>
            <td style="background-color:#1D9E75;padding:28px 40px;text-align:center;">
              <span style="font-size:26px;font-weight:800;color:#ffffff;
                           letter-spacing:-0.5px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                PostPika
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9f9f7;border-top:1px solid #eeeeec;
                       padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                PostPika · Helping Indian professionals build their LinkedIn presence<br />
                <a href="https://postpika.com" style="color:#1D9E75;text-decoration:none;">postpika.com</a>
                &nbsp;·&nbsp;
                <a href="https://postpika.com/unsubscribe" style="color:#9ca3af;text-decoration:none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Shared text styles ────────────────────────────────────────────────────────

const H1  = 'margin:0 0 16px;font-size:24px;font-weight:700;color:#0A2540;line-height:1.3;'
const P   = 'margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;'
const BTN = 'display:inline-block;background-color:#1D9E75;color:#ffffff;text-decoration:none;' +
            'font-size:15px;font-weight:700;padding:14px 28px;border-radius:10px;'

// ── 1. Welcome email ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  try {
    await resend.emails.send({
      from:    FROM,
      to,
      subject: `Welcome to PostPika, ${name}!`,
      html: layout(`
        <h1 style="${H1}">Welcome, ${name}! 🎉</h1>
        <p style="${P}">
          You've just joined thousands of Indian professionals who create compelling LinkedIn
          content with PostPika. Here's what you can do right now:
        </p>

        <!-- Feature list -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="margin:0 0 28px;">
          ${featureRow('✦', 'Generate Posts',
              'Paste a topic, pick a tone — get 3 scroll-stopping variations in seconds.',
              '#1D9E75')}
          ${featureRow('✦', 'Content Calendar',
              'Schedule your posts visually. Never miss the right moment to publish.',
              '#6366f1')}
          ${featureRow('✦', 'Idea Lab',
              'Stuck? Get AI-generated post ideas tailored to your niche.',
              '#f59e0b')}
        </table>

        <p style="margin:0 0 28px;">
          <a href="https://postpika.com/dashboard/generate" style="${BTN}">
            Generate your first post →
          </a>
        </p>

        <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
          You're on the <strong>Free plan</strong> — 5 generations per month.
          <a href="https://postpika.com/dashboard/settings" style="color:#1D9E75;">
            Upgrade any time
          </a> for unlimited posts.
        </p>
      `),
    })
  } catch (err) {
    console.error('[sendWelcomeEmail]', err instanceof Error ? err.message : err)
  }
}

function featureRow(icon: string, title: string, desc: string, color: string): string {
  return `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td width="40" style="vertical-align:top;padding-top:2px;">
            <span style="display:inline-block;width:28px;height:28px;border-radius:8px;
                         background-color:${color}1a;text-align:center;line-height:28px;
                         font-size:14px;color:${color};">${icon}</span>
          </td>
          <td style="vertical-align:top;padding-left:12px;">
            <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#0A2540;">${title}</p>
            <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">${desc}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

// ── 2. Payment confirmation email ─────────────────────────────────────────────

export async function sendPaymentConfirmationEmail(
  to:              string,
  name:            string,
  plan:            string,
  amountInr:       number,
  nextBillingDate: string,
): Promise<void> {
  try {
    const formattedDate   = new Date(nextBillingDate).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    const formattedAmount = amountInr.toLocaleString('en-IN')

    await resend.emails.send({
      from:    FROM,
      to,
      subject: `You're on PostPika ${plan} — your receipt`,
      html: layout(`
        <h1 style="${H1}">Payment confirmed ✓</h1>
        <p style="${P}">Hi ${name}, your PostPika <strong>${plan}</strong> subscription is now active.</p>

        <!-- Receipt box -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;
                      margin:0 0 24px;overflow:hidden;">
          ${receiptRow('Plan',            plan)}
          ${receiptRow('Amount paid',     `₹${formattedAmount}`)}
          ${receiptRow('Next billing',    formattedDate)}
          ${receiptRow('Status',          '✓ Active', '#1D9E75')}
        </table>

        <p style="${P}">
          Your subscription will auto-renew on <strong>${formattedDate}</strong>.
          You can manage or cancel anytime from
          <a href="https://postpika.com/dashboard/settings" style="color:#1D9E75;">
            Account Settings
          </a>.
        </p>

        <p style="margin:0 0 24px;font-size:13px;color:#6b7280;line-height:1.6;
                  padding:12px 16px;background:#fffbeb;border-radius:8px;border-left:3px solid #f59e0b;">
          <strong>GST invoice note:</strong> A tax invoice will be emailed to you separately
          within 3 business days. Please ensure your GST details are up to date in Account Settings.
        </p>

        <p style="margin:0;">
          <a href="https://postpika.com/dashboard/generate" style="${BTN}">
            Start generating posts →
          </a>
        </p>
      `),
    })
  } catch (err) {
    console.error('[sendPaymentConfirmationEmail]', err instanceof Error ? err.message : err)
  }
}

function receiptRow(label: string, value: string, valueColor?: string): string {
  return `
  <tr>
    <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:13px;
               color:#6b7280;width:140px;">${label}</td>
    <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;
               font-weight:600;color:${valueColor ?? '#0A2540'};">${value}</td>
  </tr>`
}

// ── 3. Usage limit email ──────────────────────────────────────────────────────

export async function sendUsageLimitEmail(
  to:    string,
  name:  string,
  limit: number,
): Promise<void> {
  try {
    await resend.emails.send({
      from:    FROM,
      to,
      subject: `You've used all ${limit} free generations this month`,
      html: layout(`
        <h1 style="${H1}">You've hit your monthly limit</h1>
        <p style="${P}">
          Hi ${name}, you've used all <strong>${limit} free generations</strong> for this month.
          Your counter resets on the 1st of next month — but why wait?
        </p>

        <!-- Usage bar -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="margin:0 0 28px;">
          <tr>
            <td style="font-size:13px;color:#6b7280;padding-bottom:6px;">
              ${limit} of ${limit} generations used
            </td>
          </tr>
          <tr>
            <td style="background:#f3f4f6;border-radius:99px;height:8px;overflow:hidden;">
              <div style="width:100%;height:8px;background:#ef4444;border-radius:99px;"></div>
            </td>
          </tr>
        </table>

        <p style="${P}">
          Upgrade to a paid plan and unlock:
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="margin:0 0 28px;">
          ${upgradeRow('∞', 'Unlimited post generations every month')}
          ${upgradeRow('🗓', 'Full content calendar with scheduling')}
          ${upgradeRow('💡', 'Unlimited AI idea generation')}
          ${upgradeRow('⚡', 'Priority generation speed')}
        </table>

        <p style="margin:0 0 16px;">
          <a href="https://postpika.com/dashboard/settings" style="${BTN}">
            Upgrade for unlimited →
          </a>
        </p>

        <p style="margin:0;font-size:12px;color:#9ca3af;">
          Plans start at ₹799/month. Cancel anytime.
        </p>
      `),
    })
  } catch (err) {
    console.error('[sendUsageLimitEmail]', err instanceof Error ? err.message : err)
  }
}

function upgradeRow(icon: string, text: string): string {
  return `
  <tr>
    <td style="padding:6px 0;font-size:14px;color:#374151;line-height:1.5;">
      <span style="margin-right:10px;font-size:16px;">${icon}</span>${text}
    </td>
  </tr>`
}

// ── 4. Payment failed email ───────────────────────────────────────────────────

export async function sendPaymentFailedEmail(to: string, name: string): Promise<void> {
  try {
    await resend.emails.send({
      from:    FROM,
      to,
      subject: 'PostPika payment failed — action needed',
      html: layout(`
        <h1 style="${H1}">Payment failed ⚠</h1>
        <p style="${P}">
          Hi ${name}, we weren't able to process your most recent PostPika subscription payment.
          This can happen due to an expired card, insufficient funds, or a bank block.
        </p>

        <!-- Alert box -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;
                      margin:0 0 24px;overflow:hidden;">
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#dc2626;">
                ⚠ Your subscription is at risk of being paused
              </p>
              <p style="margin:6px 0 0;font-size:13px;color:#7f1d1d;line-height:1.5;">
                We'll retry the payment automatically. If the retry also fails, your account
                will move to the Free plan until payment is resolved.
              </p>
            </td>
          </tr>
        </table>

        <p style="${P}">
          To avoid any interruption, please update your payment method now:
        </p>

        <p style="margin:0 0 24px;">
          <a href="https://postpika.com/dashboard/settings" style="${BTN}">
            Update payment method →
          </a>
        </p>

        <p style="${P}">
          Need help? Reply to this email or reach us at
          <a href="mailto:support@postpika.com" style="color:#1D9E75;">support@postpika.com</a>.
          We're happy to sort this out quickly.
        </p>

        <p style="margin:0;font-size:12px;color:#9ca3af;">
          If you believe this is an error, please contact your bank or
          <a href="mailto:support@postpika.com" style="color:#9ca3af;">support@postpika.com</a>.
        </p>
      `),
    })
  } catch (err) {
    console.error('[sendPaymentFailedEmail]', err instanceof Error ? err.message : err)
  }
}
