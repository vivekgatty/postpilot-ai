'use client'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConnectLinkedInModal({ onClose }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-white rounded-2xl w-full max-w-[400px] p-8 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >

          {/* LinkedIn logo */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-[#0A66C2] flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-bold text-[#0A2540] text-center mb-2">
            Connect LinkedIn for direct posting
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
            PostPika can post directly to your LinkedIn feed without you leaving the app.
            This uses LinkedIn&apos;s official Share API.
          </p>

          {/* Permissions list */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
            <p className="text-xs text-gray-500 font-medium mb-2">You will be asked to grant:</p>
            {[
              'Sign in with your account',
              'Post content on your behalf',
              'Basic profile information',
            ].map((perm) => (
              <div key={perm} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-[#1D9E75] font-bold">✓</span>
                {perm}
              </div>
            ))}
          </div>

          {/* Connect button */}
          <a
            href="/api/linkedin/connect"
            className="w-full py-3 rounded-xl bg-[#0A66C2] hover:bg-[#0858a8] text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 mb-3"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Connect LinkedIn →
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
          >
            Use copy + open LinkedIn instead
          </button>

          <p className="text-[10px] text-gray-300 text-center mt-4 leading-relaxed">
            PostPika will never post without your explicit confirmation.
            We never read your existing posts or connections.
            You can revoke this anytime in your LinkedIn settings.
          </p>

        </div>
      </div>
    </>
  )
}
