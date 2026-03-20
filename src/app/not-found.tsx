import Link from 'next/link'
import Logo from '@/components/ui/Logo'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">

        <div className="mb-8 flex justify-center">
          <Logo href="/" />
        </div>

        {/* Large 404 */}
        <p className="text-[96px] font-bold text-[#1D9E75] leading-none mb-2 select-none">
          404
        </p>

        {/* Pika looking puzzled */}
        <svg
          width="80" height="80" viewBox="0 0 40 40" fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto mb-5"
          aria-hidden="true"
        >
          {/* Ears — tilted slightly */}
          <ellipse cx="12.5" cy="10" rx="6" ry="8.5" fill="#1D9E75" transform="rotate(-8 12.5 10)" />
          <ellipse cx="27.5" cy="10" rx="6" ry="8.5" fill="#1D9E75" transform="rotate(8 27.5 10)" />
          <ellipse cx="12.5" cy="10.5" rx="3.2" ry="5.2" fill="#178a64" transform="rotate(-8 12.5 10.5)" />
          <ellipse cx="27.5" cy="10.5" rx="3.2" ry="5.2" fill="#178a64" transform="rotate(8 27.5 10.5)" />
          {/* Head */}
          <circle cx="20" cy="25" r="14" fill="#1D9E75" />
          {/* Eyes — one squinting (puzzled) */}
          <circle cx="14.5" cy="22.5" r="3" fill="white" />
          <circle cx="25.5" cy="22.5" r="3" fill="white" />
          <circle cx="15.2" cy="23.2" r="1.5" fill="#0A2540" />
          <circle cx="26.2" cy="23.2" r="1.5" fill="#0A2540" />
          <circle cx="15.8" cy="22.5" r="0.6" fill="white" />
          <circle cx="26.8" cy="22.5" r="0.6" fill="white" />
          {/* Squint line over right eye */}
          <path d="M23 21 Q25.5 20 28 21" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          {/* Nose */}
          <ellipse cx="20" cy="27.5" rx="1.8" ry="1.2" fill="#0A2540" opacity="0.5" />
          {/* Puzzled mouth (slightly open, tilted) */}
          <path d="M16 30 Q20 31.5 24 29.5" stroke="#0A2540" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Question mark above head */}
          <text x="28" y="9" fontSize="8" fill="#0A2540" opacity="0.5" fontWeight="bold">?</text>
          {/* Blush */}
          <ellipse cx="11.5" cy="27" rx="3" ry="1.8" fill="#fb7185" opacity="0.3" />
          <ellipse cx="28.5" cy="27" rx="3" ry="1.8" fill="#fb7185" opacity="0.3" />
        </svg>

        <h1 className="text-2xl font-bold text-[#0A2540] mb-2">
          This page doesn&rsquo;t exist
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Looks like this URL doesn&rsquo;t lead anywhere. Let&rsquo;s get you back on track.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1D9E75] hover:bg-[#178a64] text-white text-sm font-semibold transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
