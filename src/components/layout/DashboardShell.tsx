'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Settings, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from './Sidebar'
import Avatar from '@/components/ui/Avatar'
import UsageMeter from '@/components/features/UsageMeter'
import FloatingStreakButton from '@/components/features/FloatingStreakButton'
import LogTodayModal from '@/components/features/LogTodayModal'
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
  if (TITLE_MAP[pathname]) return TITLE_MAP[pathname]
  const key = Object.keys(TITLE_MAP).find(k => pathname.startsWith(`${k}/`))
  return key ? TITLE_MAP[key] : ''
}

// ── Avatar dropdown ───────────────────────────────────────────────────────────

function AvatarDropdown({ profile }: { profile: Profile | null }) {
  const [open, setOpen]   = useState(false)
  const dropRef           = useRef<HTMLDivElement>(null)
  const router            = useRouter()

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
  const pathname          = usePathname()
  const title             = getPageTitle(pathname)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // ── Streak floating button state ───────────────────────────────────────────
  const [streakData,    setStreakData]    = useState<{ streak: number; postedToday: boolean } | null>(null)
  const [showLogModal,  setShowLogModal]  = useState(false)
  const [isLogging,     setIsLogging]     = useState(false)

  useEffect(() => {
    fetch('/api/streak/state')
      .then(r => r.json())
      .then(d => setStreakData({
        streak:     d.state?.publish_streak     ?? 0,
        postedToday: d.posted_today_publish     ?? false,
      }))
      .catch(() => {})
  }, [])

  async function handleLayoutLog() {
    setIsLogging(true)
    try {
      const res  = await fetch('/api/streak/log', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ log_type: 'publish', source: 'self_report' }),
      })
      const data = await res.json()
      if (res.ok && !data.already_logged) {
        setStreakData(prev => prev
          ? { ...prev, streak: data.new_streak ?? prev.streak, postedToday: true }
          : null,
        )
      }
      setShowLogModal(false)
    } catch {
      // silently ignore layout-level log errors
    } finally {
      setIsLogging(false)
    }
  }

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F8F8F6]">

        {/* ── Desktop sidebar (lg+) ────────────────────────────────────────── */}
        <div className="hidden lg:block">
          <Sidebar profile={profile} />
        </div>

        {/* ── Mobile drawer backdrop ───────────────────────────────────────── */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Mobile sidebar drawer ────────────────────────────────────────── */}
        <div
          className={[
            'fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ease-in-out',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          {/* Close button inside drawer */}
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
          <Sidebar profile={profile} />
        </div>

        {/* ── Right column: topbar + main ──────────────────────────────────── */}
        <div className="lg:pl-60 flex flex-col min-h-screen">

          {/* Top bar — 56px */}
          <header className="h-14 bg-white border-b border-[#E5E4E0] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Hamburger — mobile only */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-sm font-semibold text-[#0A2540]">{title}</h1>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {/* Usage meter (inline variant) — hidden on very small screens */}
              <div className="hidden sm:block">
                <UsageMeter
                  used={profile?.generations_used_this_month ?? 0}
                  plan={profile?.plan ?? 'free'}
                  resetDate={profile?.generations_reset_date ?? undefined}
                  variant="inline"
                />
              </div>

              <AvatarDropdown profile={profile} />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
        <FloatingStreakButton
          streak={streakData?.streak ?? 0}
          postedToday={streakData?.postedToday ?? false}
          onOpenModal={() => setShowLogModal(true)}
        />

        <LogTodayModal
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          onLog={async () => { await handleLayoutLog() }}
          postedTodayPublish={streakData?.postedToday ?? false}
          postedTodayEngage={false}
          postedTodayPlan={false}
          plan={profile?.plan ?? 'free'}
          currentStreak={streakData?.streak ?? 0}
          isLogging={isLogging}
        />
    </ToastProvider>
  )
}
