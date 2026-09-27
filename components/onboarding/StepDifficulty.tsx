'use client'

import { DIFFICULTY_OPTIONS } from '@/lib/onboarding/types'
import type { StudyDifficulty } from '@/lib/onboarding/types'
import { StepFrame, Option } from './ui'

interface Props {
  value: StudyDifficulty[]
  onToggle: (v: StudyDifficulty) => void
  onNext: () => void
  onBack: () => void
}

export default function StepDifficulty({ value, onToggle, onNext, onBack }: Props) {
  return (
    <StepFrame
      title="En çok hangi sorunu yaşıyorsun?"
      subtitle="Birden fazla seçebilirsin — önerileri buna göre şekillendireceğiz."
      onBack={onBack}
      onNext={onNext}
    >
      <div role="group" aria-label="Zorluklar" className="space-y-2">
        {DIFFICULTY_OPTIONS.map(opt => (
          <Option key={opt.value} multi selected={value.includes(opt.value)} onClick={() => onToggle(opt.value)}>
            <span className="text-base font-medium text-text">{opt.emoji} {opt.label}</span>
          </Option>
        ))}
      </div>
    </StepFrame>
  )
}
