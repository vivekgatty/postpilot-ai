import Link from 'next/link'
import { Sparkles, FileText, Calendar, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/lib/constants'
import UsageMeter from '@/components/features/UsageMeter'
import type { Post } from '@/types'

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Post['status'] }) {
  const map = {
    draft:     'bg-gray-100 text-gray-500',
    scheduled: 'bg-blue-50 text-blue-600',
    published: 'bg-[#1D9E75]/10 text-[#1D9E75]',
    archived:  'bg-amber-50 text-amber-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${map[status]}`}>
      {status}
    </span>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  accent?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E4E0] p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent ? 'bg-[#1D9E75]/10' : 'bg-gray-100'}`}>
        <Icon className={`w-5 h-5 ${accent ? 'text-[#1D9E75]' : 'text-gray-500'}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium mb-0.5">{label}</p>
        <p className={`text-2xl font-extrabold leading-none ${accent ? 'text-[#1D9E75]' : 'text-[#0A2540]'}`}>
          {value}
        </p>
        {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: profile },
    { count: totalPosts },
    { count: thisMonth },
    { count: scheduled },
    { data: recentPosts },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, plan, generations_used_this_month, generations_reset_date')
      .eq('id', user!.id)
      .single(),

    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id),

    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('status', 'scheduled'),

    supabase
      .from('posts')
      .select('id, title, content, status, tone, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const plan      = profile?.plan ?? 'free'
  const isFree    = plan === 'free'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="space-y-6">

      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-[#0A2540]">
          {greeting}, {firstName}! 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Here&apos;s your LinkedIn content overview.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Posts"
          value={totalPosts ?? 0}
          icon={FileText}
          accent
        />
        <StatCard
          label="This Month"
          value={thisMonth ?? 0}
          sub="posts created"
          icon={TrendingUp}
        />
        <StatCard
          label="Scheduled"
          value={scheduled ?? 0}
          sub="upcoming posts"
          icon={Calendar}
        />
        <StatCard
          label="Plan"
          value={plan.charAt(0).toUpperCase() + plan.slice(1)}
          sub={isFree ? 'Upgrade for more →' : 'Active'}
          icon={Sparkles}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent posts — 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E4E0] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E4E0]">
            <h2 className="text-sm font-semibold text-[#0A2540]">Recent Posts</h2>
            <Link href="/posts" className="text-xs text-[#1D9E75] hover:underline">
              View all →
            </Link>
          </div>

          {recentPosts && recentPosts.length > 0 ? (
            <ul className="divide-y divide-[#E5E4E0]">
              {recentPosts.map((post) => (
                <li key={post.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0A2540] font-medium truncate">
                      {post.title ?? post.content.slice(0, 60) + (post.content.length > 60 ? '…' : '')}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {' · '}{(post.tone as string).charAt(0).toUpperCase() + (post.tone as string).slice(1)}
                    </p>
                  </div>
                  <StatusBadge status={post.status as Post['status']} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <span className="text-3xl mb-2">📝</span>
              <p className="text-sm font-medium text-gray-700 mb-1">No posts yet</p>
              <p className="text-xs text-gray-400 mb-4">Generate your first LinkedIn post with AI</p>
              <Link
                href="/generate"
                className="inline-flex items-center gap-1.5 bg-[#1D9E75] hover:bg-[#178a64] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate now
              </Link>
            </div>
          )}
        </div>

        {/* Right column — quick action + usage */}
        <div className="flex flex-col gap-5">

          {/* Quick action card */}
          <div className="bg-white rounded-2xl border border-[#E5E4E0] p-5">
            <h2 className="text-sm font-semibold text-[#0A2540] mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/generate"
                className="flex items-center gap-3 p-3 rounded-xl border border-[#1D9E75]/20 bg-[#1D9E75]/5 hover:bg-[#1D9E75]/10 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#1D9E75] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0A2540] leading-tight">Generate a post</p>
                  <p className="text-[11px] text-gray-400">AI-powered content in seconds</p>
                </div>
              </Link>

              <Link
                href="/calendar"
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#0A2540] leading-tight">View calendar</p>
                  <p className="text-[11px] text-gray-400">Manage your schedule</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Usage card */}
          <div className="bg-white rounded-2xl border border-[#E5E4E0] p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#0A2540]">AI Usage</h2>
              {isFree && (
                <Link
                  href="/settings"
                  className="text-[11px] text-[#1D9E75] font-semibold hover:underline"
                >
                  Upgrade →
                </Link>
              )}
            </div>

            <UsageMeter
              used={profile?.generations_used_this_month ?? 0}
              plan={plan}
              resetDate={profile?.generations_reset_date ?? undefined}
              variant="bar"
            />

            {isFree && (
              <p className="text-[11px] text-gray-400 mt-3 leading-snug">
                Free plan includes {PLAN_LIMITS.free} generations/month.{' '}
                <Link href="/settings" className="text-[#1D9E75] hover:underline">Upgrade</Link> for more.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
