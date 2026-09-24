'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, Zap, Star, PartyPopper, ArrowRight, Plus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fadeIn, EASE_CURVE } from '@/lib/motion'
import { useGamification } from '@/components/gamification/GamificationProvider'
import type {
  DailyTaskWithTemplate, CompleteTaskResponse, UserStreak,
} from '@/lib/tasks/types'
import type { FlashcardWithSubject } from '@/lib/flashcards/types'
import type { Exam, PlannerTask } from '@/lib/planner/types'
import {
  computeNextAction, mergeTodayTasks,
  type NextAction, type TodayTask,
} from '@/lib/dashboard/command-center'
import type { LearningScoreResponse } from '@/lib/dashboard/learning-score'

function greetingFor(hour: number) {
  if (hour >= 6 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 18) return 'Good afternoon'
  return 'Good evening'
}

interface ReviewHint { topicTitle: string | null; estimatedMinutes: number }
interface ContinueLearning {
  subjectId: string; subjectName: string; subjectIcon: string; subjectColor: string
  topicId: string; topicTitle: string
  progressPct: number
  lastStudiedLabel: string
}
interface MonthlyStats { focusMinutes: number; topicsReviewed: number; reviewConsistencyPct: number }

interface CommandCenterData {
  tasks:             DailyTaskWithTemplate[]
  plannerTasks:      PlannerTask[]
  streak:            UserStreak
  todayMinutes:      number
  reviewsDueToday:   number
  reviewsDoneToday:  number
  reviewHint:        ReviewHint | null
  continueLearning:  ContinueLearning | null
  monthly:           MonthlyStats
  displayName:       string
  flashcards:        FlashcardWithSubject[]
  exams:             Exam[]
  learningScore:     LearningScoreResponse
}

const EMPTY_LEARNING_SCORE: LearningScoreResponse = {
  score: 0, change: 0,
  breakdown: { focus: 0, recall: 0, completion: 0, consistency: 0 },
}

const EMPTY_STREAK: UserStreak = {
  user_id: '', current_streak: 0, longest_streak: 0, last_streak_date: null, updated_at: '',
}

// ── Presentation helpers ──────────────────
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

