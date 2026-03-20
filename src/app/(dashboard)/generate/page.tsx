'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ToneSelector from '@/components/features/ToneSelector'
import PostEditor from '@/components/features/PostEditor'
import type { ToneType } from '@/types'
import { LANGUAGES } from '@/lib/constants'

export default function GeneratePage() {
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState<ToneType>('professional')
  const [language, setLanguage] = useState('en')
  const [keywords, setKeywords] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          tone,
          language,
          keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
        }),
      })

      const data = await res.json() as { content?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate')
      setGeneratedContent(data.content ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedContent.trim()) return
    setSaving(true)

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: generatedContent, tone, status: 'draft' }),
      })

      if (!res.ok) throw new Error('Failed to save')
      setGeneratedContent('')
      setTopic('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0A2540]">Generate Post</h1>
        <p className="text-gray-500 mt-1">Create AI-powered LinkedIn content in seconds.</p>
      </div>

      <div className="space-y-5">
        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#0A2540] mb-1.5">
                What do you want to write about?
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. My experience transitioning from engineering to product management at a Bangalore startup..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0A2540] mb-1.5">Tone</label>
              <ToneSelector value={tone} onChange={setTone} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#0A2540] mb-1.5">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0A2540] mb-1.5">
                  Keywords <span className="font-normal text-gray-400">(optional, comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="leadership, startup, growth"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button
              onClick={handleGenerate}
              loading={generating}
              disabled={!topic.trim()}
              className="w-full"
            >
              ✨ Generate Post
            </Button>
          </div>
        </Card>

        {generatedContent && (
          <Card>
            <h2 className="text-sm font-semibold text-[#0A2540] mb-3">Generated Post</h2>
            <PostEditor
              value={generatedContent}
              onChange={setGeneratedContent}
              onSave={handleSave}
              loading={saving}
              placeholder=""
            />
          </Card>
        )}
      </div>
    </div>
  )
}
