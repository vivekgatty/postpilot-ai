'use client'

import { Flame, Lock, Snowflake } from 'lucide-react'
import { getMilestoneForStreak, getNextMilestone, isStreakActive } from '@/lib/streakConfig'
import type { StreakState } from '@/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  streakState:        StreakState
  postedTodayPublish: boolean
  postedTodayEngage:  boolean
  postedTodayPlan:    boolean
  plan:               string
  compact?:           boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// ─── Compact mode ─────────────────────────────────────────────────────────────

function CompactCounter({
  streakState,
  postedTodayPublish,
}: Pick<Props, 'streakState' | 'postedTodayPublish'>) {
  const active = isStreakActive(streakState.publish_last_date, streakState.freeze_active_until)

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Flame
          size={22}
          className={active ? 'text-[#1D9E75]' : 'text-gray-300'}
          fill={active ? '#1D9E75' : 'transparent'}
        />
        {/* Status dot */}
        {postedTodayPublish ? (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
        ) : streakState.publish_streak > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white" />
        ) : null}
      </div>
      <span className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
        {streakState.publish_streak}
      </span>
      <span className="text-sm text-gray-500">day streak</span>
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color = '#1D9E75' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ─── Small streak card (engage / plan) ───────────────────────────────────────

interface SmallCardProps {
  emoji:     string
  streak:    number
  best:      number
  label:     string
  locked:    boolean
  posted:    boolean
}

function SmallStreakCard({ emoji, streak, best, label, locked, posted }: SmallCardProps) {
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 flex-1 min-w-0 shadow-sm">
      {locked && (
        <div className="absolute inset-0 rounded-xl bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 gap-1">
          <Lock size={16} className="text-gray-400" />
          <span className="text-[11px] font-semibold text-gray-400">Starter plan</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{emoji}</span>
        {posted && (
          <span className="w-2 h-2 rounded-full bg-green-500" />
        )}
      </div>
      <div className="tabular-nums font-bold text-3xl text-gray-900 leading-none">{streak}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
      <div className="text-[11px] text-gray-400 mt-2">Best: {best}</div>
    </div>
  )
}

// ─── Full mode — primary publish card ─────────────────────────────────────────

function PublishCard({
  streakState,
  postedTodayPublish,
  plan,
}: Pick<Props, 'streakState' | 'postedTodayPublish' | 'plan'>) {
  const {
    publish_streak,
    publish_best,
    grace_days_remaining,
    freeze_count,
    freeze_active_until,
    publish_last_date,
  } = streakState

  const active   = isStreakActive(publish_last_date, freeze_active_until)
  const next     = getNextMilestone(publish_streak)
  const isPro    = ['pro', 'agency'].includes(plan)
  const freezeOn = freeze_active_until && new Date(freeze_active_until) > new Date()

  // Status badge
  let badge: { text: string; classes: string }
  if (postedTodayPublish) {
    badge = { text: 'Posted today ✓', classes: 'bg-green-50 text-green-700 border-green-200' }
  } else if (publish_streak === 0) {
    badge = { text: 'Start your streak →', classes: 'bg-[#1D9E75]/10 text-[#1D9E75] border-[#1D9E75]/20' }
  } else {
    badge = { text: 'Post today to keep it going', classes: 'bg-amber-50 text-amber-700 border-amber-200' }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex-1">
      {/* Flame with pulse animation if at risk */}
      <div className="flex items-start justify-between mb-4">
        <span
          className={[
            'text-5xl select-none',
            !postedTodayPublish && publish_streak > 0 && active
              ? 'animate-pulse'
              : '',
          ].join(' ')}
        >
          🔥
        </span>
        {/* Freeze badge */}
        {isPro && freezeOn && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200">
            <Snowflake size={11} />
            Freeze active until {formatDate(freeze_active_until!)}
          </span>
        )}
      </div>

      {/* Giant number */}
      <div className="tabular-nums font-bold leading-none mb-1" style={{ fontSize: 64 }}>
        {publish_streak}
      </div>
      <div className="text-sm text-gray-400 mb-1">day streak</div>
      <div className="text-[11px] text-gray-400 mb-4">Best: {publish_best}</div>

      {/* Status badge */}
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold border mb-5 ${badge.classes}`}>
        {badge.text}
      </span>

      {/* Next milestone progress */}
      <div className="mb-4">
        {next ? (
          <>
            <div className="flex justify-between text-[12px] text-gray-500 mb-1.5">
              <span>{publish_streak} / {next.days} days</span>
              <span>{next.days - publish_streak} days to {next.label}</span>
            </div>
            <ProgressBar value={publish_streak} max={next.days} />
          </>
        ) : (
          <div className="text-[13px] font-semibold text-[#C9A84C]">
            You&apos;ve reached the top! 👑
          </div>
        )}
      </div>

      {/* Grace day indicator */}
      {publish_streak > 0 && !postedTodayPublish && (
        <div className="mt-3">
          {grace_days_remaining > 0 ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-700 font-medium">
              Grace day available — miss today and use it tomorrow
            </div>
          ) : (
            <p className="text-[11px] text-gray-400">No grace days remaining this month</p>
          )}
        </div>
      )}

      {/* Freeze indicator for Pro */}
      {isPro && !freezeOn && (
        <div className="mt-3 flex items-center gap-1.5 text-[12px] text-gray-400">
          <Snowflake size={13} />
          {freeze_count > 0
            ? <span className="font-medium text-blue-600">{freeze_count} freeze{freeze_count > 1 ? 's' : ''} available</span>
            : <span>No streak freezes available</span>
          }
        </div>
      )}
    </div>
  )
}

// ─── Full mode ────────────────────────────────────────────────────────────────

function FullCounter({
  streakState,
  postedTodayPublish,
  postedTodayEngage,
  postedTodayPlan,
  plan,
}: Omit<Props, 'compact'>) {
  const isStarter = plan !== 'free'

  return (
    <div className="flex gap-4 items-stretch">
      {/* Card 1 — Publishing (primary) */}
      <PublishCard
        streakState={streakState}
        postedTodayPublish={postedTodayPublish}
        plan={plan}
      />

      {/* Cards 2 & 3 side by side */}
      <div className="flex flex-col gap-4 w-56 shrink-0">
        <SmallStreakCard
          emoji="💬"
          streak={streakState.engage_streak}
          best={streakState.engage_best}
          label="comment streak"
          locked={!isStarter}
          posted={postedTodayEngage}
        />
        <SmallStreakCard
          emoji="✍️"
          streak={streakState.plan_streak}
          best={streakState.plan_best}
          label="creation streak"
          locked={!isStarter}
          posted={postedTodayPlan}
        />
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function StreakCounter({
  streakState,
  postedTodayPublish,
  postedTodayEngage,
  postedTodayPlan,
  plan,
  compact = false,
}: Props) {
  if (compact) {
    return (
      <CompactCounter
        streakState={streakState}
        postedTodayPublish={postedTodayPublish}
      />
    )
  }

  return (
    <FullCounter
      streakState={streakState}
      postedTodayPublish={postedTodayPublish}
      postedTodayEngage={postedTodayEngage}
      postedTodayPlan={postedTodayPlan}
      plan={plan}
    />
  )
}
