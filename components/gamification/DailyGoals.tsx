'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Clock, Timer, CheckCircle2, Edit3, Check, X } from 'lucide-react'
import { stagger } from '@/lib/motion'

interface GoalData {
  focus_minutes_goal: number
  pomodoro_goal:      number
  tasks_goal:         number
}

interface ProgressData {
  focusMinutes:   number
  pomodorosDone:  number
  tasksDone:      number
}

interface Props {
  initialGoals:    GoalData
  progress:        ProgressData
}

function GoalBar({
  label, icon: Icon, current, goal, color, index,
}: {
  label:   string
  icon:    React.ElementType
  current: number
  goal:    number
  color:   string
  index:   number
}) {
  const pct     = Math.min(100, Math.round((current / Math.max(goal, 1)) * 100))
  const done    = pct >= 100

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 340, damping: 28, delay: index * 0.08 } },
      }}
      className="flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-white/70">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {done && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </motion.div>
          )}
          <span className={`text-xs font-bold tabular-nums ${done ? 'text-emerald-400' : 'text-white/60'}`}>
            {current}<span className="text-white/25">/{goal}</span>
          </span>
        </div>
      </div>

      <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: done
              ? 'linear-gradient(90deg, #34d399, #10b981)'
              : undefined,
            backgroundColor: done ? undefined : colorValue(color),
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.3 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </motion.div>
  )
}

function colorValue(colorClass: string): string {
  if (colorClass.includes('indigo')) return '#6366f1'
  if (colorClass.includes('violet')) return '#8b5cf6'
  if (colorClass.includes('emerald')) return '#34d399'
  return '#6366f1'
}

export default function DailyGoals({ initialGoals, progress }: Props) {
  const [goals, setGoals]     = useState<GoalData>(initialGoals)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState<GoalData>(initialGoals)
  const [saving, setSaving]   = useState(false)

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })

  const allDone =
    progress.focusMinutes  >= goals.focus_minutes_goal &&
    progress.pomodorosDone >= goals.pomodoro_goal &&
    progress.tasksDone     >= goals.tasks_goal

  async function saveGoals() {
    setSaving(true)
    try {
      await fetch('/api/daily-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      setGoals(draft)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const goalItems = [
    { label: 'Odak Süresi', icon: Clock,  current: progress.focusMinutes,   goal: goals.focus_minutes_goal, color: 'bg-indigo-500/20 text-indigo-400',  draftKey: 'focus_minutes_goal' as const, unit: 'dk' },
    { label: 'Pomodoro',    icon: Timer,  current: progress.pomodorosDone,  goal: goals.pomodoro_goal,       color: 'bg-violet-500/20 text-violet-400',  draftKey: 'pomodoro_goal'       as const, unit: 'oturum' },
    { label: 'Görev',       icon: Target, current: progress.tasksDone,      goal: goals.tasks_goal,          color: 'bg-emerald-500/20 text-emerald-400', draftKey: 'tasks_goal'          as const, unit: 'adet' },
  ]

  return (
    <div className="bg-gradient-to-br from-gray-950 to-gray-900 border border-white/[0.07] rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Target className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Günlük Hedefler</h3>
            {allDone && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full"
              >
                Tamamlandı! 🎉
              </motion.span>
            )}
          </div>
          <p className="text-[11px] text-white/30 capitalize">{today}</p>
        </div>
        <button
          onClick={() => { setDraft(goals); setEditing(!editing) }}
          className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5 text-white/40" />
        </button>
      </div>

      {/* Edit mode */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 mb-4 flex flex-col gap-3">
              <p className="text-[11px] text-white/40 font-medium">Hedeflerini Düzenle</p>
              {goalItems.map(item => (
                <div key={item.draftKey} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-white/60 flex-1">{item.label} ({item.unit})</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setDraft(d => ({ ...d, [item.draftKey]: Math.max(1, d[item.draftKey] - (item.draftKey === 'focus_minutes_goal' ? 10 : 1)) }))}
                      className="w-6 h-6 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-white/60 text-sm flex items-center justify-center"
                    >−</button>
                    <span className="text-sm font-bold text-white w-8 text-center tabular-nums">{draft[item.draftKey]}</span>
                    <button
                      onClick={() => setDraft(d => ({ ...d, [item.draftKey]: d[item.draftKey] + (item.draftKey === 'focus_minutes_goal' ? 10 : 1) }))}
                      className="w-6 h-6 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-white/60 text-sm flex items-center justify-center"
                    >+</button>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveGoals}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />{saving ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white/40 text-xs transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals */}
      <motion.div
        variants={stagger(0.08, 0.1)}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-3.5"
      >
        {goalItems.map((item, i) => (
          <GoalBar
            key={item.draftKey}
            label={item.label}
            icon={item.icon}
            current={item.current}
            goal={item.goal}
            color={item.color}
            index={i}
          />
        ))}
      </motion.div>
    </div>
  )
}
