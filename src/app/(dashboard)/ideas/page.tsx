'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import IdeaCard from '@/components/features/IdeaCard'
import type { Idea } from '@/types'

export default function IdeasPage() {
  const router = useRouter()
  const [industry, setIndustry] = useState('')
  const [role, setRole] = useState('')
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!industry || !role) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/generate/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, role, count: 10 }),
      })

      const data = await res.json() as { ideas?: string[]; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed')

      const mapped: Idea[] = (data.ideas ?? []).map((title, i) => ({
        id: `generated-${i}`,
        user_id: '',
        title,
        description: null,
        tags: [],
        used: false,
        created_at: new Date().toISOString(),
      }))

      setIdeas(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleUseIdea = (idea: Idea) => {
    const params = new URLSearchParams({ topic: idea.title })
    router.push(`/generate?${params.toString()}`)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0A2540]">Content Ideas</h1>
        <p className="text-gray-500 mt-1">Get AI-generated LinkedIn post ideas tailored to you.</p>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="Industry (e.g. IT, Finance)"
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
        />
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Role (e.g. Product Manager)"
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
        />
        <Button onClick={handleGenerate} loading={loading} disabled={!industry || !role}>
          Generate Ideas
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
      )}

      {ideas.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">💡</p>
          <p className="font-medium">No ideas yet</p>
          <p className="text-sm mt-1">Enter your industry and role above to get started</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ideas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} onUse={handleUseIdea} />
        ))}
      </div>
    </div>
  )
}
