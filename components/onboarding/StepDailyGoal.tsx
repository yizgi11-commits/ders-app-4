'use client'

import { DAILY_GOAL_OPTIONS } from '@/lib/onboarding/types'
import type { DailyGoalHours } from '@/lib/onboarding/types'
import { StepFrame, Option } from './ui'

interface Props {
  value: DailyGoalHours
  onChange: (v: DailyGoalHours) => void
  onNext: () => void
  onBack: () => void
}

export default function StepDailyGoal({ value, onChange, onNext, onBack }: Props) {
  return (
    <StepFrame
      title="Günde kaç saat çalışmayı hedefliyorsun?"
      subtitle="Günlük hedeflerini ve programını buna göre oluşturacağız."
      onBack={onBack}
      onNext={onNext}
    >
      <div role="radiogroup" aria-label="Günlük hedef" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {DAILY_GOAL_OPTIONS.map(opt => (
          <Option key={opt.value} selected={value === opt.value} onClick={() => onChange(opt.value)}>
            <span className="tabular-nums text-base font-medium text-text">{opt.label}</span>
          </Option>
        ))}
      </div>
    </StepFrame>
  )
}