function relativeDays(days: number): string {
  if (days <= 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `${days} days`
}

/**
 * Splits the chosen next action into a title + "subject · duration" line.
 * Which action wins is still decided by computeNextAction().
 */
function nextActionDisplay(
  action: NextAction,
  ctx: {
    reviewsDue:  number
    reviewHint:  ReviewHint | null
    nearestExam: { name: string; daysAway: number } | null
    task:        TodayTask | null
  },
): { title: string; meta: string } {
  switch (action.kind) {
    case 'review': {
      const minutes = ctx.reviewHint?.estimatedMinutes ?? 10
      return {
        title: ctx.reviewHint?.topicTitle ? `Review ${ctx.reviewHint.topicTitle}` : 'Review your cards',
        meta:  `Recall · ${ctx.reviewsDue} ${plural(ctx.reviewsDue, 'card', 'cards')} · ~${minutes} min`,
      }
    }
    case 'exam':
      return {
        title: `Prepare for ${ctx.nearestExam?.name ?? 'your exam'}`,
        meta:  `Exam · ${relativeDays(ctx.nearestExam?.daysAway ?? 0)}`,
      }
    case 'task':
      return ctx.task
        ? { title: ctx.task.title, meta: `${ctx.task.subject} · ${ctx.task.minutes} min` }
        : { title: action.text, meta: '' }
    case 'focus':
      return { title: 'Start a focus session', meta: 'Nothing studied yet today' }
    case 'plan':
      return { title: 'Plan tomorrow', meta: 'Today’s work is done' }
  }
}

/** Written uppercase on purpose — CSS `uppercase` under lang="tr" turns i into İ. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium tracking-[0.08em] text-text-muted">{children}</p>
}

// ── XP Toast ──────────────────────────────
// Sits above the Assist button (and the mobile tab bar) instead of on top of it.
function XpToast({ data, onClose }: { data: CompleteTaskResponse; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: EASE_CURVE }}
      className="fixed bottom-36 right-4 lg:bottom-20 lg:right-6 z-50"
    >
      <div className="bg-dark-base text-dark-text border border-dark-border rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 min-w-[220px]">
        <div className="size-8 rounded-md bg-white/[0.08] flex items-center justify-center shrink-0">
          {data.level_up ? <Star className="size-4 text-dark-accent" /> : <Zap className="size-4 text-dark-accent" />}
        </div>
        <div>
          {data.level_up && <p className="text-xs font-semibold text-dark-accent">SEVİYE ATLADI!</p>}
          <p className="text-base font-medium">
            +<span className="tabular">{data.xp_earned + data.bonus_xp}</span> XP kazandın
          </p>
          {data.all_completed && (
            <p className="text-xs text-dark-text-secondary flex items-center gap-1 mt-0.5">
              <PartyPopper className="size-3" /> Tüm görevler tamam!
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Skeleton ──────────────────────────────
function Skeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="h-8 w-64 rounded-md skeleton-shimmer" />
      <div className="h-4 w-80 max-w-full rounded-md skeleton-shimmer mt-2 mb-8" />
      <div className="h-[76px] rounded-lg skeleton-shimmer" />
      <div className="h-4 w-96 max-w-full rounded-md skeleton-shimmer my-5" />
      <div className="mt-8 space-y-3">
        {[0, 1, 2].map(i => <div key={i} className="h-9 rounded-md skeleton-shimmer" />)}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────
export default function CommandCenter() {
  const { notify } = useGamification()
  const [data, setData]           = useState<CommandCenterData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)
  const [toast, setToast]         = useState<CompleteTaskResponse | null>(null)

  const load = useCallback(async () => {
    try {
      const [ccRes, settingsRes, flashRes, examsRes, scoreRes] = await Promise.all([
        fetch('/api/dashboard/command-center'),
        fetch('/api/settings'),
        fetch('/api/flashcards'),
        fetch('/api/exams?upcoming=1&limit=3'),
        fetch('/api/learning-score'),
      ])
      const [ccJson, settingsJson, flashJson, examsJson, scoreJson] = await Promise.all([
        ccRes.ok ? ccRes.json() : {
          tasks: [], plannerTasks: [], userStreak: null, todayMinutes: 0,
          reviewsDueToday: 0, reviewsDoneToday: 0, reviewHint: null, continueLearning: null,
          monthly: { focusMinutes: 0, topicsReviewed: 0, reviewConsistencyPct: 0 },
        },
        settingsRes.ok ? settingsRes.json() : { ad: '' },
        flashRes.ok ? flashRes.json() : { flashcards: [] },
        examsRes.ok ? examsRes.json() : { exams: [] },
        scoreRes.ok ? scoreRes.json() : EMPTY_LEARNING_SCORE,
      ])

      setData({
        tasks:            ccJson.tasks ?? [],
        plannerTasks:     ccJson.plannerTasks ?? [],
        streak:           ccJson.userStreak ?? EMPTY_STREAK,
        todayMinutes:     ccJson.todayMinutes ?? 0,
        reviewsDueToday:  ccJson.reviewsDueToday ?? 0,
        reviewsDoneToday: ccJson.reviewsDoneToday ?? 0,
        reviewHint:       ccJson.reviewHint ?? null,
        continueLearning: ccJson.continueLearning ?? null,
        monthly:          ccJson.monthly ?? { focusMinutes: 0, topicsReviewed: 0, reviewConsistencyPct: 0 },
        displayName:      (settingsJson.ad || '').trim(),
        flashcards:       flashJson.flashcards ?? [],
        exams:            examsJson.exams ?? [],
        learningScore:    scoreJson.score !== undefined ? scoreJson : EMPTY_LEARNING_SCORE,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleComplete(task: TodayTask) {
    if (completing) return
    setCompleting(task.id)
    try {
      if (task.source === 'system') {
        const res = await fetch('/api/tasks/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: task.id }),
        })
        const json: CompleteTaskResponse & { new_achievements?: string[] } = await res.json()
        if (res.ok) {
          setToast(json)
          notify({ newAchievements: json.new_achievements ?? [], levelUp: json.level_up, newLevel: json.level })
        }
      } else {
        // Planner tasks have no XP/level system of their own (matches
        // how completing them works from the Planner tab itself).
        await fetch(`/api/planner/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true }),
        })
      }

      // Refresh everything (streak/score/merged task list all shift)
      load()
    } finally {
      setCompleting(null)
    }
  }

  if (loading || !data) return <Skeleton />

  const {
    tasks, plannerTasks, streak, todayMinutes, reviewsDueToday,
    reviewHint, continueLearning, monthly, displayName, flashcards, exams,
    learningScore,
  } = data

  const todayTasks = mergeTodayTasks(tasks, plannerTasks)
  const done    = todayTasks.filter(t => t.completed).length
  const total   = todayTasks.length
  const now     = new Date()
  const hour    = now.getHours()
  const firstName = displayName.split(' ')[0] || 'Student'
  const today   = now.toISOString().split('T')[0]

  const plannedMinutes = todayTasks.reduce((sum, t) => sum + t.minutes, 0)
  const showWeeklyReview = now.getDay() === 0 || learningScore.breakdown.consistency >= 100

  // todayTasks is already priority-sorted (High Planner task first), so
  // this naturally surfaces one ahead of a merely-medium system task.
  const firstIncomplete = todayTasks.find(t => !t.completed) ?? null
  const firstIncompleteForAction = firstIncomplete ? {
    id: firstIncomplete.id,
    subject: firstIncomplete.subject,
    title: firstIncomplete.title,
  } : null

  const daysUntil = (date: string) =>
    Math.round((new Date(date + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86_400_000)

  const nearestExam = exams.length > 0 ? {
    name: exams[0].name,
    daysAway: daysUntil(exams[0].exam_date),
  } : null

  const nextAction = computeNextAction({
    reviewsDue: reviewsDueToday,
    reviewHint,
    nearestExam,
    firstIncompleteTask: firstIncompleteForAction,
    todayMinutes,
  })
  const action = nextActionDisplay(nextAction, {
    reviewsDue: reviewsDueToday, reviewHint, nearestExam, task: firstIncomplete,
  })

  const monthH = Math.floor(monthly.focusMinutes / 60)
  const monthM = monthly.focusMinutes % 60

  const upcomingCards = flashcards
    .slice()
    .sort((a, b) => a.next_review_date.localeCompare(b.next_review_date))
    .slice(0, 3)
  const hasUpcoming = exams.length > 0 || upcomingCards.length > 0

  const dateLabel = `${now.toLocaleDateString('en-GB', { weekday: 'long' })}, ${now.getDate()} ${now.toLocaleDateString('en-GB', { month: 'long' })}`

  return (
    <motion.div {...fadeIn} className="max-w-3xl mx-auto">
      {/* 1. GREETING — plain text on the page background */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text">
          {greetingFor(hour)}, {firstName}.
        </h1>
        <p className="text-base text-text-secondary mt-1">
          {dateLabel} · Here&apos;s what matters today.
        </p>
      </div>

      {/* 2. NEXT ACTION */}
      <div className="flex items-center justify-between gap-4 rounded-lg bg-accent-soft border border-[rgba(49,92,255,0.15)] border-l-[3px] border-l-accent px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-[0.08em] text-accent">NEXT ACTION</p>
          <p className="text-[16px] leading-6 font-semibold text-text truncate mt-1">{action.title}</p>
          {action.meta && <p className="text-sm text-text-secondary truncate">{action.meta}</p>}
        </div>
        <Link
          href={nextAction.href}
          className="shrink-0 inline-flex items-center gap-1.5 bg-accent hover:bg-accent-dark text-white rounded-md px-4 py-2 text-base font-medium transition-colors duration-[160ms]"
        >
          Start <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* 3. TODAY STATS — one line, no cards */}
      <p className="my-5 text-base text-text-secondary flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span><span className="tabular text-text">{total}</span> {plural(total, 'task', 'tasks')}</span>
        <span aria-hidden>·</span>
        <span><span className="tabular text-text">{plannedMinutes}</span> min</span>
        <span aria-hidden>·</span>
        <span><span className="tabular text-text">{reviewsDueToday}</span> {plural(reviewsDueToday, 'review', 'reviews')}</span>
        <span aria-hidden>·</span>
        <span>
          Learning Score: <span className="tabular text-text">{learningScore.score}</span>
          {learningScore.change !== 0 && (
            <span className={cn('tabular text-sm ml-1', learningScore.change > 0 ? 'text-success' : 'text-danger')}>
              {learningScore.change > 0 ? '+' : ''}{learningScore.change}
            </span>
          )}
        </span>
      </p>

      {/* 4. TODAY'S PLAN — rows with dividers, no card wrapper */}
      <section className="mt-8">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <SectionLabel>TODAY&apos;S PLAN</SectionLabel>
          <span className="tabular text-sm text-text-secondary">{done} / {total}</span>
        </div>

        <ul>
          {todayTasks.map((task, i) => {
            const busy = completing === task.id
            return (
              <li key={task.id} className="border-b border-border">
                <button
                  type="button"
                  onClick={() => !task.completed && !busy && handleComplete(task)}
                  disabled={task.completed || busy}
                  aria-label={task.completed ? `${task.title} — tamamlandı` : `${task.title} — tamamlandı olarak işaretle`}
                  className={cn(
                    'group w-full h-12 flex items-center gap-3 text-left',
                    task.completed ? 'cursor-default' : busy ? 'cursor-wait' : 'cursor-pointer',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'size-4 shrink-0 rounded-sm border flex items-center justify-center transition-colors duration-200',
                      task.completed
                        ? 'bg-accent border-accent'
                        : 'bg-surface border-border-strong group-hover:border-accent',
                    )}
                  >
                    {busy
                      ? <Loader2 className="size-3 text-accent animate-spin" />
                      : task.completed && <Check className="size-3 text-white" strokeWidth={3} />}
                  </span>
                  <span className="tabular text-sm text-text-muted w-5 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={cn(
                    'flex-1 min-w-0 truncate text-base font-medium transition-colors duration-200',
                    task.completed ? 'line-through text-text-muted' : 'text-text',
                  )}>
                    {task.title}
                  </span>
                  {task.source === 'planner' && (
                    <span className="shrink-0 max-w-[140px] truncate rounded-sm bg-accent-soft text-accent text-[11px] font-medium px-1.5 py-0.5">
                      {task.subject}
                    </span>
                  )}
                  <span className="tabular text-sm text-text-muted shrink-0">{task.minutes} min</span>
                </button>
              </li>
            )
          })}
        </ul>

        {todayTasks.length === 0 && (
          <p className="text-sm text-text-muted py-4 border-b border-border">
            No tasks yet — they&apos;ll appear here automatically.
          </p>
        )}

        <Link
          href="/dashboard/planner"
          className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-text-secondary hover:text-accent transition-colors duration-[160ms]"
        >
          <Plus className="size-3.5" /> Add task
        </Link>
      </section>

      {/* 5. CONTINUE LEARNING — omitted entirely if no session history */}
      {continueLearning && (
        <section className="mt-8 flex items-center justify-between gap-4 py-4 border-y border-border">
          <div className="min-w-0">
            <p className="text-sm text-text-secondary">Continue where you left off</p>
            <div className="flex items-center gap-3 mt-1 min-w-0">
              <p className="text-base font-medium text-text truncate">
                {continueLearning.subjectIcon} {continueLearning.subjectName}
                <span className="text-text-muted"> → </span>
                {continueLearning.topicTitle}
              </p>
              <div className="w-[120px] h-1 rounded-full bg-border overflow-hidden shrink-0">
                <div
                  className={cn('h-full rounded-full', continueLearning.progressPct >= 100 ? 'bg-success' : 'bg-accent')}
                  style={{ width: `${continueLearning.progressPct}%` }}
                />
              </div>
              <span className="tabular text-sm text-text-muted shrink-0">{continueLearning.progressPct}%</span>
            </div>
            <p className="text-sm text-text-muted mt-0.5">{continueLearning.lastStudiedLabel}</p>
          </div>
          <Link
            href={`/dashboard/focus?subjectId=${continueLearning.subjectId}&topicId=${continueLearning.topicId}`}
            className="shrink-0 text-base font-medium text-accent hover:text-accent-dark transition-colors duration-[160ms]"
          >
            Continue →
          </Link>
        </section>
      )}

      {/* 6. LEARNING STREAK */}
      <section className={cn('py-4 border-b border-border', !continueLearning && 'mt-8 border-t')}>
        <p className="text-base font-medium text-text">
          🔥 <span className="tabular">{streak.current_streak}</span> {plural(streak.current_streak, 'day', 'days')} streak
        </p>
        <p className="text-sm text-text-secondary mt-0.5">
          <span className="tabular">{monthH}</span>h <span className="tabular">{monthM}</span>m this month
          {' · '}<span className="tabular">{monthly.topicsReviewed}</span> topics reviewed
          {' · '}<span className="tabular">{monthly.reviewConsistencyPct}%</span> consistency
        </p>
      </section>

      {/* Weekly Review — Sundays, or once 7 days straight are active */}
      {showWeeklyReview && (
        <Link
          href="/dashboard/insights/weekly-review"
          className="group flex items-center justify-between gap-3 py-4 border-b border-border"
        >
          <span className="flex items-center gap-2 text-base font-medium text-text">
            <Sparkles className="size-4 text-accent" />
            Your weekly review is ready
          </span>
          <ArrowRight className="size-4 text-text-muted group-hover:text-accent transition-colors duration-[160ms]" />
        </Link>
      )}

      {/* 7. UPCOMING — only when there's something to show */}
      {hasUpcoming && (
        <section className="mt-8">
          <div className="pb-2 border-b border-border">
            <SectionLabel>UPCOMING</SectionLabel>
          </div>
          <ul>
            {exams.map(exam => {
              const days = daysUntil(exam.exam_date)
              const date = new Date(exam.exam_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return (
                <li key={exam.id} className="flex items-center justify-between gap-3 h-11 border-b border-border">
                  <span className="text-base text-text truncate">{exam.name}</span>
                  <span className="tabular-nums text-sm text-text-secondary shrink-0">
                    {date} · <span className={cn(days <= 3 && 'text-warning')}>{relativeDays(days)}</span>
                  </span>
                </li>
              )
            })}
            {upcomingCards.map(card => {
              const due = card.next_review_date <= today
              return (
                <li key={card.id} className="flex items-center justify-between gap-3 h-11 border-b border-border">
                  <span className="text-base text-text truncate">
                    <span className="text-text-secondary">Review:</span> {card.front}
                  </span>
                  <span className={cn('tabular-nums text-sm shrink-0', due ? 'text-warning' : 'text-text-secondary')}>
                    {due ? 'Due now' : relativeDays(daysUntil(card.next_review_date))}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* XP Toast */}
      <AnimatePresence>
        {toast && <XpToast data={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </motion.div>
  )
}
