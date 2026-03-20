'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])

  function scrollTo(id: string) {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-200',
        scrolled ? 'shadow-md' : 'shadow-none',
      ].join(' ')}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="8" fill="#1D9E75"/>
            <path d="M8 20V10l6 4 6-4v10" stroke="white" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="14" cy="9" r="2" fill="white"/>
          </svg>
          <span className="text-lg font-bold text-[#0A2540] group-hover:text-[#1D9E75] transition-colors">
            PostPika
          </span>
        </Link>

        {/* Centre nav — desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { label: 'Features',      id: 'features'     },
            { label: 'How it works',  id: 'how-it-works' },
            { label: 'Pricing',       id: 'pricing'      },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="px-3 py-2 text-sm text-gray-500 hover:text-[#0A2540] rounded-lg
                         hover:bg-gray-50 transition-colors font-medium"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right CTA — desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-500 hover:text-[#0A2540] px-3 py-2
                       rounded-lg hover:bg-gray-50 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold text-white bg-[#1D9E75] hover:bg-[#178a63]
                       px-4 py-2 rounded-xl transition-colors active:scale-[0.98]"
          >
            Start free →
          </Link>
        </div>

        {/* Hamburger — mobile */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <div className="w-5 space-y-1">
            <span className={`block h-0.5 bg-gray-600 transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block h-0.5 bg-gray-600 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-gray-600 transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-5 py-4 space-y-1">
          {[
            { label: 'Features',     id: 'features'     },
            { label: 'How it works', id: 'how-it-works' },
            { label: 'Pricing',      id: 'pricing'      },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="block w-full text-left px-3 py-2.5 text-sm font-medium text-gray-600
                         hover:text-[#0A2540] hover:bg-gray-50 rounded-lg transition-colors"
            >
              {item.label}
            </button>
          ))}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            <Link href="/login"
              className="text-sm font-medium text-gray-500 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              Sign in
            </Link>
            <Link href="/signup"
              className="text-sm font-semibold text-white bg-[#1D9E75] px-4 py-3 rounded-xl
                         text-center transition-colors hover:bg-[#178a63]">
              Start free →
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
