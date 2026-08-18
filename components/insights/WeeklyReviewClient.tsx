'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Sparkles, AlertTriangle, ArrowRight, TrendingUp, TrendingDown, Brain,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WeeklyReview } from '@/lib/weeklyReview'
import type { SubscriptionTier } from '@/lib/subscription'
import ProLock from '@/components/subscription/ProLock'

function fmtFocus(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

function scoreTone(score: number) {
  if (score >= 75) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-gray-900'
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-xl font-black text-gray-900 tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  )
}

function Divider() {
  return <span className="w-px h-5 bg-border" />
}

export default function WeeklyReviewClient({ data, tier }: { data: WeeklyReview; tier: SubscriptionTier }) {
  const { totals, learningScore, wentWell, needsAttention, nextWeekFocus } = data

  const detail = (
    <>
      {/* ── What went well ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5"
      >
        <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> What went well
        </p>
        <ul className="space-y-1.5">
          {wentWell.map((line, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span> {line}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* ── What needs attention ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-amber-50/60 border border-amber-100 rounded-2xl p-5"
      >
        <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> What needs attention
        </p>
        <ul className="space-y-1.5">
          {needsAttention.map((line, i) => (
            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span> {line}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* ── Next week focus ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-indigo-500" /> Next Week Focus
        </p>
        {nextWeekFocus.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {nextWeekFocus.map(topic => (
              <li
                key={topic.topicId}
                className="flex items-center justify-between gap-3 text-sm p-2.5 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{topic.topicTitle}</p>
                  <p className="text-xs text-muted-foreground">{topic.subjectName}</p>
                </div>
                <span className="text-xs font-semibold text-amber-600 shrink-0">
                  {topic.overdueCount} gecikmiş
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Gecikmiş tekrar yok — güzel gidiyorsun.</p>
        )}
      </div>
    </>
  )

  // Plain preview of the CTA — used inside ProLock (Free), which is
  // itself a Link, so this can't be an interactive <Link> too.
  const ctaPreview = (
    <div className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-indigo-200/50">
      Build Next Week
      <ArrowRight className="w-4 h-4" />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* ── Stat row ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.14em] mb-3">
          Your Week
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <Stat value={fmtFocus(totals.focusMinutes)} label="Focus" />
          <Divider />
          <Stat value={String(totals.tasksCompleted)} label={totals.tasksCompleted === 1 ? 'task' : 'tasks'} />
          <Divider />
          <Stat value={String(totals.reviewsDone)} label={totals.reviewsDone === 1 ? 'review' : 'reviews'} />
          <Divider />
          <Stat value={String(totals.topicsStudied)} label={totals.topicsStudied === 1 ? 'topic' : 'topics'} />
        </div>
      </div>

      {/* ── Learning Score before → after ────────────────────── */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.14em] mb-3">
          Learning Score
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xl font-black text-gray-400 tabular-nums">{learningScore.previous}</span>
          <ArrowRight className="w-4 h-4 text-gray-300" />
          <span className={cn('text-3xl font-black tabular-nums', scoreTone(learningScore.current))}>{learningScore.current}</span>
          {learningScore.change !== 0 && (
            <span className={cn(
              'inline-flex items-center gap-0.5 text-xs font-bold',
              learningScore.change > 0 ? 'text-emerald-600' : 'text-red-500',
            )}>
              {learningScore.change > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {learningScore.change > 0 ? '+' : ''}{learningScore.change}
            </span>
          )}
        </div>
      </div>

      {tier === 'pro' ? (
        <>
          {detail}
          <Link href="/dashboard/planner">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-indigo-200/50"
            >
              Build Next Week
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </Link>
        </>
      ) : (
        <ProLock label="Detaylı rapor + Next Week Builder — Pro’da açılır">
          <div className="space-y-5">{detail}{ctaPreview}</div>
        </ProLock>
      )}
    </div>
  )
}
