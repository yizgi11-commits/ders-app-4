'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_CURVE } from '@/lib/motion'

// Shared building blocks for the onboarding steps: calm, light, one question per screen.

export function StepFrame({ title, subtitle, children, onBack, onNext, nextLabel = 'Devam' }: {
  title:      string
  subtitle?:  string
  children:   React.ReactNode
  onBack?:    () => void
  onNext:     () => void
  nextLabel?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE_CURVE }}
    >
      <h2 className="text-[24px] leading-8 font-semibold text-text">{title}</h2>
      {subtitle && <p className="mt-1.5 text-base text-text-secondary">{subtitle}</p>}

      <div className="mt-8">{children}</div>

      <div className="mt-10 flex items-center justify-between">
        {onBack ? (
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors duration-[160ms]">
            <ArrowLeft className="size-3.5" /> Geri
          </button>
        ) : <span />}
        <button
          onClick={onNext}
          className="h-10 px-6 rounded-md bg-accent hover:bg-accent-dark text-white text-base font-medium transition-colors duration-[160ms]"
        >
          {nextLabel}
        </button>
      </div>
    </motion.div>
  )
}

/** A radio (single) or checkbox (multi) row. */
export function Option({ selected, onClick, multi = false, children }: {
  selected: boolean
  onClick:  () => void
  multi?:   boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors duration-[160ms]',
        selected ? 'border-accent bg-accent-soft' : 'border-border bg-surface hover:border-border-strong',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-4 shrink-0 flex items-center justify-center border transition-colors duration-[160ms]',
          multi ? 'rounded-sm' : 'rounded-full',
          selected ? 'border-accent bg-accent' : 'border-border-strong bg-surface',
        )}
      >
        {selected && (multi
          ? <Check className="size-3 text-white" strokeWidth={3} />
          : <span className="size-1.5 rounded-full bg-white" />)}
      </span>
      <span className="flex-1 min-w-0">{children}</span>
    </button>
  )
}
