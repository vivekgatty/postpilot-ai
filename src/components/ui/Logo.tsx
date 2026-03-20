import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  href?: string
}

const sizes = {
  sm: { icon: 28, text: 'text-lg' },
  md: { icon: 36, text: 'text-2xl' },
  lg: { icon: 44, text: 'text-3xl' },
}

function PikaIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Left ear */}
      <ellipse cx="12.5" cy="10" rx="6" ry="8.5" fill="#1D9E75" />
      {/* Right ear */}
      <ellipse cx="27.5" cy="10" rx="6" ry="8.5" fill="#1D9E75" />
      {/* Inner left ear */}
      <ellipse cx="12.5" cy="10.5" rx="3.2" ry="5.2" fill="#178a64" />
      {/* Inner right ear */}
      <ellipse cx="27.5" cy="10.5" rx="3.2" ry="5.2" fill="#178a64" />
      {/* Head */}
      <circle cx="20" cy="25" r="14" fill="#1D9E75" />
      {/* Left eye white */}
      <circle cx="14.5" cy="22.5" r="3" fill="white" />
      {/* Right eye white */}
      <circle cx="25.5" cy="22.5" r="3" fill="white" />
      {/* Left pupil */}
      <circle cx="15.2" cy="23.2" r="1.5" fill="#0A2540" />
      {/* Right pupil */}
      <circle cx="26.2" cy="23.2" r="1.5" fill="#0A2540" />
      {/* Left eye shine */}
      <circle cx="15.8" cy="22.5" r="0.6" fill="white" />
      {/* Right eye shine */}
      <circle cx="26.8" cy="22.5" r="0.6" fill="white" />
      {/* Nose */}
      <ellipse cx="20" cy="27.5" rx="1.8" ry="1.2" fill="#0A2540" opacity="0.5" />
      {/* Left cheek blush */}
      <ellipse cx="11.5" cy="27" rx="3" ry="1.8" fill="#fb7185" opacity="0.3" />
      {/* Right cheek blush */}
      <ellipse cx="28.5" cy="27" rx="3" ry="1.8" fill="#fb7185" opacity="0.3" />
    </svg>
  )
}

export default function Logo({ size = 'md', className, href = '/' }: LogoProps) {
  const { icon, text } = sizes[size]

  const content = (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <PikaIcon size={icon} />
      <span
        className={cn(
          'font-bold tracking-tight text-[#0A2540] font-poppins',
          text
        )}
      >
        postpika
      </span>
    </span>
  )

  return (
    <Link href={href} className="inline-flex items-center gap-2 focus:outline-none">
      {content}
    </Link>
  )
}
