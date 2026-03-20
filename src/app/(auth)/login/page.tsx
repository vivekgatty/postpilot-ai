'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { parseAuthError } from '@/lib/auth-errors'
import Logo from '@/components/ui/Logo'

// ── SVG icons ─────────────────────────────────────────────────────────────────

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  )
}

// ── Input field ───────────────────────────────────────────────────────────────

const inputCls =
  'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/25 focus:border-[#1D9E75] transition-colors bg-white'

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'linkedin' | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Pick up ?error= from OAuth callback failures
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlErr = params.get('error')
    if (urlErr === 'auth_callback_failed') {
      setError('Authentication failed. Please try again.')
    }
  }, [])

  const handleOAuth = async (
    provider: 'google' | 'linkedin_oidc',
    label: 'google' | 'linkedin'
  ) => {
    setOauthLoading(label)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      },
    })
    if (err) {
      setError(parseAuthError(err.message, err.code))
      setOauthLoading(null)
    }
    // On success the browser navigates to the OAuth provider — loading stays true
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })

    if (err) {
      setError(parseAuthError(err.message, err.code))
      setLoading(false)
      return
    }

    router.push('/dashboard/generate')
    router.refresh()
  }

  const anyLoading = loading || oauthLoading !== null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F8F6] px-4 py-12">
      <div className="w-full max-w-[400px] flex flex-col items-center">

        {/* Logo */}
        <div className="mb-8">
          <Logo size="lg" />
        </div>

        {/* Card */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-9">

          {/* Heading */}
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold text-[#0A2540] tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Sign in to your PostPika account
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => handleOAuth('linkedin_oidc', 'linkedin')}
              disabled={anyLoading}
              className="w-full flex items-center justify-center gap-3 bg-[#0A66C2] hover:bg-[#0959aa] active:bg-[#084d94] text-white font-semibold text-sm rounded-lg px-4 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/50 focus:ring-offset-2"
            >
              {oauthLoading === 'linkedin' ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <LinkedInIcon />
              )}
              Continue with LinkedIn
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('google', 'google')}
              disabled={anyLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold text-sm rounded-lg px-4 py-2.5 border border-gray-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            >
              {oauthLoading === 'google' ? (
                <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400 font-medium uppercase tracking-wide">
                or continue with email
              </span>
            </div>
          </div>

          {/* Email / password form */}
          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={anyLoading}
                className={inputCls}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#1D9E75] hover:text-[#178a64] font-medium transition-colors"
                  tabIndex={0}
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={anyLoading}
                className={inputCls}
              />
            </div>

            {/* Error alert */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                <AlertIcon />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={anyLoading || !email || !password}
              className="w-full flex items-center justify-center gap-2 bg-[#1D9E75] hover:bg-[#178a64] active:bg-[#136f55] text-white font-semibold text-sm rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/50 focus:ring-offset-2 mt-1"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Sign in
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-sm text-gray-500">
          No account?{' '}
          <Link href="/signup" className="text-[#1D9E75] font-semibold hover:text-[#178a64] transition-colors">
            Start free →
          </Link>
        </p>
      </div>
    </div>
  )
}
