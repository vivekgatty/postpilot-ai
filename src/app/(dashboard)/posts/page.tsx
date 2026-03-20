import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Post, PostStatus } from '@/types'

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PostStatus }) {
  const map: Record<PostStatus, string> = {
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

// ── Saved post card ───────────────────────────────────────────────────────────

function SavedPostCard({ post }: { post: Post }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E4E0] p-5 hover:border-[#1D9E75]/40 hover:shadow-sm transition-all duration-150">
      <div className="flex items-center justify-between mb-3">
        <StatusBadge status={post.status} />
        <div className="flex items-center gap-2">
          {post.is_favourite && <span className="text-amber-400 text-sm">★</span>}
          <span className="text-[11px] text-gray-400">
            {new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-800 leading-relaxed mb-3 line-clamp-4 whitespace-pre-wrap">
        {post.content}
      </p>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
          {post.tone}
        </span>
        {post.character_count !== null && (
          <span className="text-[10px] text-gray-400 ml-auto">
            {post.character_count.toLocaleString()} chars
          </span>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]">My Posts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{typedPosts.length} posts total</p>
        </div>
        <Link
          href="/generate"
          className="inline-flex items-center gap-1.5 bg-[#1D9E75] hover:bg-[#178a64] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {typedPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-3">📝</span>
          <p className="font-semibold text-gray-700 mb-1">No posts yet</p>
          <p className="text-sm text-gray-400 mb-5">Generate your first LinkedIn post with AI</p>
          <Link
            href="/generate"
            className="inline-flex items-center gap-1.5 bg-[#1D9E75] hover:bg-[#178a64] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Generate Post
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {typedPosts.map((post) => (
            <SavedPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
