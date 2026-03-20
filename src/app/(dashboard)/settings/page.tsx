'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import PricingTable   from '@/components/features/PricingTable'
import Modal          from '@/components/ui/Modal'
import { NICHE_OPTIONS } from '@/lib/constants'
import type { Profile, PlanType, NotificationPrefs, Subscription } from '@/types'

// ── Inline toast ──────────────────────────────────────────────────────────────

interface ToastState { msg: string; type: 'success' | 'error' | 'info' }

// ── Section anchor nav ────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'profile',       label: 'Profile'       },
  { id: 'account',       label: 'Account'       },
  { id: 'billing',       label: 'Plan & Billing' },
  { id: 'notifications', label: 'Notifications' },
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold text-[#0A2540]">{title}</h2>
      {sub && <p className="text-sm text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 py-3
                    border-b border-gray-100 last:border-0">
      <label className="text-sm font-medium text-gray-500 sm:w-36 flex-shrink-0">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function TextInput({
  value, onChange, placeholder, readOnly, type = 'text',
}: {
  value: string; onChange?: (v: string) => void
  placeholder?: string; readOnly?: boolean; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={[
        'w-full text-sm border border-gray-200 rounded-xl px-3 py-2',
        'focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10',
        readOnly ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-[#0A2540]',
      ].join(' ')}
    />
  )
}

function Toggle({
  checked, onChange, label, sub,
}: {
  checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-[#0A2540]">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none',
          checked ? 'bg-[#1D9E75]' : 'bg-gray-200',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          ].join(' ')}
        />
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [profile,      setProfile]      = useState<Profile | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [billingHistory, setBillingHistory] = useState<Array<{ date: string; amount: string; status: string }>>([])
  const [loading,      setLoading]      = useState(true)
  const [toast,        setToast]        = useState<ToastState | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Profile form state
  const [fullName,    setFullName]    = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [niche,       setNiche]       = useState<string>('Tech/SaaS')
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Account form state
  const [deleteConfirm,    setDeleteConfirm]    = useState(false)
  const [deleteText,       setDeleteText]       = useState('')
  const [deletingAccount,  setDeletingAccount]  = useState(false)

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    weekly_ideas:  true,
    usage_limit:   true,
    monthly_reset: false,
  })
  const [savingNotifs, setSavingNotifs] = useState(false)

  // Active nav section
  const [activeSection, setActiveSection] = useState<string>('profile')

  // ── Toast helper ──────────────────────────────────────────────────────────

  const pushToast = useCallback((msg: string, type: ToastState['type'] = 'info') => {
    setToast({ msg, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }, [])

  // ── Load data ─────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      fetch('/api/user/profile').then(r => r.json()) as Promise<{ profile?: Profile }>,
      fetch('/api/billing/subscription').then(r => r.json()).catch(() => ({})) as Promise<{ subscription?: Subscription; history?: typeof billingHistory }>,
    ]).then(([pd, bd]) => {
      const p = pd.profile
      if (p) {
        setProfile(p)
        setFullName(p.full_name ?? '')
        setLinkedinUrl(p.linkedin_url ?? '')
        setNiche(p.niche ?? 'Tech/SaaS')
        setAvatarUrl(p.avatar_url)
        setNotifPrefs(p.notification_prefs ?? { weekly_ideas: true, usage_limit: true, monthly_reset: false })
      }
      if (bd.subscription) setSubscription(bd.subscription)
      if (bd.history) setBillingHistory(bd.history)
    }).catch(() => pushToast('Failed to load settings', 'error'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Scroll spy ───────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = () => {
      for (const s of [...SECTIONS].reverse()) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(s.id); return
        }
      }
      setActiveSection('profile')
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // ── Save profile ──────────────────────────────────────────────────────────

  async function saveProfile() {
    setSavingProfile(true)
    try {
      const res = await fetch('/api/user/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ full_name: fullName, linkedin_url: linkedinUrl, niche }),
      })
      if (!res.ok) throw new Error('Save failed')
      pushToast('Profile saved', 'success')
    } catch {
      pushToast('Failed to save profile', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Avatar upload ─────────────────────────────────────────────────────────

  async function handleAvatarChange(file: File) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res  = await fetch('/api/user/avatar', { method: 'POST', body: formData })
      const data = await res.json() as { avatarUrl?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setAvatarUrl(data.avatarUrl!)
      pushToast('Avatar updated', 'success')
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Upload failed', 'error')
    }
  }

  // ── Cancel subscription ───────────────────────────────────────────────────

  async function handleCancelSubscription() {
    try {
      const res  = await fetch('/api/billing/cancel-subscription', { method: 'POST' })
      const data = await res.json() as { success?: boolean; message?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Cancel failed')
      pushToast(data.message ?? 'Subscription cancelled', 'info')
      setSubscription(prev => prev ? { ...prev, status: 'cancelled' } : prev)
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Failed to cancel', 'error')
    }
  }

  // ── Delete account ────────────────────────────────────────────────────────

  async function handleDeleteAccount() {
    if (deleteText !== 'DELETE') return
    setDeletingAccount(true)
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      window.location.href = '/'
    } catch {
      pushToast('Failed to delete account. Contact support.', 'error')
      setDeletingAccount(false)
    }
  }

  // ── Save notifications ────────────────────────────────────────────────────

  async function saveNotifications(prefs: NotificationPrefs) {
    setSavingNotifs(true)
    try {
      const res = await fetch('/api/user/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notification_prefs: prefs }),
      })
      if (!res.ok) throw new Error('Save failed')
      pushToast('Preferences saved', 'success')
    } catch {
      pushToast('Failed to save preferences', 'error')
    } finally {
      setSavingNotifs(false)
    }
  }

  function updateNotif(key: keyof NotificationPrefs, value: boolean) {
    const next = { ...notifPrefs, [key]: value }
    setNotifPrefs(next)
    saveNotifications(next)
  }

  const isPaidPlan = profile?.plan && profile.plan !== 'free'

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-3xl">
        <div className="h-8 bg-gray-100 rounded w-32 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-64 mb-8 animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 animate-pulse">
            <div className="h-5 bg-gray-100 rounded w-28 mb-4" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-10 bg-gray-50 rounded-xl mb-3" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-8 max-w-5xl">
      {/* Sticky anchor nav */}
      <nav className="hidden lg:block w-44 flex-shrink-0">
        <div className="sticky top-24 space-y-1">
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setActiveSection(s.id)}
              className={[
                'block px-3 py-2 rounded-lg text-sm transition-colors',
                activeSection === s.id
                  ? 'bg-[#E1F5EE] text-[#1D9E75] font-semibold'
                  : 'text-gray-500 hover:text-[#0A2540] hover:bg-gray-50',
              ].join(' ')}
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]">Settings</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your account and subscription.</p>
        </div>

        {/* ── SECTION 1: Profile ───────────────────────────────────────────── */}
        <section id="profile" className="bg-white rounded-2xl border border-gray-200 p-6">
          <SectionHeader title="Profile" sub="Update your personal details and LinkedIn presence." />

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="relative group"
              title="Click to change avatar"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-100
                             group-hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#E1F5EE] flex items-center justify-center
                                text-[#1D9E75] font-bold text-xl border-2 border-transparent
                                group-hover:border-[#1D9E75] transition-colors">
                  {(fullName || profile?.email || '?')[0].toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-[#1D9E75] rounded-full
                               flex items-center justify-center text-white text-[10px]
                               shadow border-2 border-white">
                ✎
              </span>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleAvatarChange(file)
              }}
            />
            <div>
              <p className="text-sm font-medium text-[#0A2540]">Profile photo</p>
              <p className="text-xs text-gray-400">Click to upload · JPG, PNG, WebP · max 2 MB</p>
            </div>
          </div>

          <div className="space-y-1">
            <FieldRow label="Full name">
              <TextInput
                value={fullName}
                onChange={setFullName}
                placeholder="Your name"
              />
            </FieldRow>
            <FieldRow label="LinkedIn URL">
              <TextInput
                value={linkedinUrl}
                onChange={setLinkedinUrl}
                placeholder="https://linkedin.com/in/username"
              />
            </FieldRow>
            <FieldRow label="Niche">
              <select
                value={niche}
                onChange={e => setNiche(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-[#0A2540]
                           focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10"
              >
                {NICHE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </FieldRow>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="px-5 py-2 rounded-xl bg-[#1D9E75] text-white text-sm font-semibold
                         hover:bg-[#178a63] disabled:opacity-60 transition-all active:scale-[0.98]
                         flex items-center gap-2"
            >
              {savingProfile && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Save changes
            </button>
          </div>
        </section>

        {/* ── SECTION 2: Account ───────────────────────────────────────────── */}
        <section id="account" className="bg-white rounded-2xl border border-gray-200 p-6">
          <SectionHeader title="Account" />

          <div className="space-y-1 mb-6">
            <FieldRow label="Email">
              <TextInput value={profile?.email ?? ''} readOnly />
            </FieldRow>
            <FieldRow label="Password">
              <a
                href="/auth/update-password"
                className="text-sm text-[#1D9E75] hover:underline font-medium"
              >
                Change password →
              </a>
            </FieldRow>
          </div>

          {/* Danger zone */}
          <div className="border border-red-100 rounded-xl p-4 bg-red-50/50">
            <p className="text-sm font-semibold text-red-600 mb-1">Danger zone</p>
            <p className="text-xs text-gray-500 mb-3">
              Permanently delete your account and all data. This cannot be undone.
            </p>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="text-sm font-semibold text-red-600 border border-red-200 rounded-lg px-4 py-2
                         hover:bg-red-50 transition-colors"
            >
              Delete my account
            </button>
          </div>
        </section>

        {/* ── SECTION 3: Plan & Billing ────────────────────────────────────── */}
        <section id="billing" className="bg-white rounded-2xl border border-gray-200 p-6">
          <SectionHeader title="Plan & Billing" />

          {!isPaidPlan ? (
            /* Free plan → show pricing table */
            <PricingTable
              currentPlan={profile?.plan ?? 'free'}
              onUpgrade={() => { /* reload handled inside PricingTable on success */ }}
              loading={false}
              userEmail={profile?.email}
              userName={profile?.full_name ?? undefined}
            />
          ) : (
            /* Paid plan → show current plan card + history */
            <div className="space-y-6">
              {/* Current plan card */}
              <div className="border border-[#1D9E75]/30 rounded-xl p-5 bg-[#F0FDF9]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#1D9E75] mb-1">
                      Current plan
                    </p>
                    <p className="text-xl font-bold text-[#0A2540] capitalize">
                      {profile?.plan}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Status:{' '}
                      <span className={[
                        'font-medium capitalize',
                        subscription?.status === 'active'    ? 'text-[#1D9E75]' :
                        subscription?.status === 'cancelled' ? 'text-amber-500' : 'text-gray-500',
                      ].join(' ')}>
                        {subscription?.status ?? 'active'}
                      </span>
                      {subscription?.current_end && (
                        <span className="text-gray-400">
                          {' '}· Next billing:{' '}
                          {new Date(subscription.current_end).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      )}
                    </p>
                  </div>

                  {subscription?.status === 'active' && (
                    <button
                      onClick={handleCancelSubscription}
                      className="text-sm text-red-500 hover:text-red-700 border border-red-200
                                 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
                    >
                      Cancel plan
                    </button>
                  )}
                </div>

                {subscription?.status === 'cancelled' && (
                  <p className="text-xs text-amber-600 mt-3 bg-amber-50 rounded-lg px-3 py-2">
                    Your subscription is cancelled but access continues until the end of your billing period.
                  </p>
                )}
              </div>

              {/* Billing history */}
              {billingHistory.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-[#0A2540] mb-3">Billing history</p>
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-400">
                          <th className="text-left px-4 py-2.5">Date</th>
                          <th className="text-left px-4 py-2.5">Amount</th>
                          <th className="text-left px-4 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingHistory.map((row, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-4 py-3 text-gray-600">{row.date}</td>
                            <td className="px-4 py-3 font-medium text-[#0A2540]">{row.amount}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                             bg-green-50 text-green-700">
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── SECTION 4: Notifications ─────────────────────────────────────── */}
        <section id="notifications" className="bg-white rounded-2xl border border-gray-200 p-6">
          <SectionHeader
            title="Notifications"
            sub={savingNotifs ? 'Saving…' : 'Email preferences — changes auto-save.'}
          />

          <Toggle
            checked={notifPrefs.weekly_ideas}
            onChange={v => updateNotif('weekly_ideas', v)}
            label="Weekly content ideas"
            sub="Get 7 fresh post ideas for your niche every Monday morning."
          />
          <Toggle
            checked={notifPrefs.usage_limit}
            onChange={v => updateNotif('usage_limit', v)}
            label="Usage limit warning"
            sub="Email when you've used 80% of your monthly generations."
          />
          <Toggle
            checked={notifPrefs.monthly_reset}
            onChange={v => updateNotif('monthly_reset', v)}
            label="Monthly reset reminder"
            sub="Email on the 1st of each month when your generations reset."
          />
        </section>
      </div>

      {/* ── Delete account modal ───────────────────────────────────────────── */}
      <Modal
        open={deleteConfirm}
        onClose={() => { setDeleteConfirm(false); setDeleteText('') }}
        title="Delete account"
      >
        <p className="text-sm text-gray-600 mb-4">
          This will permanently delete your account, all posts, and billing data.
          Type <strong>DELETE</strong> to confirm.
        </p>
        <input
          type="text"
          value={deleteText}
          onChange={e => setDeleteText(e.target.value)}
          placeholder="Type DELETE to confirm"
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 mb-4
                     focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10"
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => { setDeleteConfirm(false); setDeleteText('') }}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteText !== 'DELETE' || deletingAccount}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold
                       hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all
                       flex items-center gap-2"
          >
            {deletingAccount && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Delete permanently
          </button>
        </div>
      </Modal>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={[
            'fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-xl',
            'animate-in slide-in-from-bottom-2 fade-in duration-200',
            toast.type === 'success' ? 'bg-[#1D9E75] text-white' :
            toast.type === 'error'   ? 'bg-red-500 text-white' :
                                       'bg-[#0A2540] text-white',
          ].join(' ')}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
