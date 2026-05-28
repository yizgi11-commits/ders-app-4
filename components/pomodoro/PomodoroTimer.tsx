'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Brain, Zap, Star, Coffee, CheckCircle2, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DURATIONS, SESSION_LABELS,
  type SessionType, type TimerStatus,
  type CompleteSessionResponse, type PersistedTimerState,
} from '@/lib/pomodoro/types'
import type { DailyTaskWithTemplate } from '@/lib/tasks/types'
import { useGamification } from '@/components/gamification/GamificationProvider'

// ─────────────────────────────────────────
const STORAGE_KEY     = 'studyos_pomodoro'
const LONG_BREAK_AFTER = 4

const SESSION_CONFIG: Record<SessionType, {
  color: string; glow: string; ring: string
  btnClass: string; bg: string; badge: string
}> = {
  focus: {
    color:    'text-indigo-400',
    glow:     'rgba(99,102,241,0.55)',
    ring:     '#6366f1',
    btnClass: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40',
    bg:       'from-indigo-950/40 to-violet-950/30',
    badge:    'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
  },
  short_break: {
    color:    'text-emerald-400',
    glow:     'rgba(16,185,129,0.55)',
    ring:     '#10b981',
    btnClass: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40',
    bg:       'from-emerald-950/40 to-teal-950/30',
    badge:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  },
  long_break: {
    color:    'text-blue-400',
    glow:     'rgba(59,130,246,0.55)',
    ring:     '#3b82f6',
    btnClass: 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40',
    bg:       'from-blue-950/40 to-sky-950/30',
    badge:    'bg-blue-500/15 text-blue-400 border-blue-500/25',
  },
}

