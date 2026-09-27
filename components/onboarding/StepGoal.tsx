'use client'

import { STUDY_GOALS } from '@/lib/onboarding/types'
import type { StudyGoal } from '@/lib/onboarding/types'
import { StepFrame, Option } from './ui'

interface Props {
  value: StudyGoal
  onChange: (v: StudyGoal) => void
  onNext: () => void
  onBack?: () => void
}

export default function StepGoal({ value, onChange, onNext, onBack }: Props) {
  return (
    <StepFrame
      title="Ne başarmak istiyorsun?"
      subtitle="Sana en uygun planı oluşturmamıza yardımcı olur."
      onBack={onBack}
      onNext={onNext}
    >
      <div role="radiogroup" aria-label="Hedef" className="space-y-2">
        {STUDY_GOALS.map(goal => (
          <Option key={goal.value} selected={value === goal.value} onClick={() => onChange(goal.value)}>
            <span className="block text-base font-medium text-text">{goal.emoji} {goal.label}</span>
            <span className="block text-sm text-text-secondary mt-0.5">{goal.desc}</span>
          </Option>
        ))}
      </div>
    </StepFrame>
  )
}
