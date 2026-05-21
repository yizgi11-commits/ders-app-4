'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, Loader2, Zap, PartyPopper, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DIFFICULTY_LABEL, DIFFICULTY_COLOR,
  type DailyTaskWithTemplate, type CompleteTaskResponse, type Difficulty,
} from '@/lib/tasks/types'
import { useGamification } from '@/components/gamification/GamificationProvider'

// ── Variants ──────────────────────────────
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
const rowVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 30 } },
  exit:   { opacity: 0, scale: 0.97, transition: { duration: 0.18 } },
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
          {data.bonus_xp > 0 && <p className="text-xs text-gray-400">Bonus +{data.bonus_xp} XP dahil</p>}
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

// ── Skeleton ──────────────────────────────
function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-36 rounded-lg skeleton-shimmer" />
          <div className="h-3 w-24 rounded-lg skeleton-shimmer" />
        </div>
      </div>
      <div className="h-1.5 rounded-full skeleton-shimmer" />
      {[1, 2, 3].map(i => (
        <div key={i} className="h-[72px] rounded-xl skeleton-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  )
}

// ── Main ──────────────────────────────────
export default function DailyTasks() {
  const { notify } = useGamification()
  const [tasks, setTasks]       = useState<DailyTaskWithTemplate[]>([])
  const [loading, setLoading]   = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)
  const [toast, setToast]       = useState<CompleteTaskResponse | null>(null)
  const [error, setError]       = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/tasks/today')
      if (!res.ok) throw new Error()
      const json = await res.json()
      setTasks(json.tasks ?? [])
    } catch { setError('Görevler yüklenemedi.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

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
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, completed: true, xp_earned: json.xp_earned } : t
      ))
      setToast(json)
      // Fire gamification events
      notify({
        newAchievements: json.new_achievements ?? [],
        levelUp: json.level_up,
        newLevel: json.level,
      })
    } finally { setCompleting(null) }
  }

  if (loading) return <Skeleton />

  const done  = tasks.filter(t => t.completed).length
  const total = tasks.length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0
  const diff  = (tasks[0]?.task_templates?.difficulty ?? 1) as Difficulty
  const allDone = done === total && total > 0

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-4 shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">Günlük Görevler</h2>
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, delay: 0.2 }}
                className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', DIFFICULTY_COLOR[diff])}
              >
                {DIFFICULTY_LABEL[diff]}
              </motion.span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {done}/{total} tamamlandı · {pct}%
            </p>
          </div>
          <AnimatePresence>
            {allDone && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg flex items-center gap-1"
              >
                <PartyPopper className="w-3.5 h-3.5" /> Harika!
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', allDone ? 'bg-green-500' : 'bg-indigo-500')}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.1 }}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}{' '}
            <button onClick={fetchTasks} className="underline font-medium">Tekrar dene</button>
          </p>
        )}

        {/* Task list */}
        <motion.ul
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-2"
        >
          <AnimatePresence mode="popLayout">
            {tasks.map(task => {
              const tmpl   = task.task_templates
              const busy   = completing === task.id

              return (
                <motion.li
                  key={task.id}
                  variants={rowVariants}
                  layout
                  onClick={() => !task.completed && !busy && handleComplete(task.id)}
                  whileHover={!task.completed ? { scale: 1.01, x: 2 } : {}}
                  whileTap={!task.completed ? { scale: 0.98 } : {}}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border transition-colors',
                    task.completed
                      ? 'bg-gray-50 border-gray-100 opacity-55 cursor-default'
                      : busy
                      ? 'bg-indigo-50/60 border-indigo-200 cursor-wait'
                      : 'bg-white border-border hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer'
                  )}
                >
                  {/* Check icon */}
                  <motion.span
                    className="mt-0.5 shrink-0"
                    animate={task.completed ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {busy
                      ? <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                      : task.completed
                      ? <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                      : <Circle className="w-5 h-5 text-gray-300" />
                    }
                  </motion.span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium leading-snug',
                      task.completed ? 'line-through text-muted-foreground' : 'text-gray-900'
                    )}>
                      {tmpl.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-1">
                      {tmpl.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {tmpl.subject}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        {task.completed ? `${task.xp_earned} XP kazanıldı` : `+${tmpl.xp_reward} XP`}
                      </span>
                    </div>
                  </div>

                  {/* Difficulty badge */}
                  <span className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 mt-0.5',
                    DIFFICULTY_COLOR[tmpl.difficulty as Difficulty]
                  )}>
                    {DIFFICULTY_LABEL[tmpl.difficulty as Difficulty]}
                  </span>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </motion.ul>

        {tasks.length > 0 && (
          <p className="text-[11px] text-muted-foreground/50 text-center">
            Tüm görevleri tamamlarsan +50 XP bonus 🚀
          </p>
        )}
      </motion.div>

      {/* XP Toast */}
      <AnimatePresence>
        {toast && <XpToast data={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </>
  )
}
