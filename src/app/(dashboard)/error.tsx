'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// Static sidebar skeleton so the layout doesn't collapse entirely
function SidebarSkeleton() {
  return (
    <div className="fixed inset-y-0 left-0 w-60 bg-[#0A2540] flex flex-col px-4 py-5 gap-4">
      {/* Logo placeholder */}
      <div className="h-8 w-32 bg-white/10 rounded-lg" />
      {/* Nav items */}
      <div className="flex flex-col gap-2 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 rounded-lg bg-white/5" />
        ))}
      </div>
    </div>
  )
}

export default function DashboardError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(props.error)
  }, [props.error])

  return (
    <div className="min-h-screen bg-[#F8F8F6]">
      <SidebarSkeleton />

      <div className="pl-60 flex flex-col min-h-screen">
        {/* Topbar skeleton */}
        <header className="h-14 bg-white border-b border-[#E5E4E0] flex items-center px-6">
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
        </header>

        {/* Error content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center">

            {/* Pika error icon */}
            <svg
              width="64" height="64" viewBox="0 0 40 40" fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto mb-5"
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
              <path d="M15 29 Q20 26.5 25 29" stroke="#0A2540" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>

            <h2 className="text-xl font-bold text-[#0A2540] mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              This section ran into a problem. You can try reloading or contact support if it persists.
            </p>

            {process.env.NODE_ENV === 'development' && props.error.message && (
              <pre className="mb-5 text-left bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl px-4 py-3 overflow-x-auto whitespace-pre-wrap break-all">
                {props.error.message}
              </pre>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D9E75] hover:bg-[#178a64] text-white text-sm font-semibold transition-colors"
              >
                Reload page
              </button>
              <a
                href="mailto:hello@postpika.com?subject=Dashboard%20Error"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[#0A2540] text-sm font-semibold transition-colors"
              >
                Contact support
              </a>
            </div>

            <Link
              href="/dashboard"
              className="inline-block mt-4 text-sm text-[#1D9E75] hover:underline"
            >
              ← Back to dashboard
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
