import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: 'PostPika <hello@postpika.com>',
    to,
    subject: 'Welcome to PostPika!',
    html: `<p>Hi ${name},</p><p>Welcome to PostPika — your LinkedIn content AI built for Indian professionals!</p><p>Start generating posts at <a href="https://postpika.com/generate">postpika.com/generate</a></p>`,
  })
}

export async function sendSubscriptionConfirmationEmail(
  to: string,
  name: string,
  plan: string
) {
  return resend.emails.send({
    from: 'PostPika <hello@postpika.com>',
    to,
    subject: `You're now on the ${plan} plan!`,
    html: `<p>Hi ${name},</p><p>Your PostPika ${plan} subscription is now active. Enjoy unlimited LinkedIn content generation!</p>`,
  })
}
