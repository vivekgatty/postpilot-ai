import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user!.id)
    .single()

  const { count: totalPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const { count: scheduledPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('status', 'scheduled')

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0A2540]">Good morning, {firstName}! 👋</h1>
        <p className="text-gray-500 mt-1">Here&apos;s your LinkedIn content overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold text-[#1D9E75]">{totalPosts ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold text-[#0A2540]">{scheduledPosts ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize text-[#0A2540]">
              {profile?.role ?? 'free'}
            </p>
            <Link href="/settings" className="text-xs text-[#1D9E75] hover:underline mt-1 block">
              Upgrade plan →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                href="/generate"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl">✨</span>
                <div>
                  <p className="text-sm font-medium text-[#0A2540]">Generate a post</p>
                  <p className="text-xs text-gray-400">AI-powered LinkedIn content</p>
                </div>
              </Link>
              <Link
                href="/ideas"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl">💡</span>
                <div>
                  <p className="text-sm font-medium text-[#0A2540]">Browse ideas</p>
                  <p className="text-xs text-gray-400">Explore your content ideas</p>
                </div>
              </Link>
              <Link
                href="/calendar"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl">📅</span>
                <div>
                  <p className="text-sm font-medium text-[#0A2540]">View calendar</p>
                  <p className="text-xs text-gray-400">Manage your posting schedule</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-gray-600">
              {[
                'Complete your profile in Settings',
                'Generate your first LinkedIn post',
                'Browse ideas for content inspiration',
                'Schedule posts on your calendar',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
