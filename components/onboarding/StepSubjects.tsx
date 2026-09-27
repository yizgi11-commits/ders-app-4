'use client'

import { StepFrame, Option } from './ui'

interface SubjectInfo {
  name: string
  icon: string
  color: string
}

interface Props {
  subjects: SubjectInfo[]
  selected: string[]
  onToggle: (name: string) => void
  onNext: () => void
  onBack: () => void
}

export default function StepSubjects({ subjects, selected, onToggle, onNext, onBack }: Props) {
  return (
    <StepFrame
      title="Hangi dersleri çalışıyorsun?"
      subtitle="İstediğin kadar seçebilirsin — programın bu derslere göre oluşturulacak."
      onBack={onBack}
      onNext={onNext}
    >
      <div role="group" aria-label="Dersler" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {subjects.map(sub => (
          <Option key={sub.name} multi selected={selected.includes(sub.name)} onClick={() => onToggle(sub.name)}>
            <span className="text-base font-medium text-text">{sub.icon} {sub.name}</span>
          </Option>
        ))}
      </div>
      <p className="mt-4 text-sm text-text-muted">
        {selected.length === 0
          ? 'Ders seçmezsen bu listedeki tüm dersler eklenir.'
          : <><span className="tabular">{selected.length}</span> ders seçildi.</>}
      </p>
    </StepFrame>
  )
}
