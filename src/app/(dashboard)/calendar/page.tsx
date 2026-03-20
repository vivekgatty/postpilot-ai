import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import CalendarGrid from '@/components/features/CalendarGrid'
import type { Post } from '@/types'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user!.id)
    .in('status', ['scheduled', 'published'])
    .order('scheduled_at', { ascending: true })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0A2540]">Content Calendar</h1>
        <p className="text-gray-500 mt-1">Plan and schedule your LinkedIn posts.</p>
      </div>

      <Card className="max-w-2xl">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
        </h2>
        <CalendarGrid posts={(posts as Post[]) ?? []} month={new Date()} />
      </Card>
    </div>
  )
}
