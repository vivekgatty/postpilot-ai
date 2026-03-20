/**
 * Maps Supabase auth error messages to user-readable strings.
 * Checks both error.message and error.code (lowercase, contains-based).
 */
export function parseAuthError(message: string, code?: string): string {
  const m = (message + ' ' + (code ?? '')).toLowerCase()

  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'Incorrect email or password. Please try again.'

  if (m.includes('email not confirmed'))
    return 'Please verify your email first — check your inbox for a confirmation link.'

  if (
    m.includes('user already registered') ||
    m.includes('already registered') ||
    m.includes('user_already_exists')
  )
    return 'An account with this email already exists. Try signing in instead.'

  if (
    m.includes('weak_password') ||
    (m.includes('password') && m.includes('characters'))
  )
    return 'Please choose a stronger password (minimum 8 characters).'

  if (
    m.includes('too many requests') ||
    m.includes('too_many_requests') ||
    m.includes('request rate limit')
  )
    return 'Too many attempts. Please wait a few minutes before trying again.'

  if (
    m.includes('over_email_send_rate_limit') ||
    m.includes('email rate limit') ||
    m.includes('email_rate_limit')
  )
    return 'Too many emails sent recently. Please wait a while before requesting another.'

  if (
    m.includes('unable to validate email') ||
    m.includes('invalid email') ||
    m.includes('invalid format')
  )
    return 'Please enter a valid email address.'

  if (m.includes('signup') && m.includes('disabled'))
    return 'New signups are temporarily disabled. Please try again later.'

  if (
    m.includes('email link is invalid') ||
    m.includes('token has expired') ||
    m.includes('otp_expired')
  )
    return 'This link has expired or is no longer valid. Please request a new one.'

  if (m.includes('oauth') && (m.includes('provider') || m.includes('error')))
    return 'OAuth sign-in failed. Please try again or use email/password.'

  if (m.includes('network') || m.includes('failed to fetch'))
    return 'Network error. Please check your connection and try again.'

  // Strip Supabase-internal prefixes if nothing matched
  return message.replace(/^AuthApiError:\s*/i, '') || 'Something went wrong. Please try again.'
}
