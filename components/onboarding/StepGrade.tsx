'use client'

import { GRADE_LEVELS } from '@/lib/onboarding/types'
import type { GradeLevel } from '@/lib/onboarding/types'
import { StepFrame, Option } from './ui'

interface Props {
  value: GradeLevel | null
  onChange: (v: GradeLevel) => void
  onNext: () => void
  onBack: () => void
}

export default function StepGrade({ value, onChange, onNext, onBack }: Props) {
  return (
    <StepFrame
      title="Hangi sınıftasın?"
      subtitle="Sana uygun içerik ve zorluk seviyesini belirlememize yardımcı olur."
      onBack={onBack}
      onNext={onNext}
    >
      <div role="radiogroup" aria-label="Sınıf" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {GRADE_LEVELS.map(g => (
          <Option key={g.value} selected={value === g.value} onClick={() => onChange(g.value)}>
            <span className="text-base font-medium text-text">{g.label}</span>
          </Option>
        ))}
      </div>
    </StepFrame>
  )
}
