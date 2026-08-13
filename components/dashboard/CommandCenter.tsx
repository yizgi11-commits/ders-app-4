'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame, CheckCircle2, Circle, Loader2, Zap, PartyPopper, Star,
  Clock, Percent, Timer, Plus, Brain, CalendarClock, ArrowRight, GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGamification } from '@/components/gamification/GamificationProvider'
import type {
  DailyTaskWithTemplate, CompleteTaskResponse, UserStreak, Difficulty,
} from '@/lib/tasks/types'
import type { FlashcardWithSubject } from '@/lib/flashcards/types'
import type { Exam } from '@/lib/planner/types'

const ESTIMATED_MINUTES: Record<Difficulty, number> = { 1: 25, 2: 45, 3: 60 }

function greetingFor(hour: number) {
  if (hour >= 6 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 18) return 'Good afternoon'
  return 'Good evening'
}

interface CommandCenterData {
  tasks:        DailyTaskWithTemplate[]
  streak:       UserStreak
  todayMinutes: number
  displayName:  string
  flashcards:   FlashcardWithSubject[]
  exams:        Exam[]
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

// ── Stat tile ─────────────────────────────
const STAT_COLORS = {
  indigo:  { bg: 'bg-indigo-50/80',  border: 'border-indigo-100',  icon: 'text-indigo-600',  ring: 'ring-indigo-100' },
  emerald: { bg: 'bg-emerald-50/80', border: 'border-emerald-100', icon: 'text-emerald-600', ring: 'ring-emerald-100' },
  orange:  { bg: 'bg-orange-50/80',  border: 'border-orange-100',  icon: 'text-orange-600',  ring: 'ring-orange-100' },
} as const

function StatTile({ icon: Icon, color, value, label }: {
  icon: React.ElementType; color: keyof typeof STAT_COLORS; value: string; label: string
}) {
  const c = STAT_COLORS[color]
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn('bg-white rounded-2xl border p-4 flex flex-col gap-3 shadow-sm', c.border)}
    >
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center ring-1', c.bg, c.ring)}>
        <Icon className={cn('w-4 h-4', c.icon)} />
      </div>
      <div>
        <p className="text-xl font-black text-gray-900 tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
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

// ── Skeleton ──────────────────────────────
function Skeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="h-14 rounded-2xl skeleton-shimmer" />
      <div className="h-24 rounded-2xl skeleton-shimmer" />
      <div className="h-56 rounded-2xl skeleton-shimmer" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => <div key={i} className="h-24 rounded-2xl skeleton-shimmer" />)}
      </div>
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
      const [tasksRes, statsRes, settingsRes, flashRes, examsRes] = await Promise.all([
        fetch('/api/tasks/today'),
        fetch('/api/dashboard/stats'),
        fetch('/api/settings'),
        fetch('/api/flashcards'),
        fetch('/api/exams?upcoming=1&limit=3'),
      ])
      const [tasksJson, statsJson, settingsJson, flashJson, examsJson] = await Promise.all([
        tasksRes.ok ? tasksRes.json() : { tasks: [], userStreak: null },
        statsRes.ok ? statsRes.json() : { todayHours: 0 },
        settingsRes.ok ? settingsRes.json() : { ad: '' },
        flashRes.ok ? flashRes.json() : { flashcards: [] },
        examsRes.ok ? examsRes.json() : { exams: [] },
      ])

      setData({
        tasks:        tasksJson.tasks ?? [],
        streak:       tasksJson.userStreak ?? EMPTY_STREAK,
        todayMinutes: Math.round((statsJson.todayHours ?? 0) * 60),
        displayName:  (settingsJson.ad || '').trim(),
        flashcards:   flashJson.flashcards ?? [],
        exams:        examsJson.exams ?? [],
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

      // Refresh streak + focus stats in the background
      load()
    } finally {
      setCompleting(null)
    }
  }

  if (loading || !data) return <Skeleton />

  const { tasks, streak, todayMinutes, displayName, flashcards, exams } = data
  const done         = tasks.filter(t => t.completed).length
  const total        = tasks.length
  const pending      = total - done
  const pct          = total > 0 ? Math.round((done / total) * 100) : 0
  const priorityTask = tasks.find(t => !t.completed) ?? tasks[0]
  const hour         = new Date().getHours()
  const firstName    = displayName.split(' ')[0] || 'Student'
  const focusH       = Math.floor(todayMinutes / 60)
  const focusM       = todayMinutes % 60
  const today        = new Date().toISOString().split('T')[0]
  const upcomingCards = flashcards
    .slice()
    .sort((a, b) => a.next_review_date.localeCompare(b.next_review_date))
    .slice(0, 3)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* 1. HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {greetingFor(hour)}, {firstName}.
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total === 0
              ? "No priorities set for today yet."
              : pending === 0
              ? "You're all caught up today."
              : `You have ${pending} ${pending === 1 ? 'priority' : 'priorities'} today.`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full px-3 py-1.5 shrink-0">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-sm font-bold text-orange-600 whitespace-nowrap">
            {streak.current_streak} day streak
          </span>
        </div>
      </motion.div>

      {/* 2. TODAY'S DIRECTION */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30, delay: 0.05 }}
        className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200/50"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70 mb-2">
          Today&apos;s Direction
        </p>
        {priorityTask ? (
          <p className="text-lg font-bold leading-snug">
            {priorityTask.task_templates.subject} — {priorityTask.task_templates.title}
            <span className="text-white/70 font-medium">
              {' '}| {ESTIMATED_MINUTES[priorityTask.task_templates.difficulty]} min planned
            </span>
          </p>
        ) : (
          <p className="text-lg font-bold">All priorities completed today 🎉</p>
        )}
      </motion.div>

      {/* 3. TODAY'S TASKS */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30, delay: 0.1 }}
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

      {/* 4. DAILY STATS */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={Clock}   color="indigo"  value={`${focusH}h ${focusM}m`} label="Focus" />
        <StatTile icon={Percent} color="emerald" value={`${pct}%`}               label="Completion" />
        <StatTile icon={Flame}   color="orange"  value={`${streak.current_streak}`} label="Day Streak" />
      </div>

      {/* 5. QUICK ACTIONS */}
      <div className="grid grid-cols-3 gap-3">
        <QuickAction href="/dashboard/focus"   icon={Timer} label="Start Focus" primary />
        <QuickAction href="/dashboard/planner" icon={Plus}  label="Add Task" />
        <QuickAction href="/dashboard/recall"  icon={Brain} label="Start Recall" />
      </div>

      {/* 6. UPCOMING */}
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
