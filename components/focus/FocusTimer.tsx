'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, Square, Target, Brain, BookOpen, Wind,
  CloudRain, Volume2, Library, VolumeX, Zap, Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  FOCUS_DURATION_OPTIONS, FOCUS_MODE_LABELS, AMBIENT_SOUND_LABELS,
  type FocusDuration, type FocusMode, type AmbientSound,
  type TimerStatus, type CompleteSessionResponse, type PersistedFocusState,
} from '@/lib/pomodoro/types'
import type { DailyTaskWithTemplate } from '@/lib/tasks/types'
import type { SubjectWithTopics } from '@/lib/subjects/types'
import { useGamification } from '@/components/gamification/GamificationProvider'
import SessionCompleteOverlay, { type OverlaySession } from './SessionCompleteOverlay'

const STORAGE_KEY = 'noetic_focus'

const MODE_CONFIG: Record<FocusMode, {
  icon: typeof Target; color: string; glow: string; ring: string
  btnClass: string; bg: string
}> = {
  focus: {
    icon: Target, color: 'text-indigo-400', glow: 'rgba(99,102,241,0.55)', ring: '#6366f1',
    btnClass: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40', bg: 'from-indigo-950/40 to-violet-950/30',
  },
  deep_focus: {
    icon: Brain, color: 'text-violet-400', glow: 'rgba(139,92,246,0.55)', ring: '#8b5cf6',
    btnClass: 'bg-violet-600 hover:bg-violet-500 shadow-violet-900/40', bg: 'from-violet-950/40 to-purple-950/30',
  },
  study: {
    icon: BookOpen, color: 'text-blue-400', glow: 'rgba(59,130,246,0.55)', ring: '#3b82f6',
    btnClass: 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40', bg: 'from-blue-950/40 to-sky-950/30',
  },
  ambient: {
    icon: Wind, color: 'text-emerald-400', glow: 'rgba(16,185,129,0.55)', ring: '#10b981',
    btnClass: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40', bg: 'from-emerald-950/40 to-teal-950/30',
  },
}

const AMBIENT_ICONS: Record<AmbientSound, typeof CloudRain> = {
  rain: CloudRain, white_noise: Volume2, library: Library, none: VolumeX,
}

