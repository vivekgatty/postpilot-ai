'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from './Sidebar'
import Avatar from '@/components/ui/Avatar'
import UsageMeter from '@/components/features/UsageMeter'
import { ToastProvider } from '@/components/ui/Toast'
import type { Profile } from '@/types'

// ── Pathname → page title map ─────────────────────────────────────────────────

const TITLE_MAP: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/generate':   'Generate',
  '/posts':      'My Posts',
  '/calendar':   'Calendar',
  '/ideas':      'Idea Lab',
  '/analytics':  'Analytics',
  '/settings':   'Settings',
  '/onboarding': 'Setup',
}

function getPageTitle(pathname: string): string {
  // Exact match first
  if (TITLE_MAP[pathname]) return TITLE_MAP[pathname]
  // Prefix match (e.g. /posts/123 → My Posts)
  const key = Object.keys(TITLE_MAP).find(k => pathname.startsWith(`${k}/`))
  return key ? TITLE_MAP[key] : ''
}

// ── Avatar dropdown ───────────────────────────────────────────────────────────

function AvatarDropdown({ profile }: { profile: Profile | null }) {
  const [open, setOpen]   = useState(false)
  const dropRef           = useRef<HTMLDivElement>(null)
  const router            = useRouter()

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="relative" ref={dropRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors focus:outline-none"
        aria-label="Account menu"
      >
        <Avatar
          src={profile?.avatar_url}
          name={profile?.full_name ?? profile?.email}
          size="sm"
        />
        <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
          {profile?.full_name ?? profile?.email ?? 'Account'}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-[#0A2540] truncate">
              {profile?.full_name ?? 'User'}
            </p>
            <p className="text-[11px] text-gray-400 truncate">{profile?.email}</p>
          </div>

          <button
            type="button"
            onClick={() => { setOpen(false); router.push('/settings') }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-gray-400" />
            Settings
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────

interface DashboardShellProps {
  children: React.ReactNode
  profile:  Profile | null
}

export default function DashboardShell({ children, profile }: DashboardShellProps) {
  const pathname = usePathname()
  const title    = getPageTitle(pathname)

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F8F8F6]">
        <Sidebar profile={profile} />

        {/* Right column: topbar + main */}
        <div className="pl-60 flex flex-col min-h-screen">

          {/* Top bar — 56px */}
          <header className="h-14 bg-white border-b border-[#E5E4E0] flex items-center justify-between px-6 sticky top-0 z-20 flex-shrink-0">
            <h1 className="text-sm font-semibold text-[#0A2540]">{title}</h1>

            <div className="flex items-center gap-4">
              {/* Usage meter (inline variant) */}
              <UsageMeter
                used={profile?.generations_used_this_month ?? 0}
                plan={profile?.plan ?? 'free'}
                resetDate={profile?.generations_reset_date ?? undefined}
                variant="inline"
              />

              <AvatarDropdown profile={profile} />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
