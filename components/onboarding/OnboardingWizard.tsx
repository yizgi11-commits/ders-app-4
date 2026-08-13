'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { OnboardingData } from '@/lib/onboarding/types'
import { ONBOARDING_STEPS, DEFAULT_SUBJECTS } from '@/lib/onboarding/types'
import StepGoal from './StepGoal'
import StepGrade from './StepGrade'
import StepSubjects from './StepSubjects'
import StepDailyGoal from './StepDailyGoal'
import StepDifficulty from './StepDifficulty'
import StepReady from './StepReady'

interface Props {
  userName: string
}

export default function OnboardingWizard({ userName }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  // Form state
  const [data, setData] = useState<OnboardingData>({
    displayName:    userName,
    studyGoal:      'ders_basarisi',
    gradeLevel:     null,
    subjects:       [],
    dailyGoalHours: 2,
    difficulties:   [],
  })

  function update<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  const totalSteps = ONBOARDING_STEPS.length

  async function saveStep(s: number) {
    // Non-blocking save of progress
    fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step: s }),
    }).catch(() => {})
  }

  function goNext() {
    const next = Math.min(step + 1, totalSteps - 1)
    setStep(next)
    saveStep(next)
  }

  function goBack() {
    setStep(s => Math.max(s - 1, 0))
  }

  const handleComplete = useCallback(async () => {
    setLoading(true)
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      router.push('/dashboard')
      router.refresh()
    } catch {
      setLoading(false)
    }
  }, [data, router])

  // Available subjects for the subject step
  const availableSubjects = DEFAULT_SUBJECTS[data.studyGoal] ?? DEFAULT_SUBJECTS.ders_basarisi
  const isReadyStep = step === totalSteps - 1

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center relative overflow-hidden">

      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/8 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/8 rounded-full blur-[100px]"
        />
      </div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="h-1 bg-white/[0.05]">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
            animate={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex items-center justify-center gap-2 py-3">
          {ONBOARDING_STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === step ? 'bg-indigo-400 scale-125' :
                i < step ? 'bg-indigo-500/40' :
                'bg-white/10'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Step content */}
      <div className="relative z-10 w-full max-w-xl px-6">
        {!isReadyStep && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-xs font-semibold text-white/25 uppercase tracking-[0.15em] mb-3"
          >
            Noetic seni tanısın.
          </motion.p>
        )}

        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepGoal
              key="goal"
              value={data.studyGoal}
              onChange={(g) => setData(prev => ({ ...prev, studyGoal: g, subjects: [] }))}
              onNext={goNext}
            />
          )}
          {step === 1 && (
            <StepGrade
              key="grade"
              value={data.gradeLevel}
              onChange={(v) => update('gradeLevel', v)}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 2 && (
            <StepSubjects
              key="subjects"
              subjects={availableSubjects}
              selected={data.subjects}
              onToggle={(name) => {
                setData(prev => ({
                  ...prev,
                  subjects: prev.subjects.includes(name)
                    ? prev.subjects.filter(n => n !== name)
                    : [...prev.subjects, name],
                }))
              }}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 3 && (
            <StepDailyGoal
              key="daily-goal"
              value={data.dailyGoalHours}
              onChange={(v) => update('dailyGoalHours', v)}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 4 && (
            <StepDifficulty
              key="difficulty"
              value={data.difficulties}
              onToggle={(d) => {
                setData(prev => ({
                  ...prev,
                  difficulties: prev.difficulties.includes(d)
                    ? prev.difficulties.filter(x => x !== d)
                    : [...prev.difficulties, d],
                }))
              }}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 5 && (
            <StepReady
              key="ready"
              loading={loading}
              onComplete={handleComplete}
              onBack={goBack}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
