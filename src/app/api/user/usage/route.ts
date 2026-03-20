import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/lib/constants'
import type { PlanType, UsageInfo } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, generations_used_this_month, generations_reset_date')
      .eq('id', user.id)
      .single()

    const plan = ((profile?.plan as PlanType) ?? 'free')
    const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free

    const info: UsageInfo = {
      used:      profile?.generations_used_this_month ?? 0,
      limit,
      plan,
      resetDate: profile?.generations_reset_date ?? '',
    }

    return NextResponse.json(info)
  } catch (error) {
    console.error('GET /api/user/usage error:', error)
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 })
  }
}
