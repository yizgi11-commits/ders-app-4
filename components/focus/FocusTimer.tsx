'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  FOCUS_DURATION_OPTIONS, type FocusDuration,
  type TimerStatus, type CompleteSessionResponse, type PersistedFocusState,
} from '@/lib/pomodoro/types'
import type { DailyTaskWithTemplate } from '@/lib/tasks/types'
import type { SubjectWithTopics } from '@/lib/subjects/types'
import { useGamification } from '@/components/gamification/GamificationProvider'
import SessionCompleteOverlay, { type OverlaySession } from './SessionCompleteOverlay'

const STORAGE_KEY = 'noetic_focus'

function pad(n: number) { return String(n).padStart(2, '0') }
function fmt(s: number) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}` }

const RING_SIZE   = 260
const RING_STROKE = 2
const RING_R      = 125

/** Thin progress ring — accent on a dark track. No glow. */
function Ring({ progress }: { progress: number }) {
  const circ   = 2 * Math.PI * RING_R
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)))
  const c      = RING_SIZE / 2
  return (
    <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90" aria-hidden>
      <circle cx={c} cy={c} r={RING_R} fill="none" strokeWidth={RING_STROKE} className="stroke-dark-border" />
      <circle
        cx={c} cy={c} r={RING_R}
        fill="none" strokeWidth={RING_STROKE} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        className="stroke-accent transition-[stroke-dashoffset] duration-[400ms] ease-linear"
      />
    </svg>
  )
}

const selectClass =
  'h-9 w-full rounded-md bg-dark-secondary border border-dark-border px-3 text-sm text-dark-text [color-scheme:dark] ' +
  'focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed'

export default function FocusTimer() {
  const { notify } = useGamification()
  const searchParams = useSearchParams()

  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle')
  const [duration, setDuration]       = useState<FocusDuration>(25)
  const [customMinutes, setCustomMinutes] = useState(30)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  const [subjects, setSubjects]       = useState<SubjectWithTopics[]>([])
  const [subjectId, setSubjectId]     = useState<string | null>(null)
  const [subjectName, setSubjectName] = useState<string | null>(null)
  const [topicId, setTopicId]         = useState<string | null>(null)
  const [topicName, setTopicName]     = useState<string | null>(null)

  const [tasks, setTasks]             = useState<DailyTaskWithTemplate[]>([])
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null)

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
      // Read from the ref: the tick interval keeps the `persist` from the
      // render it started in, where activeSessionId state is still null.
      activeSessionId: activeIdRef.current, duration, customMinutes,
      subjectId, subjectName, topicId, topicName,
      linkedTaskId, savedAt: Date.now(), ...overrides,
    } satisfies PersistedFocusState))
  }, [timerStatus, secondsLeft, duration, customMinutes, subjectId, subjectName, topicId, topicName, linkedTaskId])

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

          setDuration(s.duration ?? 25)
          setCustomMinutes(s.customMinutes ?? 30)
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

    let xpEarned: number | undefined
    try {
      const res = await fetch('/api/pomodoro/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, elapsedSeconds }),
      })
      if (res.ok) {
        const data: CompleteSessionResponse & { new_achievements?: string[] } = await res.json()
        xpEarned = data.xp_earned
        notify({ newAchievements: data.new_achievements ?? [], levelUp: data.level_up, newLevel: data.level })
      }
    } finally {
      setOverlaySession({ sessionId, subjectName, topicName, durationSeconds: elapsedSeconds, xpEarned })
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
  const isRunning = timerStatus === 'running'
  const isPaused  = timerStatus === 'paused'
  const isIdle    = timerStatus === 'idle'
  const locked    = !isIdle
  const currentSubject = subjects.find(s => s.id === subjectId)

  const ghostBtn = 'inline-flex items-center gap-2 h-10 px-5 rounded-md text-base font-medium transition-colors duration-[160ms]'

  return (
    <>
      <div className="max-w-md mx-auto flex flex-col items-center">
        {/* ── Timer ──────────────────────────────────────────── */}
        <div className="relative">
          <Ring progress={progress} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                'tabular font-light leading-none tracking-[-0.02em] text-dark-text',
                // 100+ minute custom sessions have a 3-digit minute field
                secondsLeft >= 6000 ? 'text-[56px]' : 'text-[72px]',
              )}
            >
              {fmt(secondsLeft)}
            </span>
          </div>
        </div>

        <div className="mt-5 text-center min-h-[42px] max-w-full">
          <p className="text-[16px] leading-6 font-medium text-dark-text-secondary truncate">
            {subjectName ?? 'Ders seçilmedi'}
          </p>
          {topicName && <p className="text-base text-dark-text-muted truncate">{topicName}</p>}
        </div>

        {/* ── Duration ───────────────────────────────────────── */}
        <div className="mt-6 flex items-center gap-2 text-base" aria-label="Süre">
          {FOCUS_DURATION_OPTIONS.map((opt, i) => (
            <span key={String(opt.value)} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="text-dark-border">/</span>}
              <button
                onClick={() => changeDuration(opt.value)}
                disabled={locked}
                aria-pressed={duration === opt.value}
                className={cn(
                  'transition-colors duration-[160ms] disabled:cursor-not-allowed',
                  opt.value !== 'custom' && 'tabular',
                  duration === opt.value
                    ? 'text-dark-accent'
                    : 'text-dark-text-muted hover:text-dark-text-secondary disabled:hover:text-dark-text-muted',
                )}
              >
                {opt.value === 'custom' ? 'Özel' : opt.value}
              </button>
            </span>
          ))}
          {duration === 'custom' && (
            <span className="flex items-center gap-1.5 ml-2">
              <input
                type="number" min={5} max={180}
                value={customMinutes}
                disabled={locked}
                aria-label="Özel süre (dakika)"
                onChange={e => changeCustomMinutes(Math.max(5, Math.min(180, Number(e.target.value) || 5)))}
                className="w-16 h-8 rounded-md bg-dark-secondary border border-dark-border px-2 text-sm tabular text-dark-text focus:outline-none focus:border-accent disabled:opacity-50"
              />
              <span className="text-sm text-dark-text-muted">dk</span>
            </span>
          )}
        </div>

        {/* ── Controls ───────────────────────────────────────── */}
        <div className="mt-8 flex items-center gap-3 min-h-10">
          <AnimatePresence mode="wait" initial={false}>
            {isIdle && (
              <motion.button
                key="start"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                onClick={handleStart}
                className={cn(ghostBtn, 'px-6 bg-accent hover:bg-accent-dark text-white')}
              >
                <Play className="size-4 fill-current" /> Başlat
              </motion.button>
            )}
            {(isRunning || isPaused) && (
              <motion.div
                key={isRunning ? 'running' : 'paused'}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex items-center gap-3"
              >
                {isRunning ? (
                  <button onClick={handlePause} className={cn(ghostBtn, 'border border-dark-border text-dark-text hover:bg-white/[0.06]')}>
                    <Pause className="size-4" /> Duraklat
                  </button>
                ) : (
                  <button onClick={handleResume} className={cn(ghostBtn, 'bg-accent hover:bg-accent-dark text-white')}>
                    <Play className="size-4 fill-current" /> Devam et
                  </button>
                )}
                <button onClick={handleFinish} className={cn(ghostBtn, 'text-dark-text-secondary hover:text-danger hover:bg-white/[0.04]')}>
                  <Square className="size-3.5" /> Bitir
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Subject / topic / task ─────────────────────────── */}
        <div className="mt-10 w-full grid grid-cols-2 gap-2">
          <select
            value={subjectId ?? ''}
            onChange={e => changeSubject(e.target.value || null)}
            disabled={locked}
            aria-label="Ders"
            className={selectClass}
          >
            <option value="">— Ders</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
            ))}
          </select>
          <select
            value={topicId ?? ''}
            onChange={e => changeTopic(e.target.value || null)}
            disabled={locked || !subjectId}
            aria-label="Konu"
            className={selectClass}
          >
            <option value="">— Konu</option>
            {(currentSubject?.topics ?? []).map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          {tasks.length > 0 && (
            <select
              value={linkedTaskId ?? ''}
              onChange={e => { setLinkedTaskId(e.target.value || null); persist({ linkedTaskId: e.target.value || null }) }}
              disabled={locked}
              aria-label="Görev bağla (isteğe bağlı)"
              className={cn(selectClass, 'col-span-2')}
            >
              <option value="">— Görev bağla (isteğe bağlı)</option>
              {tasks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.task_templates.subject} — {t.task_templates.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

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
