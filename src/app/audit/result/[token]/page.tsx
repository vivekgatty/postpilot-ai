import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTierFromLevel } from '@/lib/auditConfig'
import { getInitials } from '@/lib/utils'
import type { AuditResult } from '@/types'

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getAuditByToken(token: string): Promise<AuditResult | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://postpika.com'
    const res = await fetch(`${baseUrl}/api/audit/${token}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.result ?? null
  } catch {
    return null
  }
}

// ─── Dynamic metadata ─────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: { token: string } },
): Promise<Metadata> {
  const result = await getAuditByToken(params.token)
  if (!result) {
    return { title: 'Audit Not Found — PostPika' }
  }

  const displayName = result.full_name || result.linkedin_username || 'A LinkedIn Professional'

  return {
    title: `${displayName}'s LinkedIn Score: ${result.total_score}/100 — ${result.level_name}`,
    description: `${displayName} scored ${result.total_score}/100 on the PostPika LinkedIn Personal Brand Audit, ranked "${result.level_name}". Are you a ${result.level_name} too? Find out free.`,
    openGraph: {
      title: `${displayName}'s LinkedIn Score: ${result.total_score}/100 — ${result.level_name}`,
      description: `Scored ${result.total_score}/100 on the PostPika LinkedIn Personal Brand Audit. Ranked "${result.level_name}" (${result.tier_label}). Take the free 4-minute audit.`,
      url: `https://postpika.com/audit/result/${params.token}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName}'s LinkedIn Score: ${result.total_score}/100`,
      description: `Ranked "${result.level_name}" on the PostPika Personal Brand Audit. What's your score?`,
    },
  }
}

// ─── Page component ───────────────────────────────────────────────────────────

export default async function AuditResultSharePage({
  params,
}: {
  params: { token: string }
}) {
  const result = await getAuditByToken(params.token)

  if (!result) {
    notFound()
  }

  const displayName = result.full_name || result.linkedin_username || 'A LinkedIn Professional'
  const tier        = getTierFromLevel(result.tier_key)
  const tierColor   = tier?.color ?? '#1D9E75'
  const tierBg      = tier?.bg ?? '#E1F5EE'

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0FDF9]/60 to-white">

      {/* Minimal navbar */}
      <nav className="h-14 border-b border-[#E5E4E0] bg-white/80 backdrop-blur flex items-center px-5 justify-between">
        <span className="text-lg font-extrabold text-[#1D9E75] tracking-tight">PostPika</span>
        <Link
          href="/signup"
          className="text-sm font-semibold bg-[#1D9E75] text-white px-4 py-2 rounded-lg hover:bg-[#178a63] transition-colors"
        >
          Start free
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">

        {/* Score card */}
        <div
          style={{
            width: '100%', background: '#fff', borderRadius: 16,
            border: '1px solid #E5E4E0', overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
          }}
        >
          <div style={{ height: 8, background: '#1D9E75' }} />

          <div style={{ padding: '28px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>

              {/* Profile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {result.profile_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={result.profile_photo_url}
                    alt={displayName}
                    style={{ width: 64, height: 64, borderRadius: '50%', border: `3px solid ${tierColor}`, objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: tierBg, border: `3px solid ${tierColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 800, color: tierColor,
                  }}>
                    {getInitials(displayName)}
                  </div>
                )}
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 700, color: '#0A2540' }}>
                    {displayName}
                  </p>
                  <a
                    href={`https://linkedin.com/in/${result.linkedin_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}
                  >
                    linkedin.com/in/{result.linkedin_username}
                  </a>
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 800, color: '#1D9E75', letterSpacing: '-0.5px', flexShrink: 0 }}>
                PostPika
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                <span style={{ fontSize: 72, fontWeight: 800, color: tierColor, lineHeight: 1 }}>
                  {result.total_score}
                </span>
                <span style={{ fontSize: 28, color: '#9ca3af', fontWeight: 400 }}>/100</span>
              </div>

              <div style={{
                display: 'inline-block', marginTop: 12,
                background: tierBg, color: tierColor,
                fontSize: 16, fontWeight: 700, padding: '8px 24px',
                borderRadius: 99, border: `1.5px solid ${tierColor}`,
              }}>
                {result.level_name}
              </div>

              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#9ca3af' }}>
                {result.tier_label}
              </p>
            </div>
          </div>

          <div style={{ background: '#1D9E75', padding: '12px 32px' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#fff', textAlign: 'center' }}>
              linkedin.com/in/{result.linkedin_username} · PostPika Personal Brand Audit · postpika.com/audit
            </p>
          </div>
        </div>

        {/* Viral CTA */}
        <div className="mt-10 text-center">
          <p className="text-lg font-semibold text-[#0A2540] mb-2">
            This is {displayName}&apos;s LinkedIn Personal Brand Score. What&apos;s yours?
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Free 4-minute audit. Get your score out of 100 and 3 actions to improve this week.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/audit"
              className="inline-flex items-center justify-center gap-2 bg-[#1D9E75] hover:bg-[#178a63]
                         text-white font-semibold px-7 py-3.5 rounded-xl transition-all
                         shadow-lg shadow-[#1D9E75]/25 text-sm"
            >
              Get my free score →
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 border border-gray-200
                         text-gray-600 hover:text-[#0A2540] hover:border-gray-300 font-semibold
                         px-7 py-3.5 rounded-xl transition-all text-sm"
            >
              Build my LinkedIn content with PostPika →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-12">
          Powered by{' '}
          <Link href="https://postpika.com" className="text-[#1D9E75] font-semibold">
            postpika.com
          </Link>{' '}
          · LinkedIn AI content tool for Indian professionals
        </p>
      </main>
    </div>
  )
}
