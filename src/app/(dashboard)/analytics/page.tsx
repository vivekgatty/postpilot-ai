import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
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

  const totalLikes = typedPosts.reduce((sum, p) => sum + p.likes, 0)
  const totalComments = typedPosts.reduce((sum, p) => sum + p.comments, 0)
  const totalImpressions = typedPosts.reduce((sum, p) => sum + p.impressions, 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0A2540]">Analytics</h1>
        <p className="text-gray-500 mt-1">Track your LinkedIn content performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Impressions', value: totalImpressions.toLocaleString('en-IN'), icon: '👁' },
          { label: 'Total Likes', value: totalLikes.toLocaleString('en-IN'), icon: '👍' },
          { label: 'Total Comments', value: totalComments.toLocaleString('en-IN'), icon: '💬' },
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
                <div key={post.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <p className="text-sm text-gray-700 flex-1 mr-4 line-clamp-1">{post.content}</p>
                  <div className="flex gap-4 text-xs text-gray-500 flex-shrink-0">
                    <span>{post.impressions.toLocaleString('en-IN')} views</span>
                    <span>{post.likes} likes</span>
                    <span>{post.comments} comments</span>
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
