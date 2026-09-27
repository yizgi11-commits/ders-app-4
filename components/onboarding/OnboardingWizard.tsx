'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { EASE_CURVE } from '@/lib/motion'
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
    <div className="min-h-screen bg-background">
      {/* Thin progress line + step dots */}
      <div className="fixed top-0 inset-x-0 z-50 bg-background">
        <div className="h-[3px] bg-border">
          <motion.div
            className="h-full bg-accent"
            animate={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: EASE_CURVE }}
          />
        </div>
        <div className="flex items-center justify-center gap-1.5 py-4" aria-label={`Adım ${step + 1} / ${totalSteps}`}>
          {ONBOARDING_STEPS.map((s, i) => (
            <span
              key={s.key}
              className={`size-1.5 rounded-full transition-colors duration-300 ${
                i === step ? 'bg-accent' : i < step ? 'bg-accent-muted' : 'bg-border-strong'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content — one question per screen, 560px column */}
      <div className="w-full max-w-[560px] mx-auto px-5 pt-28 pb-16">
        {!isReadyStep && (
          <p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-text-muted">NOETIC SENİ TANISIN</p>
        )}

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
      </div>
    </div>
  )
}
