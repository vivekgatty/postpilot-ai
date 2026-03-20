'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to an error-reporting service in production
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        <div className="mb-8 flex justify-center">
          <Logo href="/" />
        </div>

        {/* Pika looking worried */}
        <svg
          width="80" height="80" viewBox="0 0 40 40" fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto mb-6"
          aria-hidden="true"
        >
          <ellipse cx="12.5" cy="10" rx="6" ry="8.5" fill="#E24B4A" opacity="0.7" />
          <ellipse cx="27.5" cy="10" rx="6" ry="8.5" fill="#E24B4A" opacity="0.7" />
          <ellipse cx="12.5" cy="10.5" rx="3.2" ry="5.2" fill="#c43d3c" opacity="0.7" />
          <ellipse cx="27.5" cy="10.5" rx="3.2" ry="5.2" fill="#c43d3c" opacity="0.7" />
          <circle cx="20" cy="25" r="14" fill="#E24B4A" opacity="0.85" />
          <circle cx="14.5" cy="22.5" r="3" fill="white" />
          <circle cx="25.5" cy="22.5" r="3" fill="white" />
          <circle cx="15.2" cy="23.2" r="1.5" fill="#0A2540" />
          <circle cx="26.2" cy="23.2" r="1.5" fill="#0A2540" />
          <circle cx="15.8" cy="22.5" r="0.6" fill="white" />
          <circle cx="26.8" cy="22.5" r="0.6" fill="white" />
          {/* worried mouth */}
          <path d="M33 30 Q40 27 47 30" stroke="#0A2540" strokeWidth="2" strokeLinecap="round" fill="none" transform="scale(0.5) translate(13, 22)" />
          <path d="M15 29 Q20 26.5 25 29" stroke="#0A2540" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>

        <h1 className="text-2xl font-bold text-[#0A2540] mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-500 text-sm mb-2">
          An unexpected error occurred. Our team has been notified.
        </p>

        {/* Show error message in dev only */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <pre className="mt-3 mb-5 text-left bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl px-4 py-3 overflow-x-auto whitespace-pre-wrap break-all">
            {error.message}
            {error.digest && `\n\nDigest: ${error.digest}`}
          </pre>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D9E75] hover:bg-[#178a64] text-white text-sm font-semibold transition-colors"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[#0A2540] text-sm font-semibold transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
