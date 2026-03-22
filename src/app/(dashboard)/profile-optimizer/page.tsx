'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser }              from '@/hooks/useUser'
import { useToast }             from '@/components/ui/Toast'
import ProfileInputForm         from '@/components/features/ProfileInputForm'
import ProfileScoreCard         from '@/components/features/ProfileScoreCard'
import ProfileRecommendations   from '@/components/features/ProfileRecommendations'
import type { ProfileAuditData, ProfileInputData } from '@/types'
import {
  OPTIMIZER_LIMITS, getTierFromScore, SCORE_TIERS,
} from '@/lib/profileOptimizerConfig'
import {
  Target, History, ChevronRight, RotateCcw,
  Award, ArrowLeft,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from 'recharts'

// suppress imported-per-spec items used only in certain code paths
void Award
void RotateCcw

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(dateStr?: string): string {
  if (!dateStr) return ''
  const ms   = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs  < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const ANALYZING_MESSAGES = [
  'Analysing your headline keywords...',
  'Evaluating your About section...',
  'Checking your SEO positioning...',
  'Running LinkedIn algorithm analysis...',
  'Generating your personalised recommendations...',
  'Building your improvement plan...',
]

type SubTab = 'overview' | 'recommendations' | 'keywords' | 'competitive'

// ─── Upgrade prompt ───────────────────────────────────────────────────────────

function UpgradePrompt({ message, cta }: { message: string; cta: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#FFFBEB' }}>
        <Award className="w-6 h-6" style={{ color: '#BA7517' }} />
      </div>
      <p className="text-sm text-gray-600 text-center max-w-xs">{message}</p>
      <a
        href="/settings"
        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: '#1D9E75' }}
      >
        {cta}
      </a>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfileOptimizerPage() {
  const { profile }   = useUser()
  const { toast }     = useToast()

  const plan  = profile?.plan ?? 'free'
  const limits = OPTIMIZER_LIMITS[plan as keyof typeof OPTIMIZER_LIMITS] ?? OPTIMIZER_LIMITS.free

  // ── State ──────────────────────────────────────────────────────────────────

  const [activeTab,         setActiveTab]         = useState<'optimize' | 'history'>('optimize')
  const [currentStep,       setCurrentStep]       = useState<0 | 1 | 2 | 3>(0)
  const [currentAudit,      setCurrentAudit]      = useState<ProfileAuditData | null>(null)
  const [savedAudits,       setSavedAudits]       = useState<ProfileAuditData[]>([])
  const [historyLoading,    setHistoryLoading]    = useState(false)
  const [isAnalyzing,       setIsAnalyzing]       = useState(false)
  const [analyzingMessage,  setAnalyzingMessage]  = useState(ANALYZING_MESSAGES[0])
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null)
  const [draftAuditId,      setDraftAuditId]      = useState<string | null>(null)
  const [activeSubTab,      setActiveSubTab]      = useState<SubTab>('overview')

  void draftAuditId
  void setDraftAuditId

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAnalyzeProfile = useCallback(async (
    data:     ProfileInputData,
    goal:     string,
    audience: string,
    keywords: string[],
  ) => {
    setIsAnalyzing(true)
    setCurrentStep(2)

    let msgIdx = 0
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % ANALYZING_MESSAGES.length
      setAnalyzingMessage(ANALYZING_MESSAGES[msgIdx])
    }, 2500)

    try {
      const res = await fetch('/api/profile-optimizer/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          goal,
          target_audience: audience,
          target_keywords: keywords,
          profile_data:    data,
        }),
      })
      const body = await res.json() as { audit?: ProfileAuditData; message?: string; code?: string }

      if (!res.ok) {
        if (res.status === 403 || body.code === 'MONTHLY_LIMIT') {
          toast.error(body.message ?? 'Monthly audit limit reached.')
        } else {
          toast.error('Analysis failed. Please try again.')
        }
        setCurrentStep(1)
        return
      }

      if (body.audit) {
        setCurrentAudit(body.audit)
        setCurrentStep(2)
        setActiveSubTab('overview')
      }
    } catch {
      toast.error('Analysis failed. Please try again.')
      setCurrentStep(1)
    } finally {
      clearInterval(interval)
      setIsAnalyzing(false)
    }
  }, [toast])

  const handleRecommendationDone = useCallback(async (
    recId:       string,
    dimensionId: string,
    updatedText: string,
  ) => {
    if (!currentAudit?.id) return
    const res  = await fetch('/api/profile-optimizer/rescore', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        audit_id:          currentAudit.id,
        recommendation_id: recId,
        dimension_id:      dimensionId,
        updated_text:      updatedText,
      }),
    })
    const data = await res.json() as {
      new_dimension_score?: number
      total_score?: number
      projected_score?: number
      dimension_scores?: ProfileAuditData['dimension_scores']
    }

    if (res.ok) {
      setCurrentAudit((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          ...(data.total_score     !== undefined ? { total_score:     data.total_score }     : {}),
          ...(data.projected_score !== undefined ? { projected_score: data.projected_score } : {}),
          ...(data.dimension_scores               ? { dimension_scores: data.dimension_scores } : {}),
          completed_recommendations: [...prev.completed_recommendations, recId],
        }
      })
      toast.success(`Score updated: +${data.new_dimension_score ?? 0} pts in ${dimensionId}`)
    }
  }, [currentAudit, toast])

  const handleAuditUpdate = useCallback((updates: Partial<ProfileAuditData>) => {
    setCurrentAudit((prev) => prev ? { ...prev, ...updates } : null)
    if (updates.completed_recommendations && currentAudit?.id) {
      fetch(`/api/profile-optimizer/${currentAudit.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ completed_recommendations: updates.completed_recommendations }),
      }).catch(() => {})
    }
  }, [currentAudit])

  const handleLoadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res  = await fetch('/api/profile-optimizer/list')
      const data = await res.json() as { audits?: ProfileAuditData[] }
      setSavedAudits(data.audits ?? [])
    } catch {
      // silent
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const handleLoadAudit = useCallback(async (auditId: string) => {
    const res  = await fetch(`/api/profile-optimizer/${auditId}`)
    const data = await res.json() as { audit?: ProfileAuditData }
    if (data.audit) {
      setCurrentAudit(data.audit)
      setCurrentStep(2)
      setActiveTab('optimize')
      setActiveSubTab('overview')
    }
  }, [])

  const handleStartFresh = () => {
    setCurrentAudit(null)
    setCurrentStep(0)
    setActiveTab('optimize')
    setSelectedDimension(null)
  }

  const handleDeleteAudit = async (id: string) => {
    await fetch(`/api/profile-optimizer/${id}`, { method: 'DELETE' }).catch(() => {})
    setSavedAudits((prev) => prev.filter((a) => a.id !== id))
  }

  // History limit per plan
  const historyLimit =
    plan === 'free'    ? 1 :
    plan === 'starter' ? 2 : Infinity
  const displayedAudits = savedAudits.slice(0, historyLimit)

  // ── Sub-components ─────────────────────────────────────────────────────────

  const Step0 = (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: '#E1F5EE' }}>
          <Target className="w-7 h-7" style={{ color: '#1D9E75' }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">LinkedIn Profile Optimizer</h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-lg mx-auto">
          Get your profile score out of 100, find out exactly why you rank where you do, and get
          copy-ready improvements that boost your search visibility, content reach, and inbound messages.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: '📊', label: '9-dimension scoring'       },
          { icon: '✍️', label: 'Copy-ready rewrites'       },
          { icon: '🔍', label: 'LinkedIn SEO analysis'     },
        ].map(({ icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}
          >
            <span className="text-xl">{icon}</span>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </div>
        ))}
      </div>

      {/* Score tier ladder */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Score tiers</p>
        <div className="space-y-1.5">
          {[...SCORE_TIERS].reverse().map((tier) => (
            <div key={tier.tier} className="flex items-center gap-3">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full w-28 text-center"
                style={{ background: `${tier.color}18`, color: tier.color }}
              >
                {tier.label}
              </span>
              <span className="text-xs text-gray-400">{tier.min}–{tier.max} pts</span>
              <span className="text-xs text-gray-500 hidden sm:block">{tier.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly limit warning */}
      {typeof limits.audits_per_month === 'number' && limits.audits_per_month > 0 && savedAudits.length >= limits.audits_per_month && (
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between gap-4"
          style={{ background: '#FFFBEB', border: '1.5px solid #BA7517' }}
        >
          <p className="text-sm text-amber-800">
            You&rsquo;ve used your audit for this month. Upgrade for more audits →
          </p>
          <a href="/settings" className="flex-shrink-0 text-xs font-semibold" style={{ color: '#BA7517' }}>
            Upgrade
          </a>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#1D9E75' }}
        >
          Start my profile audit
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('history'); void handleLoadHistory() }}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <History className="w-4 h-4" />
          View past audits
        </button>
      </div>
    </div>
  )

  const Step1 = (
    <ProfileInputForm
      onComplete={handleAnalyzeProfile}
      isAnalyzing={isAnalyzing}
    />
  )

  const LoadingStep = (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      {/* Pika icon placeholder */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: '#E1F5EE' }}
      >
        <Target className="w-8 h-8" style={{ color: '#1D9E75' }} />
      </div>
      <p className="text-sm font-medium text-gray-600 text-center max-w-xs">
        {analyzingMessage}
      </p>
      {/* Pulsing dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ background: '#1D9E75', animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )

  const ResultsStep = currentAudit ? (() => {
    const tier      = getTierFromScore(currentAudit.total_score)
    const tierColor = tier?.color ?? '#1D9E75'
    const subTabs: { id: SubTab; label: string; show: boolean }[] = [
      { id: 'overview',        label: 'Score overview',  show: true },
      { id: 'recommendations', label: 'Recommendations', show: true },
      { id: 'keywords',        label: 'Keyword plan',    show: plan !== 'free' },
      { id: 'competitive',     label: 'Competitive',     show: plan === 'pro' || plan === 'agency' },
    ]

    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Top action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleStartFresh}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              New audit
            </button>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: `${tierColor}18`, color: tierColor }}
            >
              {currentAudit.total_score}/100 · {tier?.label}
            </span>
          </div>
          <button
            type="button"
            onClick={() => { setActiveTab('history'); void handleLoadHistory() }}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            View history
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 flex-wrap">
          {subTabs.filter((t) => t.show).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveSubTab(t.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: activeSubTab === t.id ? '#1D9E75' : '#F5F5F3',
                color:      activeSubTab === t.id ? '#FFFFFF' : '#6B7280',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sub-tab content */}
        {activeSubTab === 'overview' && (
          <ProfileScoreCard
            audit={currentAudit}
            plan={plan}
            onViewDimension={(id) => {
              setSelectedDimension(id)
              setActiveSubTab('recommendations')
            }}
          />
        )}

        {activeSubTab === 'recommendations' && (
          <div className="space-y-3">
            {selectedDimension && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  Showing: <strong>{selectedDimension}</strong> recommendations
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDimension(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  ✕ Clear filter
                </button>
              </div>
            )}
            <ProfileRecommendations
              audit={currentAudit}
              plan={plan}
              onRecommendationDone={handleRecommendationDone}
              onAuditUpdate={handleAuditUpdate}
            />
          </div>
        )}

        {activeSubTab === 'keywords' && (
          plan === 'free'
            ? <UpgradePrompt
                message="Keyword research is available on Starter plan and above."
                cta="Upgrade to Starter →"
              />
            : (
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Your {currentAudit.keyword_recommendations.length} LinkedIn search keywords
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Add these to specific profile sections for maximum search visibility
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: '#F5F5F3' }}>
                        <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Keyword</th>
                        <th className="text-left px-3 py-2.5 text-gray-500 font-semibold hidden sm:table-cell">Searches</th>
                        <th className="text-left px-3 py-2.5 text-gray-500 font-semibold hidden md:table-cell">Where to Add</th>
                        <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAudit.keyword_recommendations.map((kw, i) => (
                        <tr key={kw.keyword} className="border-t border-gray-100"
                          style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAFAF9' }}>
                          <td className="px-3 py-2.5 font-medium text-gray-800">{kw.keyword}</td>
                          <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell">{kw.estimated_monthly_searches}</td>
                          <td className="px-3 py-2.5 hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {kw.placement.map((p) => (
                                <span key={p} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{p}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            {kw.current_in_profile
                              ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#E1F5EE', color: '#0F6E56' }}>In profile</span>
                              : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#FFFBEB', color: '#BA7517' }}>Missing</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
        )}

        {activeSubTab === 'competitive' && (
          plan !== 'pro' && plan !== 'agency'
            ? <UpgradePrompt
                message="Competitive analysis is available on Pro plan and above."
                cta="Upgrade to Pro →"
              />
            : currentAudit.competitive_analysis
              ? (
                <div className="space-y-4 rounded-2xl p-4" style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}>
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-700">How you compare in your niche</h3>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: '#534AB718', color: '#534AB7' }}>
                      {currentAudit.competitive_analysis.niche}
                    </span>
                  </div>
                  {currentAudit.competitive_analysis.gaps.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-gray-600">Gaps to close</p>
                      {currentAudit.competitive_analysis.gaps.map((g, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 mt-1" />
                          {g}
                        </div>
                      ))}
                    </div>
                  )}
                  {currentAudit.competitive_analysis.advantages.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-gray-600">Your advantages</p>
                      {currentAudit.competitive_analysis.advantages.map((a, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: '#1D9E75' }} />
                          {a}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
              : <p className="text-sm text-gray-400 text-center py-8">No competitive data available for this audit.</p>
        )}
      </div>
    )
  })() : null

  // Score history chart data (Pro/Agency)
  const scoreChartData = savedAudits.map((a) => ({
    date:  a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '',
    score: a.total_score,
  })).reverse()

  const HistoryTab = (
    <div className="max-w-2xl mx-auto py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Past profile audits</h2>
        <button
          type="button"
          onClick={handleStartFresh}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#1D9E75' }}
        >
          + New audit
        </button>
      </div>

      {historyLoading ? (
        <div className="space-y-3 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : displayedAudits.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-gray-400 text-sm">No past audits yet.</p>
          <button
            type="button"
            onClick={handleStartFresh}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#1D9E75' }}
          >
            Start your first audit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedAudits.map((a) => {
            const tier      = getTierFromScore(a.total_score)
            const tierColor = tier?.color ?? '#1D9E75'
            return (
              <div
                key={a.id}
                className="rounded-xl border border-gray-200 bg-white px-4 py-4 flex items-start gap-4"
              >
                {/* Score badge */}
                <div className="text-center flex-shrink-0 w-14">
                  <p className="text-2xl font-black leading-none" style={{ color: tierColor }}>
                    {a.total_score}
                  </p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: tierColor }}>
                    {tier?.label}
                  </p>
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Meta chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {a.goal && (
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">{a.goal}</span>
                    )}
                    <span className="text-xs text-gray-400">{formatRelative(a.created_at)}</span>
                  </div>

                  {/* Progress */}
                  <p className="text-xs text-gray-500">
                    {a.completed_recommendations.length} of {a.recommendations.length} improvements done
                  </p>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${a.recommendations.length > 0 ? Math.round((a.completed_recommendations.length / a.recommendations.length) * 100) : 0}%`,
                        background: tierColor,
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleLoadAudit(a.id ?? '')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: '#1D9E75' }}
                  >
                    View →
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteAudit(a.id ?? '')}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors text-center"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Free/Starter upgrade banner */}
      {plan !== 'pro' && plan !== 'agency' && savedAudits.length > historyLimit && (
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between gap-4"
          style={{ background: '#FFFBEB', border: '1.5px solid #BA7517' }}
        >
          <p className="text-sm text-amber-800">
            {savedAudits.length - historyLimit} older audit{savedAudits.length - historyLimit > 1 ? 's' : ''} hidden. Upgrade to view full history.
          </p>
          <a href="/settings" className="flex-shrink-0 text-xs font-semibold" style={{ color: '#BA7517' }}>
            Upgrade →
          </a>
        </div>
      )}

      {/* Score history chart (Pro/Agency only) */}
      {(plan === 'pro' || plan === 'agency') && scoreChartData.length > 1 && (
        <div className="rounded-2xl p-4 space-y-2" style={{ background: '#FAFAF9', border: '1px solid #E5E4E0' }}>
          <p className="text-xs font-semibold text-gray-600">Score history</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={scoreChartData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E4E0' }}
                itemStyle={{ color: '#1D9E75' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#1D9E75"
                strokeWidth={2}
                dot={{ r: 3, fill: '#1D9E75' }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )

  // ── Effect: load history when switching to history tab ──────────────────────

  useEffect(() => {
    if (activeTab === 'history' && savedAudits.length === 0 && !historyLoading) {
      void handleLoadHistory()
    }
  }, [activeTab, savedAudits.length, historyLoading, handleLoadHistory])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('optimize')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: activeTab === 'optimize' ? '#E1F5EE' : 'transparent',
            color:      activeTab === 'optimize' ? '#1D9E75' : '#6B7280',
          }}
        >
          <Target className="w-4 h-4" />
          Profile Optimizer
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('history'); void handleLoadHistory() }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: activeTab === 'history' ? '#E1F5EE' : 'transparent',
            color:      activeTab === 'history' ? '#1D9E75' : '#6B7280',
          }}
        >
          <History className="w-4 h-4" />
          History
        </button>
      </div>

      {/* Content */}
      {activeTab === 'optimize' && (
        <div className="flex-1">
          {currentStep === 0 && !isAnalyzing && Step0}
          {currentStep === 1 && !isAnalyzing && Step1}
          {isAnalyzing                          && LoadingStep}
          {currentStep === 2 && currentAudit && !isAnalyzing && ResultsStep}
        </div>
      )}

      {activeTab === 'history' && HistoryTab}

    </div>
  )
}
