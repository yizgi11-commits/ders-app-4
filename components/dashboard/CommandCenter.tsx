'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame, CheckCircle2, Circle, Loader2, Zap, PartyPopper, Star,
  Timer, Plus, Brain, CalendarClock, ArrowRight, GraduationCap,
  BookOpen, CalendarDays, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGamification } from '@/components/gamification/GamificationProvider'
import type {
  DailyTaskWithTemplate, CompleteTaskResponse, UserStreak, Difficulty,
} from '@/lib/tasks/types'
import type { FlashcardWithSubject } from '@/lib/flashcards/types'
import type { Exam } from '@/lib/planner/types'
import {
  computeNextAction, startSessionHref,
  type NextAction,
} from '@/lib/dashboard/command-center'
import type { LearningScoreResponse } from '@/lib/dashboard/learning-score'

const ESTIMATED_MINUTES: Record<Difficulty, number> = { 1: 25, 2: 45, 3: 60 }

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

// ── XP Toast ──────────────────────────────
function XpToast({ data, onClose }: { data: CompleteTaskResponse; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <div className="bg-gray-900 text-white rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-3 min-w-[220px] border border-white/10">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
          className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center shrink-0"
        >
          {data.level_up ? <Star className="w-5 h-5 text-yellow-900" /> : <Zap className="w-5 h-5 text-yellow-900" />}
        </motion.div>
        <div>
          {data.level_up && <p className="text-xs text-yellow-400 font-bold">SEVİYE ATLADI! 🎉</p>}
          <p className="text-sm font-bold">+{data.xp_earned + data.bonus_xp} XP kazandın</p>
          {data.all_completed && (
            <p className="text-xs text-green-400 font-semibold flex items-center gap-1 mt-0.5">
              <PartyPopper className="w-3 h-3" /> Tüm görevler tamam!
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Quick action button ───────────────────
function QuickAction({ href, icon: Icon, label, primary }: {
  href: string; icon: React.ElementType; label: string; primary?: boolean
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold border transition-colors',
          primary
            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-md shadow-indigo-200/50'
            : 'bg-white text-gray-700 border-border hover:border-indigo-200 hover:bg-indigo-50/30'
        )}
      >
        <Icon className="w-4 h-4" />
        {label}
      </motion.div>
    </Link>
  )
}

const NEXT_ACTION_ICON: Record<NextAction['kind'], React.ElementType> = {
  review: Brain, exam: GraduationCap, task: BookOpen, focus: Timer, plan: CalendarDays,
}

function scoreTone(score: number) {
  if (score >= 75) return 'text-emerald-300'
  if (score >= 40) return 'text-amber-300'
  return 'text-white/70'
}

// ── Skeleton ──────────────────────────────
function Skeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="h-10 rounded-2xl skeleton-shimmer" />
      <div className="h-40 rounded-2xl skeleton-shimmer" />
      <div className="h-24 rounded-2xl skeleton-shimmer" />
      <div className="h-32 rounded-2xl skeleton-shimmer" />
      <div className="h-56 rounded-2xl skeleton-shimmer" />
      <div className="h-24 rounded-2xl skeleton-shimmer" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => <div key={i} className="h-12 rounded-xl skeleton-shimmer" />)}
      </div>
      <div className="h-32 rounded-2xl skeleton-shimmer" />
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
          tasks: [], userStreak: null, todayMinutes: 0,
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

  async function handleComplete(taskId: string) {
    if (completing) return
    setCompleting(taskId)
    try {
      const res = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      })
      const json: CompleteTaskResponse & { new_achievements?: string[] } = await res.json()
      if (!res.ok) return

      setData(prev => prev ? {
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: true, xp_earned: json.xp_earned } : t),
      } : prev)
      setToast(json)
      notify({ newAchievements: json.new_achievements ?? [], levelUp: json.level_up, newLevel: json.level })

      // Refresh everything (streak/score inputs all shift) in the background
      load()
    } finally {
      setCompleting(null)
    }
  }

  if (loading || !data) return <Skeleton />

  const {
    tasks, streak, todayMinutes, reviewsDueToday, reviewsDoneToday,
    reviewHint, continueLearning, monthly, displayName, flashcards, exams,
    learningScore,
  } = data

  const done    = tasks.filter(t => t.completed).length
  const total   = tasks.length
  const hour    = new Date().getHours()
  const firstName = displayName.split(' ')[0] || 'Student'
  const today   = new Date().toISOString().split('T')[0]

  const plannedMinutes = tasks.reduce((sum, t) => sum + ESTIMATED_MINUTES[t.task_templates.difficulty], 0)
  const showWeeklyReview = new Date().getDay() === 0 || learningScore.breakdown.consistency >= 100

  const firstIncomplete = tasks.find(t => !t.completed) ?? null
  const firstIncompleteForAction = firstIncomplete ? {
    id: firstIncomplete.id,
    subject: firstIncomplete.task_templates.subject,
    title: firstIncomplete.task_templates.title,
  } : null

  const nearestExam = exams.length > 0 ? {
    name: exams[0].name,
    daysAway: Math.round(
      (new Date(exams[0].exam_date + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86_400_000
    ),
  } : null

  const nextAction = computeNextAction({
    reviewsDue: reviewsDueToday,
    reviewHint,
    nearestExam,
    firstIncompleteTask: firstIncompleteForAction,
    todayMinutes,
  })
  const NextActionIcon = NEXT_ACTION_ICON[nextAction.kind]

  const startHref = startSessionHref(reviewsDueToday, firstIncomplete?.id ?? null)

  const monthH = Math.floor(monthly.focusMinutes / 60)
  const monthM = monthly.focusMinutes % 60

  const upcomingCards = flashcards
    .slice()
    .sort((a, b) => a.next_review_date.localeCompare(b.next_review_date))
    .slice(0, 3)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          {greetingFor(hour)}, {firstName}.
        </h1>
      </motion.div>

      {/* 1. TODAY'S LEARNING */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30, delay: 0.05 }}
        className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-5 shadow-lg"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <p className="relative text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 mb-3">
          Today&apos;s Learning
        </p>

        <div className="relative flex items-center gap-5 flex-wrap mb-4">
          <Stat value={total} label={total === 1 ? 'task' : 'tasks'} />
          <Divider />
          <Stat value={reviewsDueToday} label={reviewsDueToday === 1 ? 'review' : 'reviews'} />
          <Divider />
          <Stat value={plannedMinutes} label="min planned" />
        </div>

        <div className="relative flex items-center justify-between gap-4 pt-4 border-t border-white/10">
          <p className="text-sm font-semibold text-white/80">
            Learning Score: <span className={cn('font-black text-base', scoreTone(learningScore.score))}>{learningScore.score}</span>
            {learningScore.change !== 0 && (
              <span className={cn('ml-1.5 text-xs font-bold', learningScore.change > 0 ? 'text-emerald-300' : 'text-red-300')}>
                {learningScore.change > 0 ? '+' : ''}{learningScore.change}
              </span>
            )}
          </p>
          <Link href={startHref}>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-white text-gray-900 font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg"
            >
              Start Today&apos;s Session
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.div>
          </Link>
        </div>
      </motion.div>

      {/* 2. NEXT ACTION */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30, delay: 0.08 }}
        className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 shadow-lg shadow-indigo-200/50"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70 mb-3">
          Next Action
        </p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <NextActionIcon className="w-5 h-5 text-white" />
            </div>
            <p className="text-white font-bold text-base leading-snug min-w-0 truncate">
              {nextAction.text}
            </p>
          </div>
          <Link href={nextAction.href}>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors shrink-0"
            >
              Start <ArrowRight className="w-3.5 h-3.5" />
            </motion.div>
          </Link>
        </div>
      </motion.div>

      {/* 3. CONTINUE LEARNING — omitted entirely if no session history */}
      {continueLearning && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30, delay: 0.11 }}
          className="bg-white rounded-2xl border border-border p-5 shadow-sm"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Continue Where You Left Off
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `${continueLearning.subjectColor}15` }}
            >
              {continueLearning.subjectIcon}
            </div>
            <div className="flex-1 min-w-[180px]">
              <p className="text-xs font-semibold text-indigo-600">{continueLearning.subjectName}</p>
              <p className="text-base font-bold text-gray-900 truncate">{continueLearning.topicTitle}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[160px]">
                  <div
                    className={cn('h-full rounded-full', continueLearning.progressPct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500')}
                    style={{ width: `${continueLearning.progressPct}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-600">{continueLearning.progressPct}%</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">{continueLearning.lastStudiedLabel}</p>
            </div>
            <Link href={`/dashboard/focus?subjectId=${continueLearning.subjectId}&topicId=${continueLearning.topicId}`}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors shrink-0"
              >
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </motion.div>
            </Link>
          </div>
        </motion.div>
      )}

      {/* 4. TODAY'S TASKS */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30, delay: 0.14 }}
        className="bg-white rounded-2xl border border-border p-5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Today&apos;s Tasks</h2>
          <span className="text-xs text-muted-foreground">{done}/{total} done</span>
        </div>

        <ul className="flex flex-col gap-2 mb-4">
          <AnimatePresence mode="popLayout">
            {tasks.map((task, i) => {
              const tmpl = task.task_templates
              const busy = completing === task.id
              return (
                <motion.li
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => !task.completed && !busy && handleComplete(task.id)}
                  whileHover={!task.completed ? { x: 2 } : {}}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                    task.completed
                      ? 'bg-gray-50 border-gray-100 opacity-55 cursor-default'
                      : busy
                      ? 'bg-indigo-50/60 border-indigo-200 cursor-wait'
                      : 'bg-white border-border hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer'
                  )}
                >
                  <span className="text-xs font-mono text-muted-foreground/60 w-5 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {busy
                    ? <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                    : task.completed
                    ? <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    : <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                  }
                  <span className={cn(
                    'flex-1 min-w-0 text-sm font-medium truncate',
                    task.completed ? 'line-through text-muted-foreground' : 'text-gray-900'
                  )}>
                    {tmpl.title}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {ESTIMATED_MINUTES[tmpl.difficulty]} min
                  </span>
                </motion.li>
              )
            })}
          </AnimatePresence>

          {tasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tasks yet — they&apos;ll appear here automatically.
            </p>
          )}
        </ul>

        <Link href="/dashboard/focus">
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-bold text-sm py-2.5 rounded-xl"
          >
            Start Focus
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.div>
        </Link>
      </motion.div>

      {/* 5. DAILY STATS — Learning Streak */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30, delay: 0.17 }}
        className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 ring-1 ring-orange-100 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Learning Streak</p>
            <p className="text-xl font-black text-gray-900 tabular-nums">🔥 {streak.current_streak} days</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {monthH}h {monthM}m this month · {monthly.topicsReviewed} topics reviewed · {monthly.reviewConsistencyPct}% review consistency
            </p>
          </div>
        </div>
      </motion.div>

      {/* 5b. WEEKLY REVIEW — Sundays, or once 7 days straight are active */}
      {showWeeklyReview && (
        <Link href="/dashboard/insights/weekly-review">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30, delay: 0.19 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-between gap-3 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-violet-600" />
              </div>
              <p className="text-sm font-bold text-gray-900 truncate">Your weekly review is ready</p>
            </div>
            <ArrowRight className="w-4 h-4 text-violet-500 shrink-0" />
          </motion.div>
        </Link>
      )}

      {/* 6. QUICK ACTIONS */}
      <div className="grid grid-cols-3 gap-3">
        <QuickAction href="/dashboard/focus"   icon={Timer} label="Start Focus" primary />
        <QuickAction href="/dashboard/planner" icon={Plus}  label="Add Task" />
        <QuickAction href="/dashboard/recall"  icon={Brain} label="Start Recall" />
      </div>

      {/* 7. UPCOMING */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-indigo-500" />
          Upcoming
        </h2>
        <div className="flex flex-col gap-2">
          {upcomingCards.length > 0 ? upcomingCards.map(card => (
            <div
              key={card.id}
              className="flex items-center justify-between gap-3 text-sm p-2.5 rounded-lg bg-gray-50 border border-gray-100"
            >
              <span className="text-gray-700 truncate">{card.front}</span>
              <span className={cn(
                'text-xs font-medium shrink-0',
                card.next_review_date <= today ? 'text-amber-600' : 'text-muted-foreground'
              )}>
                {card.next_review_date <= today ? 'Due now' : card.next_review_date}
              </span>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">No flashcards due for review yet.</p>
          )}

          {exams.length > 0 ? exams.map(exam => {
            const days = Math.round((new Date(exam.exam_date + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000)
            return (
              <div
                key={exam.id}
                className="flex items-center justify-between gap-3 text-sm p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100"
              >
                <span className="flex items-center gap-2 text-gray-700 truncate">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  {exam.name}
                </span>
                <span className="text-xs font-medium text-indigo-600 shrink-0">
                  {days === 0 ? 'Today' : `${days} day${days !== 1 ? 's' : ''} away`}
                </span>
              </div>
            )
          }) : (
            <p className="text-xs text-muted-foreground/50 pt-1">No upcoming exams added yet.</p>
          )}
        </div>
      </div>

      {/* XP Toast */}
      <AnimatePresence>
        {toast && <XpToast data={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-2xl font-black text-white tabular-nums">{value}</span>
      <span className="text-xs text-white/50 font-medium">{label}</span>
    </div>
  )
}

function Divider() {
  return <span className="w-px h-6 bg-white/10" />
}
