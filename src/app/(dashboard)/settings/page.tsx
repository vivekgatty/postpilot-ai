import { createClient } from '@/lib/supabase/server'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import PricingTable from '@/components/features/PricingTable'
import type { Profile } from '@/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const typedProfile = profile as Profile | null

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2540]">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and subscription.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-[#0A2540]">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-[#0A2540]">{typedProfile?.full_name ?? '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Niche</span>
              <span className="font-medium text-[#0A2540]">{typedProfile?.niche ?? '—'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Plan</span>
              <span className="font-semibold capitalize text-[#1D9E75]">
                {typedProfile?.plan ?? 'free'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-bold text-[#0A2540] mb-4">Upgrade Plan</h2>
        <PricingTable currentPlan={typedProfile?.plan ?? 'free'} />
      </div>
    </div>
  )
}