// ─────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, '0') }
function fmt(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}` }

// ─────────────────────────────────────────
// Premium circular progress with glow
// ─────────────────────────────────────────
function CircularProgress({
  progress, color, glow, size = 220, strokeWidth = 8, isRunning,
}: {
  progress: number; color: string; glow: string
  size?: number; strokeWidth?: number; isRunning: boolean
}) {
  const r     = (size - strokeWidth * 2) / 2
  const circ  = 2 * Math.PI * r
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)))
  const cx = size / 2

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <defs>
        <filter id="ring-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Outer pulse ring when running */}
      {isRunning && (
        <circle
          cx={cx} cy={cx} r={r + strokeWidth + 4}
          fill="none" stroke={color} strokeWidth={1.5}
          opacity={0.2}
          style={{ animation: 'ring-pulse 2s ease-in-out infinite' }}
        />
      )}
      {/* Track */}
      <circle cx={cx} cy={cx} r={r}
        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={cx} cy={cx} r={r}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        filter={isRunning ? 'url(#ring-glow)' : undefined}
        style={{
          transition: 'stroke-dashoffset 0.4s linear, stroke 0.5s ease',
          filter: `drop-shadow(0 0 ${isRunning ? 8 : 3}px ${glow})`,
        }}
      />
    </svg>
  )
}

// ─────────────────────────────────────────
// XP Toast
// ─────────────────────────────────────────
function XpToast({ xp, levelUp, onClose }: { xp: number; levelUp: boolean; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="fixed bottom-6 right-6 z-50"
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
          {levelUp && <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider mb-0.5">Seviye Atladın! 🎉</p>}
          <p className="text-sm font-bold">+{xp} XP kazandın</p>
          <p className="text-xs text-white/40 mt-0.5">Odak oturumu tamamlandı ✓</p>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────
export default function PomodoroTimer() {
  const { notify } = useGamification()
  const [timerStatus, setTimerStatus]         = useState<TimerStatus>('idle')
  const [sessionType, setSessionType]         = useState<SessionType>('focus')
  const [secondsLeft, setSecondsLeft]         = useState(DURATIONS.focus)
  const [sessionCount, setSessionCount]       = useState(0)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [linkedTaskId, setLinkedTaskId]       = useState<string | null>(null)
  const [tasks, setTasks]                     = useState<DailyTaskWithTemplate[]>([])
  const [completing, setCompleting]           = useState(false)
  const [toast, setToast]                     = useState<{ xp: number; levelUp: boolean } | null>(null)
  const [justCompleted, setJustCompleted]     = useState(false)

  const intervalRef     = useRef<NodeJS.Timeout | null>(null)
  const activeIdRef     = useRef<string | null>(null)
  const sessionTypeRef  = useRef<SessionType>('focus')
  const totalSecondsRef = useRef(DURATIONS.focus)
  const didCompleteRef  = useRef(false)
  const secondsLeftRef  = useRef(DURATIONS.focus)

  useEffect(() => { activeIdRef.current    = activeSessionId  }, [activeSessionId])
  useEffect(() => { sessionTypeRef.current = sessionType      }, [sessionType])
  useEffect(() => { totalSecondsRef.current = DURATIONS[sessionType] }, [sessionType])
  useEffect(() => { secondsLeftRef.current = secondsLeft      }, [secondsLeft])

  const persist = useCallback((overrides: Partial<PersistedTimerState> = {}) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      timerStatus, sessionType, secondsLeft,
      totalSeconds: DURATIONS[sessionType], sessionCount,
      activeSessionId, linkedTaskId, savedAt: Date.now(), ...overrides,
    } satisfies PersistedTimerState))
  }, [timerStatus, sessionType, secondsLeft, sessionCount, activeSessionId, linkedTaskId])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const s: PersistedTimerState = JSON.parse(raw)
      setSessionType(s.sessionType)
      setSessionCount(s.sessionCount)
      setLinkedTaskId(s.linkedTaskId)
      sessionTypeRef.current = s.sessionType
      if (s.timerStatus === 'running') {
        const elapsed = Math.floor((Date.now() - s.savedAt) / 1000)
        const remaining = Math.max(0, s.secondsLeft - elapsed)
        if (remaining > 0) { setSecondsLeft(remaining); setTimerStatus('paused') }
        else { setSecondsLeft(0); setTimerStatus('completed'); setJustCompleted(true) }
        setActiveSessionId(s.activeSessionId)
      } else if (s.timerStatus === 'paused') {
        setSecondsLeft(s.secondsLeft); setTimerStatus('paused'); setActiveSessionId(s.activeSessionId)
      } else {
        setSecondsLeft(DURATIONS[s.sessionType]); setTimerStatus('idle')
      }
    } catch { localStorage.removeItem(STORAGE_KEY) }
  }, [])

  useEffect(() => {
    fetch('/api/tasks/today')
      .then(r => r.json())
      .then(d => setTasks((d.tasks ?? []).filter((t: DailyTaskWithTemplate) => !t.completed)))
      .catch(() => {})
  }, [])

  const handleSessionComplete = useCallback(async () => {
    clearInterval(intervalRef.current!)
    setTimerStatus('completed')
    setJustCompleted(true)
    persist({ timerStatus: 'completed', secondsLeft: 0 })
    const sessionId = activeIdRef.current
    if (!sessionId) return
    setCompleting(true)
    try {
      const res = await fetch('/api/pomodoro/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, elapsedSeconds: totalSecondsRef.current }),
      })
      if (res.ok) {
        const data: CompleteSessionResponse & { new_achievements?: string[] } = await res.json()
        if (sessionTypeRef.current === 'focus') {
          setToast({ xp: data.xp_earned, levelUp: data.level_up })
          setSessionCount(prev => prev + 1)
          // Fire gamification events
          notify({
            newAchievements: data.new_achievements ?? [],
            levelUp: data.level_up,
            newLevel: data.level,
          })
        }
      }
    } finally { setCompleting(false) }
  }, [persist])

  const startTicking = useCallback(() => {
    clearInterval(intervalRef.current!)
    didCompleteRef.current = false
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        const next = prev - 1
        if (next <= 0) {
          if (!didCompleteRef.current) { didCompleteRef.current = true; handleSessionComplete() }
          return 0
        }
        if (next % 5 === 0) persist({ timerStatus: 'running', secondsLeft: next })
        return next
      })
    }, 1000)
  }, [handleSessionComplete, persist])

  useEffect(() => () => clearInterval(intervalRef.current!), [])

  async function handleStart() {
    const res = await fetch('/api/pomodoro/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: sessionType, taskId: linkedTaskId }),
    })
    if (!res.ok) return
    const { sessionId } = await res.json()
    didCompleteRef.current = false
    setActiveSessionId(sessionId)
    setTimerStatus('running')
    setJustCompleted(false)
    startTicking()
    persist({ timerStatus: 'running', activeSessionId: sessionId })
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

  async function handleReset() {
    clearInterval(intervalRef.current!)
    if (activeIdRef.current && timerStatus !== 'idle' && timerStatus !== 'completed') {
      fetch('/api/pomodoro/interrupt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeIdRef.current, elapsedSeconds: totalSecondsRef.current - secondsLeftRef.current }),
      }).catch(() => {})
    }
    didCompleteRef.current = false
    setTimerStatus('idle')
    setSecondsLeft(DURATIONS[sessionType])
    setActiveSessionId(null)
    setJustCompleted(false)
    persist({ timerStatus: 'idle', secondsLeft: DURATIONS[sessionType], activeSessionId: null })
  }

  function switchType(type: SessionType) {
    if (timerStatus === 'running') return
    clearInterval(intervalRef.current!)
    didCompleteRef.current = false
    setSessionType(type)
    setSecondsLeft(DURATIONS[type])
    setTimerStatus('idle')
    setActiveSessionId(null)
    setJustCompleted(false)
    persist({ sessionType: type, timerStatus: 'idle', secondsLeft: DURATIONS[type], activeSessionId: null })
  }

  function handleNextSession() {
    const nextType: SessionType = sessionType === 'focus'
      ? (sessionCount > 0 && sessionCount % LONG_BREAK_AFTER === 0 ? 'long_break' : 'short_break')
      : 'focus'
    switchType(nextType)
  }

  const total    = DURATIONS[sessionType]
  const progress = secondsLeft / total
  const cfg      = SESSION_CONFIG[sessionType]
  const isRunning = timerStatus === 'running'
  const isPaused  = timerStatus === 'paused'
  const isIdle    = timerStatus === 'idle'
  const isDone    = timerStatus === 'completed'

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* ── Main Timer Card ─────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className={cn(
            'relative overflow-hidden rounded-2xl border border-white/[0.08] p-6 flex flex-col items-center gap-6',
            'bg-gradient-to-br from-gray-950 to-gray-900',
          )}
        >
          {/* Ambient gradient for session type */}
          <div className={cn('absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none', cfg.bg)} />

          {/* Session type tabs */}
          <div className="relative z-10 flex bg-white/[0.06] rounded-xl p-1 gap-0.5 w-full border border-white/[0.07]">
            {(['focus', 'short_break', 'long_break'] as SessionType[]).map(type => (
              <button
                key={type}
                onClick={() => switchType(type)}
                disabled={isRunning}
                className={cn(
                  'relative flex-1 text-[11px] font-semibold py-2 rounded-lg transition-all duration-200 z-10',
                  sessionType === type ? 'text-white' : 'text-white/30 hover:text-white/55 disabled:cursor-not-allowed'
                )}
              >
                {sessionType === type && (
                  <motion.div
                    layoutId="pomodoro-tab"
                    className="absolute inset-0 bg-white/10 rounded-lg border border-white/10"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <span className="relative z-10">{SESSION_LABELS[type]}</span>
              </button>
            ))}
          </div>

          {/* Circular timer */}
          <div className="relative z-10">
            <CircularProgress
              progress={progress}
              color={cfg.ring}
              glow={cfg.glow}
              size={220}
              strokeWidth={7}
              isRunning={isRunning}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <motion.span
                key={sessionType}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                className={cn('text-6xl font-black tabular-nums tracking-[-0.04em]', cfg.color)}
              >
                {fmt(secondsLeft)}
              </motion.span>
              <span className="text-[11px] text-white/30 font-medium tracking-wide uppercase">
                {completing ? 'Kaydediliyor...' : SESSION_LABELS[sessionType]}
              </span>
              {/* Running dots */}
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

          {/* Session cycle dots */}
          <div className="relative z-10 flex items-center gap-2">
            {[1, 2, 3, 4].map(n => {
              const cyclePos = sessionCount % LONG_BREAK_AFTER
              const filled   = cyclePos === 0 && sessionCount > 0 ? true : n <= cyclePos
              return (
                <motion.div
                  key={n}
                  animate={{ scale: filled ? 1.15 : 1 }}
                  className={cn(
                    'rounded-full transition-all duration-400',
                    filled ? 'w-3 h-3' : 'w-2.5 h-2.5 bg-white/10 border border-white/15',
                  )}
                  style={filled ? { background: cfg.ring, width: 12, height: 12, boxShadow: `0 0 8px ${cfg.glow}` } : {}}
                />
              )
            })}
            <span className="text-xs text-white/25 ml-1 tabular-nums font-medium">
              {sessionCount} oturum
            </span>
          </div>

          {/* Completion banner */}
          <AnimatePresence>
            {justCompleted && !isRunning && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="relative z-10 w-full max-w-xs"
              >
                <div className="bg-white/[0.07] border border-white/10 rounded-2xl p-5 text-center backdrop-blur-sm">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, delay: 0.1 }}
                    className="flex justify-center mb-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                  </motion.div>
                  <p className="text-sm font-bold text-white mb-1">
                    {sessionType === 'focus' ? '🎉 Odak oturumu bitti!' : '☕ Mola sona erdi!'}
                  </p>
                  <p className="text-xs text-white/35 mb-4">
                    {sessionType === 'focus' ? 'Harika iş! Bir mola hak ettin.' : 'Tekrar odaklanmaya hazır mısın?'}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleNextSession}
                    className={cn(
                      'w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg',
                      sessionType === 'focus'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40'
                    )}
                  >
                    {sessionType === 'focus'
                      ? (sessionCount > 0 && sessionCount % LONG_BREAK_AFTER === 0 ? '🛋️ Uzun Mola' : '☕ Kısa Mola')
                      : '🎯 Odak Başlat'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                  <Play className="w-4 h-4 fill-current" />Başla
                </motion.button>
              )}
              {isRunning && (
                <motion.button key="pause"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  onClick={handlePause}
                  className="flex items-center gap-2.5 px-10 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-900/40 text-white font-bold text-sm transition-all"
                >
                  <Pause className="w-4 h-4 fill-current" />Duraklat
                </motion.button>
              )}
              {isPaused && (
                <motion.button key="resume"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  onClick={handleResume}
                  className={cn('flex items-center gap-2.5 px-10 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all', cfg.btnClass)}
                >
                  <Play className="w-4 h-4 fill-current" />Devam Et
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!isIdle && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7, rotate: 30 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.7, rotate: 30 }}
                  whileHover={{ scale: 1.1, rotate: -20 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  onClick={handleReset}
                  title="Sıfırla"
                  className="p-3.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-white/40 hover:text-white/70 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Task Selector ────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 340, damping: 30 }}
          className="bg-white rounded-2xl border border-border p-4 shadow-sm"
        >
          <p className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-500" />
            Görev Bağla
            <span className="text-xs text-muted-foreground font-normal">(isteğe bağlı)</span>
          </p>
          {tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground bg-gray-50 rounded-xl px-3 py-2.5 border border-border/60">
              Bugün tamamlanmamış görev yok.
            </p>
          ) : (
            <select
              value={linkedTaskId ?? ''}
              onChange={e => setLinkedTaskId(e.target.value || null)}
              disabled={isRunning}
              className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <option value="">— Serbest çalışma</option>
              {tasks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.task_templates.subject} — {t.task_templates.title}
                </option>
              ))}
            </select>
          )}
        </motion.div>

        {/* ── Session Info Cards ───────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 340, damping: 30 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { icon: Coffee,  label: 'Oturum',        value: sessionCount,           color: 'text-amber-500',  bg: 'bg-amber-50' },
            { icon: Zap,     label: 'Oturum XP',     value: sessionCount * 25,      color: 'text-yellow-500', bg: 'bg-yellow-50' },
            { icon: Timer,   label: 'Odak (dk)',      value: sessionCount * 25,      color: 'text-indigo-500', bg: 'bg-indigo-50' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-border p-3 text-center hover:shadow-sm transition-shadow">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1.5', bg)}>
                <Icon className={cn('w-3.5 h-3.5', color)} />
              </div>
              <p className="text-lg font-black text-gray-900 tabular-nums">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* XP Toast */}
      <AnimatePresence>
        {toast && <XpToast xp={toast.xp} levelUp={toast.levelUp} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </>
  )
}
