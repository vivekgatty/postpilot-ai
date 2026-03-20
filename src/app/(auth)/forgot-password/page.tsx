'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { parseAuthError } from '@/lib/auth-errors'
import Logo from '@/components/ui/Logo'

function AlertIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  )
}

const inputCls =
  'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/25 focus:border-[#1D9E75] transition-colors bg-white'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/settings`,
    })

    if (err) {
      setError(parseAuthError(err.message, err.code))
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F8F6] px-4 py-12">
      <div className="w-full max-w-[400px] flex flex-col items-center">

        {/* Logo */}
        <div className="mb-8">
          <Logo size="lg" />
        </div>

        {/* Card */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-9">

          {sent ? (
            /* ── Success state ── */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-[#1D9E75]/10 flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-[#1D9E75]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#0A2540] mb-2">Check your inbox</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                We sent a password reset link to{' '}
                <span className="font-semibold text-gray-700">{email}</span>.
                The link expires in 1 hour.
              </p>
              <p className="text-xs text-gray-400 mt-4">
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={() => { setSent(false); setError(null) }}
                  className="text-[#1D9E75] hover:underline font-medium"
                >
                  try again
                </button>
                .
              </p>
            </div>
          ) : (
            <>
              {/* Heading */}
              <div className="mb-7 text-center">
                <h1 className="text-2xl font-bold text-[#0A2540] tracking-tight">
                  Reset your password
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  We&apos;ll send a reset link to your email
                </p>
              </div>

              <form onSubmit={handleReset} noValidate className="space-y-4">
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
                    disabled={loading}
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
                  disabled={loading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-[#1D9E75] hover:bg-[#178a64] active:bg-[#136f55] text-white font-semibold text-sm rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/50 focus:ring-offset-2"
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Send reset link
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-sm text-gray-500">
          <Link href="/login" className="text-[#1D9E75] font-semibold hover:text-[#178a64] transition-colors">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
