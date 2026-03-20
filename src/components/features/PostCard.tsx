'use client'

import type { Post, PostStatus } from '@/types'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatDate, truncate } from '@/lib/utils'

interface PostCardProps {
  post: Post
  onEdit?: (post: Post) => void
  onDelete?: (id: string) => void
  onToggleFavourite?: (id: string) => void
}

const STATUS_VARIANT: Record<PostStatus, 'default' | 'warning' | 'success' | 'outline'> = {
  draft:     'default',
  scheduled: 'warning',
  published: 'success',
  archived:  'outline',
}

export default function PostCard({ post, onEdit, onDelete, onToggleFavourite }: PostCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <Badge variant={STATUS_VARIANT[post.status]}>
          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
        </Badge>
        <div className="flex items-center gap-2">
          {onToggleFavourite && (
            <button
              type="button"
              onClick={() => onToggleFavourite(post.id)}
              className={post.is_favourite ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'}
              aria-label={post.is_favourite ? 'Remove from favourites' : 'Add to favourites'}
            >
              ★
            </button>
          )}
          <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
        </div>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed mb-4">
        {truncate(post.content, 180)}
      </p>

      {post.character_count !== null && (
        <p className="text-xs text-gray-400 mb-3">{post.character_count} chars</p>
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