function pad(n: number) { return String(n).padStart(2, '0') }
function fmt(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}` }

function CircularProgress({
  progress, color, glow, size = 240, strokeWidth = 8, isRunning,
}: {
  progress: number; color: string; glow: string
  size?: number; strokeWidth?: number; isRunning: boolean
}) {
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)))
  const cx = size / 2

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <defs>
        <filter id="focus-ring-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {isRunning && (
        <circle
          cx={cx} cy={cx} r={r + strokeWidth + 4}
          fill="none" stroke={color} strokeWidth={1.5} opacity={0.2}
          style={{ animation: 'ring-pulse 2s ease-in-out infinite' }}
        />
      )}
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        filter={isRunning ? 'url(#focus-ring-glow)' : undefined}
        style={{
          transition: 'stroke-dashoffset 0.4s linear, stroke 0.5s ease',
          filter: `drop-shadow(0 0 ${isRunning ? 8 : 3}px ${glow})`,
        }}
      />
    </svg>
  )
}

function XpToast({ xp, levelUp, onClose }: { xp: number; levelUp: boolean; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="fixed bottom-6 right-6 z-40"
    >
      <div className="bg-gray-950 border border-white/10 text-white rounded-2xl px-5 py-4 shadow-2xl shadow-black/60 flex items-center gap-3 min-w-[220px]">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.1 }}
          className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-yellow-900/40"
        >
          {levelUp ? <Star className="w-5 h-5 text-yellow-900" /> : <Zap className="w-5 h-5 text-yellow-900" />}
        </motion.div>
        <div>
          {levelUp && <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider mb-0.5">Level up! 🎉</p>}
          <p className="text-sm font-bold">+{xp} XP earned</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function FocusTimer() {
  const { notify } = useGamification()
  const searchParams = useSearchParams()

  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle')
  const [duration, setDuration]       = useState<FocusDuration>(25)
  const [customMinutes, setCustomMinutes] = useState(30)
  const [mode, setMode]               = useState<FocusMode>('focus')
  const [ambient, setAmbient]         = useState<AmbientSound>('none')
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  const [subjects, setSubjects]       = useState<SubjectWithTopics[]>([])
  const [subjectId, setSubjectId]     = useState<string | null>(null)
  const [subjectName, setSubjectName] = useState<string | null>(null)
  const [topicId, setTopicId]         = useState<string | null>(null)
  const [topicName, setTopicName]     = useState<string | null>(null)

  const [tasks, setTasks]             = useState<DailyTaskWithTemplate[]>([])
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null)

  const [toast, setToast]             = useState<{ xp: number; levelUp: boolean } | null>(null)
  const [overlaySession, setOverlaySession] = useState<OverlaySession | null>(null)
  const [hydrated, setHydrated]       = useState(false)

  const intervalRef      = useRef<NodeJS.Timeout | null>(null)
  const activeIdRef      = useRef<string | null>(null)
  const totalSecondsRef  = useRef(25 * 60)
  const secondsLeftRef   = useRef(25 * 60)
  const didCompleteRef   = useRef(false)

  useEffect(() => { activeIdRef.current = activeSessionId }, [activeSessionId])
  useEffect(() => { secondsLeftRef.current = secondsLeft }, [secondsLeft])

  const totalSecondsFor = useCallback((d: FocusDuration, custom: number) =>
    (d === 'custom' ? custom : d) * 60, [])

  useEffect(() => { totalSecondsRef.current = totalSecondsFor(duration, customMinutes) }, [duration, customMinutes, totalSecondsFor])

  const persist = useCallback((overrides: Partial<PersistedFocusState> = {}) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      timerStatus, secondsLeft, totalSeconds: totalSecondsRef.current,
      activeSessionId, mode, duration, customMinutes,
      subjectId, subjectName, topicId, topicName,
      linkedTaskId, ambientSound: ambient, savedAt: Date.now(), ...overrides,
    } satisfies PersistedFocusState))
  }, [timerStatus, secondsLeft, activeSessionId, mode, duration, customMinutes, subjectId, subjectName, topicId, topicName, linkedTaskId, ambient])

  // ── Resolve subject/topic: task param → URL params → last selection ──
  useEffect(() => {
    const taskParamId    = searchParams.get('task')
    const paramSubjectId = searchParams.get('subjectId')
    const paramTopicId   = searchParams.get('topicId')

    async function resolveFromTask(id: string) {
      try {
        const res = await fetch(`/api/tasks/${id}`)
        if (res.ok) {
          const task = await res.json()
          setLinkedTaskId(task.id)
          if (task.subjects) {
            setSubjectId(task.subjects.id)
            setSubjectName(task.subjects.name)
          }
          if (task.topics) {
            setTopicId(task.topics.id)
            setTopicName(task.topics.title)
          } else if (task.topic_text) {
            setTopicName(task.topic_text)
          }
          if (task.duration_minutes) {
            const mins: number = task.duration_minutes
            const preset = FOCUS_DURATION_OPTIONS.find(o => o.value === mins)
            if (preset) { setDuration(preset.value) } else { setDuration('custom'); setCustomMinutes(mins) }
            setSecondsLeft(mins * 60)
          }
        }
      } finally {
        setHydrated(true)
      }
    }

    if (taskParamId) {
      resolveFromTask(taskParamId)
      return
    }

    if (paramSubjectId) {
      setSubjectId(paramSubjectId)
      setTopicId(paramTopicId)
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const s: PersistedFocusState = JSON.parse(raw)

          if (s.timerStatus === 'completed' && s.activeSessionId) {
            // An unrated session is waiting — reopen the (unskippable) overlay.
            setOverlaySession({
              sessionId:   s.activeSessionId,
              subjectName: s.subjectName,
              topicName:   s.topicName,
              durationSeconds: s.totalSeconds,
            })
            setHydrated(true)
            return
          }

          setMode(s.mode ?? 'focus')
          setDuration(s.duration ?? 25)
          setCustomMinutes(s.customMinutes ?? 30)
          setAmbient(s.ambientSound ?? 'none')
          setSubjectId(s.subjectId)
          setSubjectName(s.subjectName)
          setTopicId(s.topicId)
          setTopicName(s.topicName)
          setLinkedTaskId(s.linkedTaskId)

          if (s.timerStatus === 'running') {
            const elapsed = Math.floor((Date.now() - s.savedAt) / 1000)
            const remaining = Math.max(0, s.secondsLeft - elapsed)
            setSecondsLeft(remaining > 0 ? remaining : 0)
            setTimerStatus(remaining > 0 ? 'paused' : 'idle')
            setActiveSessionId(remaining > 0 ? s.activeSessionId : null)
          } else if (s.timerStatus === 'paused') {
            setSecondsLeft(s.secondsLeft)
            setTimerStatus('paused')
            setActiveSessionId(s.activeSessionId)
          } else {
            setSecondsLeft(totalSecondsFor(s.duration ?? 25, s.customMinutes ?? 30))
          }
        }
      } catch { localStorage.removeItem(STORAGE_KEY) }
    }
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Load subjects (for the picker + resolving names) ──────────
  useEffect(() => {
    fetch('/api/subjects')
      .then(r => r.json())
      .then(d => setSubjects(d.subjects ?? []))
      .catch(() => {})
  }, [])

  // Resolve display names once subjects load
  useEffect(() => {
    if (!subjectId) return
    const sub = subjects.find(s => s.id === subjectId)
    if (sub) {
      setSubjectName(sub.name)
      if (topicId) {
        const top = sub.topics?.find(t => t.id === topicId)
        if (top) setTopicName(top.title)
      }
    }
  }, [subjects, subjectId, topicId])

  // ── Load today's incomplete tasks (optional task link) ────────
  useEffect(() => {
    fetch('/api/tasks/today')
      .then(r => r.json())
      .then(d => setTasks((d.tasks ?? []).filter((t: DailyTaskWithTemplate) => !t.completed)))
      .catch(() => {})
  }, [])

  const handleSessionEnd = useCallback(async (elapsedSeconds: number) => {
    clearInterval(intervalRef.current!)
    setTimerStatus('completed')
    persist({ timerStatus: 'completed', secondsLeft: 0 })

    const sessionId = activeIdRef.current
    if (!sessionId) return

    try {
      const res = await fetch('/api/pomodoro/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, elapsedSeconds }),
      })
      if (res.ok) {
        const data: CompleteSessionResponse & { new_achievements?: string[] } = await res.json()
        setToast({ xp: data.xp_earned, levelUp: data.level_up })
        notify({ newAchievements: data.new_achievements ?? [], levelUp: data.level_up, newLevel: data.level })
      }
    } finally {
      setOverlaySession({ sessionId, subjectName, topicName, durationSeconds: elapsedSeconds })
    }
  }, [persist, notify, subjectName, topicName])

  const startTicking = useCallback(() => {
    clearInterval(intervalRef.current!)
    didCompleteRef.current = false
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        const next = prev - 1
        if (next <= 0) {
          if (!didCompleteRef.current) { didCompleteRef.current = true; handleSessionEnd(totalSecondsRef.current) }
          return 0
        }
        if (next % 5 === 0) persist({ timerStatus: 'running', secondsLeft: next })
        return next
      })
    }, 1000)
  }, [handleSessionEnd, persist])

  useEffect(() => () => clearInterval(intervalRef.current!), [])

  async function handleStart() {
    const durationSeconds = totalSecondsFor(duration, customMinutes)
    setSecondsLeft(durationSeconds)
    const res = await fetch('/api/pomodoro/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationSeconds, subjectId, topicId, taskId: linkedTaskId }),
    })
    if (!res.ok) return
    const { sessionId } = await res.json()
    didCompleteRef.current = false
    setActiveSessionId(sessionId)
    setTimerStatus('running')
    startTicking()
    persist({ timerStatus: 'running', activeSessionId: sessionId, secondsLeft: durationSeconds })
  }

  function handlePause() {
    clearInterval(intervalRef.current!)
    setTimerStatus('paused')
    persist({ timerStatus: 'paused', secondsLeft: secondsLeftRef.current })
  }

  function handleResume() {
    setTimerStatus('running')
    startTicking()
    persist({ timerStatus: 'running' })
  }

  function handleFinish() {
    const elapsed = totalSecondsRef.current - secondsLeftRef.current
    handleSessionEnd(Math.max(1, elapsed))
  }

  function changeDuration(d: FocusDuration) {
    if (timerStatus !== 'idle') return
    setDuration(d)
    const secs = totalSecondsFor(d, customMinutes)
    setSecondsLeft(secs)
    persist({ duration: d, secondsLeft: secs })
  }

  function changeCustomMinutes(mins: number) {
    setCustomMinutes(mins)
    if (duration === 'custom' && timerStatus === 'idle') {
      const secs = mins * 60
      setSecondsLeft(secs)
      persist({ customMinutes: mins, secondsLeft: secs })
    }
  }

  function changeMode(m: FocusMode) {
    if (timerStatus !== 'idle') return
    setMode(m)
    persist({ mode: m })
  }

  function changeAmbient(a: AmbientSound) {
    setAmbient(a)
    persist({ ambientSound: a })
  }

  function changeSubject(id: string | null) {
    setSubjectId(id)
    setTopicId(null)
    setTopicName(null)
    const sub = subjects.find(s => s.id === id)
    setSubjectName(sub?.name ?? null)
    persist({ subjectId: id, subjectName: sub?.name ?? null, topicId: null, topicName: null })
  }

  function changeTopic(id: string | null) {
    setTopicId(id)
    const sub = subjects.find(s => s.id === subjectId)
    const top = sub?.topics?.find(t => t.id === id)
    setTopicName(top?.title ?? null)
    persist({ topicId: id, topicName: top?.title ?? null })
  }

  if (!hydrated) return null

  const total    = totalSecondsRef.current
  const progress = total > 0 ? secondsLeft / total : 0
  const cfg      = MODE_CONFIG[mode]
  const isRunning = timerStatus === 'running'
  const isPaused  = timerStatus === 'paused'
  const isIdle    = timerStatus === 'idle'
  const locked    = !isIdle
  const currentSubject = subjects.find(s => s.id === subjectId)

  return (
    <>
      <div className="flex flex-col gap-4 max-w-xl mx-auto">
        {/* ── Main timer card ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] p-6 flex flex-col items-center gap-6 bg-gradient-to-br from-gray-950 to-gray-900"
        >
          <div className={cn('absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none', cfg.bg)} />

          {/* Mode tabs — the selected mode shown at the top of the screen */}
          <div className="relative z-10 flex bg-white/[0.06] rounded-xl p-1 gap-0.5 w-full border border-white/[0.07]">
            {(Object.keys(FOCUS_MODE_LABELS) as FocusMode[]).map(m => {
              const Icon = MODE_CONFIG[m].icon
              return (
                <button
                  key={m}
                  onClick={() => changeMode(m)}
                  disabled={locked}
                  className={cn(
                    'relative flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2.5 rounded-lg transition-all duration-200 z-10',
                    mode === m ? 'text-white' : 'text-white/30 hover:text-white/55 disabled:cursor-not-allowed'
                  )}
                >
                  {mode === m && (
                    <motion.div
                      layoutId="focus-mode-tab"
                      className="absolute inset-0 bg-white/10 rounded-lg border border-white/10"
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{FOCUS_MODE_LABELS[m]}</span>
                </button>
              )
            })}
          </div>

          <div className="relative z-10">
            <CircularProgress
              progress={progress} color={cfg.ring} glow={cfg.glow}
              size={240} strokeWidth={7} isRunning={isRunning}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <motion.span
                key={secondsLeft > total ? total : undefined}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                className={cn('text-7xl font-black tabular-nums tracking-[-0.04em]', cfg.color)}
              >
                {fmt(secondsLeft)}
              </motion.span>
              <span className="text-xs text-white/40 font-medium text-center px-4 max-w-[220px] truncate">
                {topicName ? `${subjectName ?? ''}${subjectName ? ' — ' : ''}${topicName}` : subjectName ?? 'No subject selected'}
              </span>
              {isRunning && (
                <div className="flex gap-1.5 mt-1">
                  {[0, 150, 300].map(delay => (
                    <span
                      key={delay}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: cfg.ring, animation: `bounce 1s ease-in-out ${delay}ms infinite` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="relative z-10 flex items-center gap-3">
            <AnimatePresence mode="wait">
              {isIdle && (
                <motion.button key="start"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  onClick={handleStart}
                  className={cn('flex items-center gap-2.5 px-10 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all', cfg.btnClass)}
                >
                  <Play className="w-4 h-4 fill-current" />START
                </motion.button>
              )}
              {isRunning && (
                <motion.div key="running-controls" className="flex items-center gap-3"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                >
                  <button onClick={handlePause}
                    className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-900/40 text-white font-bold text-sm transition-all"
                  >
                    <Pause className="w-4 h-4 fill-current" />PAUSE
                  </button>
                  <button onClick={handleFinish}
                    className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white font-bold text-sm transition-all"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />FINISH
                  </button>
                </motion.div>
              )}
              {isPaused && (
                <motion.div key="paused-controls" className="flex items-center gap-3"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                >
                  <button onClick={handleResume}
                    className={cn('flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all', cfg.btnClass)}
                  >
                    <Play className="w-4 h-4 fill-current" />RESUME
                  </button>
                  <button onClick={handleFinish}
                    className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white font-bold text-sm transition-all"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />FINISH
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Duration ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Duration</p>
          <div className="flex gap-2">
            {FOCUS_DURATION_OPTIONS.map(opt => (
              <button
                key={String(opt.value)}
                onClick={() => changeDuration(opt.value)}
                disabled={locked}
                className={cn(
                  'flex-1 text-center py-2.5 rounded-xl border text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50',
                  duration === opt.value
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-gray-50/50 border-border text-gray-500 hover:border-gray-300',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {duration === 'custom' && (
            <div className="flex items-center gap-2 mt-3">
              <input
                type="number" min={5} max={180}
                value={customMinutes}
                disabled={locked}
                onChange={e => changeCustomMinutes(Math.max(5, Math.min(180, Number(e.target.value) || 5)))}
                className="w-24 text-sm bg-gray-50/50 border border-border rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50"
              />
              <span className="text-xs text-muted-foreground">minutes</span>
            </div>
          )}
        </div>

        {/* ── Subject / Topic ────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Subject &amp; Topic</p>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={subjectId ?? ''}
              onChange={e => changeSubject(e.target.value || null)}
              disabled={locked}
              className="text-sm bg-gray-50/50 border border-border rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50"
            >
              <option value="">— Subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
            <select
              value={topicId ?? ''}
              onChange={e => changeTopic(e.target.value || null)}
              disabled={locked || !subjectId}
              className="text-sm bg-gray-50/50 border border-border rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50"
            >
              <option value="">— Topic</option>
              {(currentSubject?.topics ?? []).map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Ambient sound ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Ambient Sound</p>
          <div className="flex gap-2">
            {(Object.keys(AMBIENT_SOUND_LABELS) as AmbientSound[]).map(a => {
              const Icon = AMBIENT_ICONS[a]
              return (
                <button
                  key={a}
                  onClick={() => changeAmbient(a)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-[10px] font-semibold transition-all',
                    ambient === a
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-gray-50/50 border-border text-gray-500 hover:border-gray-300',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {AMBIENT_SOUND_LABELS[a]}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Optional task link ─────────────────────────────── */}
        {tasks.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Link a Task (optional)</p>
            <select
              value={linkedTaskId ?? ''}
              onChange={e => { setLinkedTaskId(e.target.value || null); persist({ linkedTaskId: e.target.value || null }) }}
              disabled={locked}
              className="w-full text-sm bg-gray-50/50 border border-border rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50"
            >
              <option value="">— None</option>
              {tasks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.task_templates.subject} — {t.task_templates.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <AnimatePresence>
        {toast && <XpToast xp={toast.xp} levelUp={toast.levelUp} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {overlaySession && (
        <SessionCompleteOverlay
          session={overlaySession}
          onSaved={() => {
            localStorage.removeItem(STORAGE_KEY)
          }}
        />
      )}
    </>
  )
}
