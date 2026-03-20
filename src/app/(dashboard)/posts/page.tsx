import { createClient } from '@/lib/supabase/server'
import PostCard from '@/components/features/PostCard'
import type { Post } from '@/types'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default async function PostsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const typedPosts = (posts as Post[]) ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]">My Posts</h1>
          <p className="text-gray-500 mt-1">{typedPosts.length} posts total</p>
        </div>
        <Link href="/generate">
          <Button>+ New Post</Button>
        </Link>
      </div>

      {typedPosts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-medium">No posts yet</p>
          <p className="text-sm mt-1">Generate your first LinkedIn post</p>
          <Link href="/generate">
            <Button className="mt-4">Generate Post</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {typedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
