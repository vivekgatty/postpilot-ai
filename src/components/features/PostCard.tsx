'use client'

import { Post } from '@/types'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatDate, truncate } from '@/lib/utils'

interface PostCardProps {
  post: Post
  onEdit?: (post: Post) => void
  onDelete?: (id: string) => void
}

export default function PostCard({ post, onEdit, onDelete }: PostCardProps) {
  const statusVariant = {
    draft: 'default',
    scheduled: 'warning',
    published: 'success',
  } as const

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <Badge variant={statusVariant[post.status]}>
          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
        </Badge>
        <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed mb-4">
        {truncate(post.content, 180)}
      </p>

      {post.status === 'published' && (
        <div className="flex gap-4 text-xs text-gray-500 mb-4">
          <span>{post.likes} likes</span>
          <span>{post.comments} comments</span>
          <span>{post.impressions.toLocaleString('en-IN')} impressions</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
        {onEdit && (
          <Button size="sm" variant="ghost" onClick={() => onEdit(post)}>
            Edit
          </Button>
        )}
        {onDelete && (
          <Button size="sm" variant="ghost" onClick={() => onDelete(post.id)}>
            Delete
          </Button>
        )}
      </div>
    </Card>
  )
}
