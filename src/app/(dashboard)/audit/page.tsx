import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getLevelFromScore, getTierFromLevel } from '@/lib/auditConfig'
import AuditResultCard from '@/components/features/AuditResultCard'
import type { AuditResult, AuditDimensionScore } from '@/types'

export const metadata = { title: 'Brand Audit — PostPika' }

async function getUserAudits(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('brand_audits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_unlocked', true)
    .order('created_at', { ascending: false })
    .limit(10)
  return data ?? []
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardAuditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, email, full_name')
    .eq('id', user.id)
    .single()

  const audits = await getUserAudits(user.id)
  const latestAudit = audits[0] ?? null

  // If no audit for this user, redirect to the public audit page
  if (!latestAudit) {
    redirect('/audit')
  }

  const level = getLevelFromScore(latestAudit.total_score)
  const tier  = getTierFromLevel(level.tier)
  const dimensionScores: AuditDimensionScore[] = Array.isArray(latestAudit.scores)
    ? latestAudit.scores
    : []

  const result: AuditResult = {
    id:                  latestAudit.id,
    linkedin_url:        latestAudit.linkedin_url,
    linkedin_username:   latestAudit.linkedin_username,
    full_name:           latestAudit.full_name,
    profile_photo_url:   latestAudit.profile_photo_url,
    sample_post_content: latestAudit.sample_post_content,
    total_score:         latestAudit.total_score,
    tier_key:            level.tier,
    tier_label:          tier?.label ?? level.tier,
    level_name:          level.label,
    level_key:           level.key,
    dimension_scores:    dimensionScores,
    ai_top_actions:      Array.isArray(latestAudit.ai_top_actions) ? latestAudit.ai_top_actions : [],
    ai_content_quality:  latestAudit.ai_content_quality ?? null,
    is_unlocked:         true,
    share_token:         latestAudit.share_token,
    created_at:          latestAudit.created_at,
  }

  const isStarter = profile?.plan === 'starter' || profile?.plan === 'pro' || profile?.plan === 'agency'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Latest audit result */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0A2540]">Brand Audit</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Audited on {new Date(latestAudit.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Link
            href="/audit"
            className="text-sm font-semibold text-[#1D9E75] hover:text-[#0F6E56] transition-colors"
          >
            New audit →
          </Link>
        </div>

        <AuditResultCard
          result={result}
          isUnlocked={true}
        />
      </div>

      {/* Audit history */}
      {audits.length > 1 && (
        <div className="bg-white rounded-2xl border border-[#E5E4E0] p-6 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">
            Audit History
          </h2>
          <div className="space-y-2">
            {audits.map(a => {
              const l = getLevelFromScore(a.total_score)
              const t = getTierFromLevel(l.tier)
              return (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-[#0A2540]">
                      {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400">linkedin.com/in/{a.linkedin_username}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: t?.bg, color: t?.color }}
                    >
                      {l.label}
                    </span>
                    <span className="text-lg font-bold" style={{ color: t?.color }}>
                      {a.total_score}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Audit another profile (Starter+ only) */}
      <div className="bg-white rounded-2xl border border-[#E5E4E0] p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">
          Audit Another Profile
        </h2>
        {isStarter ? (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              As a {profile?.plan} user, you can audit additional LinkedIn profiles.
            </p>
            <Link
              href="/audit"
              className="inline-flex items-center gap-2 bg-[#1D9E75] hover:bg-[#178a63] text-white
                         font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Audit a new profile →
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Free accounts can audit one LinkedIn profile. Upgrade to audit multiple profiles,
              track your score over time, and access the full analytics dashboard.
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 border-2 border-[#1D9E75] text-[#1D9E75]
                         font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-[#E1F5EE] transition-colors"
            >
              Upgrade to Starter →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
