'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Calendar,
  Lightbulb,
  BarChart2,
  Settings,
  LogOut,
  Anchor,
  Target,
  Layout,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'
import Logo from '@/components/ui/Logo'
import type { Profile } from '@/types'

// ── Icon map ──────────────────────────────────────────────────────────────────

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Sparkles,
  FileText,
  Calendar,
  Lightbulb,
  BarChart2,
  Anchor,
  Target,
  Layout,
}

// ── Plan badge ────────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    free:    'bg-gray-100 text-gray-500',
    starter: 'bg-blue-50 text-blue-600',
    pro:     'bg-[#1D9E75]/10 text-[#1D9E75]',
    agency:  'bg-purple-50 text-purple-600',
  }
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide',
      map[plan] ?? map.free
    )}>
      {plan}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  profile: Profile | null
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const isFree   = !profile || profile.plan === 'free'

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-white border-r border-[#E5E4E0] flex flex-col z-30">

      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-[#E5E4E0] flex-shrink-0">
        <Logo size="sm" href="/dashboard" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon     = ICONS[item.icon]
          const isLocked = item.proOnly && isFree

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all focus:outline-none',
                isActive
                  ? 'text-[#1D9E75] bg-[#E1F5EE]'
                  : 'text-gray-600 hover:text-[#0A2540] hover:bg-gray-50'
              )}
            >
              {/* Active left border accent */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#1D9E75] rounded-r-full" />
              )}

              {Icon && (
                <Icon className={cn(
                  'w-[17px] h-[17px] flex-shrink-0 transition-colors',
                  isActive ? 'text-[#1D9E75]' : 'text-gray-400 group-hover:text-gray-600'
                )} />
              )}

              <span className="flex-1 leading-none">{item.label}</span>

              {(item.href === '/hooks' || item.href === '/dashboard/planner') && !isActive && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-[#1D9E75]/10 text-[#1D9E75]">
                  NEW
                </span>
              )}

              {item.href === '/dashboard/audit' && !isActive && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-[#1D9E75]/10 text-[#1D9E75]">
                  FREE
                </span>
              )}

              {isLocked && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-amber-50 text-amber-600 border border-amber-200">
                  PRO
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#E5E4E0] px-4 py-4 space-y-3 flex-shrink-0">

        {isFree && (
          <Link
            href="/settings"
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#1D9E75] hover:bg-[#178a64] text-white text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Upgrade to Pro →
          </Link>
        )}

        {/* User row */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar
            src={profile?.avatar_url}
            name={profile?.full_name ?? profile?.email}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#0A2540] truncate leading-tight mb-0.5">
              {profile?.full_name ?? profile?.email ?? 'User'}
            </p>
            <PlanBadge plan={profile?.plan ?? 'free'} />
          </div>
        </div>

        {/* Settings + sign out */}
        <div className="flex items-center justify-between">
          <Link
            href="/settings"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
