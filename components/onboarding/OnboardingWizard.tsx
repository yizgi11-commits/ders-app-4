'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type {
  OnboardingData, StudyGoal, ExamType, PreferredHours,
  FocusIntensity, ConsistencyLevel,
} from '@/lib/onboarding/types'
import { ONBOARDING_STEPS, DEFAULT_SUBJECTS } from '@/lib/onboarding/types'
import StepWelcome from './StepWelcome'
import StepGoal from './StepGoal'
import StepTime from './StepTime'
import StepSubjects from './StepSubjects'
import StepHabits from './StepHabits'
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
    displayName:      userName,
    studyGoal:        'genel_basari',
    examType:         null,
    dailyAvailMins:   120,
    weakSubjects:     [],
    preferredHours:   'evening',
    focusIntensity:   'normal',
    consistencyLevel: 'sometimes',
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
  const availableSubjects = DEFAULT_SUBJECTS[data.studyGoal] ?? DEFAULT_SUBJECTS.genel_basari

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
      {step > 0 && (
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
      )}

      {/* Step content */}
      <div className="relative z-10 w-full max-w-xl px-6">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepWelcome
              key="welcome"
              name={data.displayName}
              onNext={goNext}
            />
          )}
          {step === 1 && (
            <StepGoal
              key="goal"
              value={data.studyGoal}
              examType={data.examType}
              onChange={(g) => update('studyGoal', g)}
              onExamChange={(e) => update('examType', e)}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 2 && (
            <StepTime
              key="time"
              dailyMins={data.dailyAvailMins}
              preferredHours={data.preferredHours}
              onDailyChange={(v) => update('dailyAvailMins', v)}
              onHoursChange={(v) => update('preferredHours', v)}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 3 && (
            <StepSubjects
              key="subjects"
              subjects={availableSubjects}
              weakSubjects={data.weakSubjects}
              onToggleWeak={(name) => {
                setData(prev => ({
                  ...prev,
                  weakSubjects: prev.weakSubjects.includes(name)
                    ? prev.weakSubjects.filter(n => n !== name)
                    : [...prev.weakSubjects, name],
                }))
              }}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 4 && (
            <StepHabits
              key="habits"
              intensity={data.focusIntensity}
              consistency={data.consistencyLevel}
              onIntensityChange={(v) => update('focusIntensity', v)}
              onConsistencyChange={(v) => update('consistencyLevel', v)}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 5 && (
            <StepReady
              key="ready"
              data={data}
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
