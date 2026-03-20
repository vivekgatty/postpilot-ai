import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Guard: send new users to onboarding — but skip if already there
  // (x-pathname is injected by middleware to avoid infinite redirect)
  const headersList = await headers()
  const pathname    = headersList.get('x-pathname') ?? ''

  if (
    profile &&
    !profile.onboarding_completed &&
    pathname !== '/onboarding' &&
    !pathname.startsWith('/onboarding/')
  ) {
    redirect('/onboarding')
  }

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  )
}
