'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import AuditResultCard from '@/components/features/AuditResultCard'
import { AUDIT_TIERS, DIMENSION_ORDER, getQuestionsByDimension, DIMENSION_LABELS } from '@/lib/auditConfig'
import type { AuditResult } from '@/types'

// ─── Tier badges preview ──────────────────────────────────────────────────────

const TIER_PREVIEW = Object.entries(AUDIT_TIERS).map(([key, t]) => ({
  key, label: t.label, color: t.color, bg: t.bg,
}))

// ─── Loading messages ─────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  'Analysing your profile completeness...',
  'Evaluating your content consistency...',
  'Running AI quality assessment...',
  'Calculating your niche authority...',
  'Generating your personalised action plan...',
  'Almost there...',
]

// ─── Step 0: Hero intro ───────────────────────────────────────────────────────

function StepIntro({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-2xl mx-auto text-center px-4 py-20">
      {/* Tier badges */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {TIER_PREVIEW.map(t => (
          <span
            key={t.key}
            className="px-3 py-1.5 rounded-full text-xs font-bold border"
            style={{ backgroundColor: t.bg, color: t.color, borderColor: t.color + '44' }}
          >
            {t.label}
          </span>
        ))}
      </div>

      <h1 className="text-4xl md:text-5xl font-bold text-[#0A2540] leading-tight mb-4">
        Discover Your LinkedIn<br />
        <span className="text-[#1D9E75]">Personal Brand Score</span>
      </h1>

      <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto">
        Answer 20 honest questions about your LinkedIn presence. Get your score out of 100,
        your unique rank, and a personalised action plan. Free. Takes 4 minutes.
      </p>

      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 bg-[#1D9E75] hover:bg-[#178a63] text-white
                   font-semibold text-lg px-8 py-4 rounded-xl transition-all shadow-lg shadow-[#1D9E75]/25
                   active:scale-[0.98]"
      >
        Start my free audit →
      </button>

      <p className="mt-4 text-sm text-gray-400">
        No credit card. No LinkedIn login. Just honest answers.
      </p>
    </div>
  )
}

// ─── Step 1: LinkedIn URL ─────────────────────────────────────────────────────

interface Step1Props {
  linkedinUrl:     string
  setLinkedinUrl:  (v: string) => void
  fullName:        string
  setFullName:     (v: string) => void
  photoUrl:        string
  setPhotoUrl:     (v: string) => void
  onNext:          () => void
  loading:         boolean
  error:           string
}

function StepLinkedIn({ linkedinUrl, setLinkedinUrl, fullName, setFullName, photoUrl, setPhotoUrl, onNext, loading, error }: Step1Props) {
  const match    = linkedinUrl.match(/linkedin\.com\/in\/([^/?#\s]+)/i)
  const username = match ? match[1].replace(/\/$/, '') : ''

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <p className="text-xs font-bold uppercase tracking-widest text-[#1D9E75] mb-2">Step 1 of 3</p>
      <h2 className="text-2xl font-bold text-[#0A2540] mb-6">Enter your LinkedIn profile URL</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-[#0A2540] block mb-1.5">
            LinkedIn profile URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={linkedinUrl}
            onChange={e => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/yourname"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20"
          />
          {username && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-[#E1F5EE] text-[#0F6E56] text-xs font-semibold px-3 py-1.5 rounded-full">
              ✓ linkedin.com/in/{username}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold text-[#0A2540] block mb-1.5">
            Your name (as it appears on LinkedIn) <span className="text-gray-400 font-normal">optional</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Priya Sharma"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-[#0A2540] block mb-1.5">
            Profile photo URL <span className="text-gray-400 font-normal">optional</span>
          </label>
          <input
            type="url"
            value={photoUrl}
            onChange={e => setPhotoUrl(e.target.value)}
            placeholder="https://..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20"
          />
          <p className="mt-1 text-xs text-gray-400">
            Open LinkedIn profile → right-click photo → Copy image address
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>
        )}

        <button
          onClick={onNext}
          disabled={loading || !linkedinUrl}
          className="w-full py-3.5 rounded-xl bg-[#1D9E75] hover:bg-[#178a63] text-white font-semibold
                     transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Checking...' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}

// ─── Step 2: Questionnaire ────────────────────────────────────────────────────

interface Step2Props {
  answers:    Record<string, string>
  setAnswers: (a: Record<string, string>) => void
  onDone:     () => void
}

function StepQuestionnaire({ answers, setAnswers, onDone }: Step2Props) {
  const [dimIndex, setDimIndex]   = useState(0)
  const [error, setError]         = useState('')

  const dim      = DIMENSION_ORDER[dimIndex]
  const questions = getQuestionsByDimension(dim)
  const label    = DIMENSION_LABELS[dim]

  const DIM_ICONS: Record<string, string> = {
    profile_completeness: '👤',
    content_consistency:  '📅',
    content_quality:      '✍️',
    audience_relevance:   '🎯',
    engagement_behaviour: '💬',
    niche_authority:      '🏆',
  }

  function answered(qid: string) { return answers[qid] !== undefined }
  function allAnswered() { return questions.every(q => answered(q.id)) }

  function setAnswer(qid: string, val: string) {
    setError('')
    setAnswers({ ...answers, [qid]: val })
  }

  function next() {
    if (!allAnswered()) { setError('Please answer all questions before continuing.'); return }
    setError('')
    if (dimIndex < DIMENSION_ORDER.length - 1) {
      setDimIndex(d => d + 1)
    } else {
      onDone()
    }
  }

  const overallProgress = Math.round(((dimIndex) / DIMENSION_ORDER.length) * 100)

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Outer progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
          <span>Audit progress</span>
          <span>{overallProgress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1D9E75] rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Section header */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1D9E75] mb-1">
          Section {dimIndex + 1} of {DIMENSION_ORDER.length}
        </p>
        <h2 className="text-xl font-bold text-[#0A2540]">
          {DIM_ICONS[dim]} {label}
        </h2>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map(q => (
          <div key={q.id} className="bg-white border border-[#E5E4E0] rounded-2xl p-5">
            <p className="text-sm font-semibold text-[#0A2540] mb-1 leading-snug">{q.question}</p>
            {q.hint && (
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">{q.hint}</p>
            )}

            {q.type === 'yesno' && (
              <div className="flex gap-3 mt-3">
                {(['yes', 'no'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setAnswer(q.id, v)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      answers[q.id] === v
                        ? 'border-[#1D9E75] bg-[#E1F5EE] text-[#0F6E56]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {v === 'yes' ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'choice' && q.options && (
              <div className="mt-3 space-y-2">
                {q.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAnswer(q.id, opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                      answers[q.id] === opt.value
                        ? 'border-[#1D9E75] bg-[#E1F5EE] text-[#0F6E56] font-semibold'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>
      )}

      <div className="mt-6 flex items-center justify-between">
        {dimIndex > 0 ? (
          <button
            onClick={() => setDimIndex(d => d - 1)}
            className="text-sm text-gray-500 hover:text-[#0A2540] transition-colors"
          >
            ← Back
          </button>
        ) : <span />}

        <button
          onClick={next}
          className="px-6 py-3 rounded-xl bg-[#1D9E75] hover:bg-[#178a63] text-white font-semibold text-sm transition-all"
        >
          {dimIndex < DIMENSION_ORDER.length - 1 ? 'Next section →' : 'Review my post →'}
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Sample post ──────────────────────────────────────────────────────

interface Step3Props {
  postContent:    string
  setPostContent: (v: string) => void
  postUrl:        string
  setPostUrl:     (v: string) => void
  onCalculate:    () => void
  onSkip:         () => void
}

function StepSamplePost({ postContent, setPostContent, postUrl, setPostUrl, onCalculate, onSkip }: Step3Props) {
  const [tab, setTab] = useState<'text' | 'url'>('text')

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <p className="text-xs font-bold uppercase tracking-widest text-[#1D9E75] mb-2">Step 3 of 3</p>
      <h2 className="text-2xl font-bold text-[#0A2540] mb-2">Paste your most recent LinkedIn post</h2>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
        This is the only step that uses AI to evaluate your actual content quality.
        Be honest — this is for your benefit.
      </p>

      {/* Tabs */}
      <div className="flex border border-gray-200 rounded-xl overflow-hidden mb-5">
        {(['text', 'url'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
              tab === t
                ? 'bg-[#1D9E75] text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t === 'text' ? 'Paste post text' : 'Paste post URL'}
          </button>
        ))}
      </div>

      {tab === 'text' && (
        <div>
          <textarea
            value={postContent}
            onChange={e => setPostContent(e.target.value)}
            rows={8}
            maxLength={3000}
            placeholder="Paste your LinkedIn post here..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 leading-relaxed"
          />
          <p className="text-right text-xs text-gray-400 mt-1">
            {postContent.length} / 3000
            {postContent.length < 50 && postContent.length > 0 && (
              <span className="text-amber-500 ml-2">Min 50 chars for AI evaluation</span>
            )}
          </p>
        </div>
      )}

      {tab === 'url' && (
        <div>
          <input
            type="url"
            value={postUrl}
            onChange={e => setPostUrl(e.target.value)}
            placeholder="https://linkedin.com/posts/..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20"
          />
          <p className="mt-2 text-xs text-gray-400">
            Open the post → click ··· → Copy link
          </p>
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700">
              We&apos;ll save the URL as a reference, but please also paste the post text above for AI evaluation — LinkedIn URLs can&apos;t be fetched automatically.
            </p>
          </div>
        </div>
      )}

      <button
        onClick={onCalculate}
        className="mt-5 w-full py-3.5 rounded-xl bg-[#1D9E75] hover:bg-[#178a63] text-white font-semibold transition-all"
      >
        Calculate my score →
      </button>

      <button
        onClick={onSkip}
        className="mt-3 w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        Skip this step — I&apos;ll paste a post later
      </button>
    </div>
  )
}

// ─── Loading overlay ──────────────────────────────────────────────────────────

function LoadingOverlay() {
  const [msgIdx, setMsgIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 2000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-6">
      {/* Pika pulse animation */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-[#1D9E75] animate-ping absolute inset-0 opacity-30" />
        <div className="w-16 h-16 rounded-full bg-[#1D9E75] flex items-center justify-center relative">
          <span className="text-white text-2xl font-bold">P</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-lg font-semibold text-[#0A2540] transition-all">
          {LOADING_MESSAGES[msgIdx]}
        </p>
        <p className="text-sm text-gray-400 mt-1">Just a few seconds...</p>
      </div>
    </div>
  )
}

// ─── Step 4: Blurred results (email gate) ─────────────────────────────────────

interface Step4Props {
  result:   AuditResult
  onUnlock: (email: string) => void
  unlocking: boolean
  unlockError: string
}

function StepBlurredResults({ result, onUnlock, unlocking, unlockError }: Step4Props) {
  const [email, setEmail] = useState('')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Score — always visible */}
      <div className="mb-4">
        <AuditResultCard
          result={result}
          isUnlocked={false}
        />
      </div>

      {/* Email gate overlay */}
      <div className="bg-white rounded-2xl border border-[#E5E4E0] shadow-lg p-8 text-center max-w-md mx-auto -mt-2 relative z-10">
        <div className="w-10 h-10 rounded-full bg-[#E1F5EE] flex items-center justify-center mx-auto mb-4">
          <span className="text-[#1D9E75] text-lg">🔓</span>
        </div>

        <h3 className="text-xl font-bold text-[#0A2540] mb-2">Your full audit is ready</h3>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          Enter your email to unlock your complete breakdown, personalised action plan,
          and shareable score card — free.
        </p>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20"
          />

          {unlockError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-left">
              <p className="text-sm text-red-600">{unlockError}</p>
              {unlockError.includes('one LinkedIn profile') && (
                <Link
                  href="/dashboard/settings"
                  className="text-xs text-[#1D9E75] font-semibold mt-1 block"
                >
                  Upgrade to audit multiple profiles →
                </Link>
              )}
            </div>
          )}

          <button
            onClick={() => email && onUnlock(email)}
            disabled={unlocking || !email}
            className="w-full py-3.5 rounded-xl bg-[#1D9E75] hover:bg-[#178a63] text-white font-semibold
                       transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {unlocking ? 'Unlocking...' : 'Unlock my results →'}
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          We&apos;ll email you your results and monthly improvement tips. Unsubscribe anytime.
        </p>

        <p className="mt-3 text-xs text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-[#1D9E75] font-semibold">Sign in →</Link>
        </p>
      </div>
    </div>
  )
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function Confetti() {
  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .confetti-piece {
          position: fixed;
          top: -10px;
          width: 8px;
          height: 8px;
          animation: confetti-fall linear forwards;
        }
      `}</style>
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="confetti-piece pointer-events-none z-50"
          style={{
            left:            `${Math.random() * 100}%`,
            backgroundColor: ['#1D9E75','#0A2540','#7F77DD','#EF9F27','#F87171'][i % 5],
            animationDuration: `${1.5 + Math.random() * 2}s`,
            animationDelay:    `${Math.random() * 1}s`,
            borderRadius:      Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [step, setStep]           = useState<0 | 1 | 2 | 3 | 4 | 5>(0)
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [fullName, setFullName]   = useState('')
  const [photoUrl, setPhotoUrl]   = useState('')
  const [auditId, setAuditId]     = useState('')
  const [answers, setAnswers]     = useState<Record<string, string>>({})
  const [postContent, setPostContent] = useState('')
  const [postUrl, setPostUrl]     = useState('')
  const [result, setResult]       = useState<AuditResult | null>(null)
  const [loading, setLoading]     = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError]         = useState('')
  const [unlockError, setUnlockError] = useState('')

  // Step 1 → 2: create audit session
  async function handleLinkedInContinue() {
    setError('')
    if (!linkedinUrl.includes('linkedin.com/in/')) {
      setError('Please enter a valid LinkedIn profile URL (e.g. linkedin.com/in/yourname)')
      return
    }
    setLoading(true)
    try {
      const res  = await fetch('/api/audit/start', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ linkedin_url: linkedinUrl, full_name: fullName || undefined, profile_photo_url: photoUrl || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
      if (data.exists) {
        // Existing unlocked audit — skip to result view
        setAuditId(data.auditId)
        setStep(5)
        return
      }
      setAuditId(data.auditId)
      setStep(2)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2 → 3: questionnaire done
  function handleQuestionnaireDone() {
    setStep(3)
  }

  // Step 3 → 4: evaluate
  async function handleCalculate() {
    setCalculating(true)
    try {
      const res  = await fetch('/api/audit/evaluate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          auditId,
          answers,
          samplePostContent: postContent || undefined,
          samplePostUrl:     postUrl || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.result) {
        setCalculating(false)
        return
      }
      setResult(data.result)
      setStep(4)
    } catch {
      // Silently fail — still show blurred result
    } finally {
      setCalculating(false)
    }
  }

  function handleSkipPost() {
    setPostContent('')
    setPostUrl('')
    handleCalculate()
  }

  // Step 4 → 5: unlock
  async function handleUnlock(email: string) {
    setUnlockError('')
    setUnlocking(true)
    try {
      const res  = await fetch('/api/audit/unlock', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ auditId, email }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'ONE_PROFILE_LIMIT') {
          setUnlockError('You\'ve already audited a profile with this email. Upgrade to audit multiple profiles.')
        } else {
          setUnlockError(data.error ?? 'Something went wrong. Please try again.')
        }
        return
      }
      setResult(data.result)
      setStep(5)
    } catch {
      setUnlockError('Network error. Please try again.')
    } finally {
      setUnlocking(false)
    }
  }

  function handleReAudit() {
    setStep(1)
    setAnswers({})
    setPostContent('')
    setPostUrl('')
    setResult(null)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0FDF9]/40 to-white">

      {/* Minimal navbar */}
      <nav className="h-14 border-b border-[#E5E4E0] bg-white flex items-center px-5 justify-between">
        <Logo size="sm" href="/" />
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-[#0A2540] transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-[#1D9E75] text-white px-4 py-2 rounded-lg hover:bg-[#178a63] transition-colors"
          >
            Start free
          </Link>
        </div>
      </nav>

      {/* Step content */}
      <main>
        {step === 0 && <StepIntro onStart={() => setStep(1)} />}

        {step === 1 && (
          <StepLinkedIn
            linkedinUrl={linkedinUrl}
            setLinkedinUrl={setLinkedinUrl}
            fullName={fullName}
            setFullName={setFullName}
            photoUrl={photoUrl}
            setPhotoUrl={setPhotoUrl}
            onNext={handleLinkedInContinue}
            loading={loading}
            error={error}
          />
        )}

        {step === 2 && (
          <StepQuestionnaire
            answers={answers}
            setAnswers={setAnswers}
            onDone={handleQuestionnaireDone}
          />
        )}

        {step === 3 && (
          <StepSamplePost
            postContent={postContent}
            setPostContent={setPostContent}
            postUrl={postUrl}
            setPostUrl={setPostUrl}
            onCalculate={handleCalculate}
            onSkip={handleSkipPost}
          />
        )}

        {step === 4 && result && (
          <StepBlurredResults
            result={result}
            onUnlock={handleUnlock}
            unlocking={unlocking}
            unlockError={unlockError}
          />
        )}

        {step === 5 && result && (
          <div className="max-w-2xl mx-auto px-4 py-8">
            <Confetti />
            <div className="text-center mb-6">
              <span className="text-2xl">🎉</span>
              <h2 className="text-xl font-bold text-[#0A2540] mt-2">Your results are unlocked!</h2>
              <p className="text-sm text-gray-500 mt-1">
                We&apos;ve sent a copy to your email.
              </p>
            </div>
            <AuditResultCard
              result={result}
              isUnlocked={true}
              onReAudit={handleReAudit}
            />
          </div>
        )}
      </main>

      {calculating && <LoadingOverlay />}
    </div>
  )
}
