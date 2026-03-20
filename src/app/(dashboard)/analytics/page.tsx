import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import type { Post } from '@/types'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user!.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const typedPosts = (posts as Post[]) ?? []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0A2540]">Analytics</h1>
        <p className="text-gray-500 mt-1">Track your published LinkedIn content.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Published Posts', value: typedPosts.length.toString(), icon: '📄' },
          {
            label: 'Total Characters',
            value: typedPosts
              .reduce((s, p) => s + (p.character_count ?? 0), 0)
              .toLocaleString('en-IN'),
            icon: '✍️',
          },
          {
            label: 'Avg. Length',
            value: typedPosts.length
              ? Math.round(
                  typedPosts.reduce((s, p) => s + (p.character_count ?? 0), 0) /
                    typedPosts.length
                ).toString()
              : '—',
            icon: '📏',
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>{stat.icon}</span> {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-extrabold text-[#0A2540]">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Published Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {typedPosts.length === 0 ? (
            <p className="text-gray-400 text-sm">No published posts yet.</p>
          ) : (
            <div className="space-y-3">
              {typedPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                >
                  <p className="text-sm text-gray-700 flex-1 mr-4 line-clamp-1">{post.content}</p>
                  <div className="flex gap-4 text-xs text-gray-500 flex-shrink-0">
                    <span>{post.character_count ?? 0} chars</span>
                    {post.published_at && <span>{formatDate(post.published_at)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
