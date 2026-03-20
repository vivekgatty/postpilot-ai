'use client'

import { Idea } from '@/types'
import { Card } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface IdeaCardProps {
  idea: Idea
  onUse?: (idea: Idea) => void
  onDelete?: (id: string) => void
}

export default function IdeaCard({ idea, onUse, onDelete }: IdeaCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-semibold text-[#0A2540] leading-snug">{idea.title}</h3>
        {idea.used && <Badge variant="success">Used</Badge>}
      </div>

      {idea.description && (
        <p className="text-xs text-gray-500 leading-relaxed mb-3">{idea.description}</p>
      )}

      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {idea.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
        {onUse && !idea.used && (
          <Button size="sm" variant="primary" onClick={() => onUse(idea)}>
            Use Idea
          </Button>
        )}
        {onDelete && (
          <Button size="sm" variant="ghost" onClick={() => onDelete(idea.id)}>
            Delete
          </Button>
        )}
      </div>
    </Card>
  )
}
