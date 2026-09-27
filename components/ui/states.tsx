'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Shared empty / error / check primitives — one voice across every page.

/** Quiet empty state: small line icon, one sentence, one hint, optional actions. */
export function EmptyState({ icon: Icon, title, description, children, className, tone = 'neutral' }: {
  icon?:        LucideIcon
  title:        string
  description?: string
  children?:    React.ReactNode   // action buttons
  className?:   string
  tone?:        'neutral' | 'success'
}) {
  return (
    <div className={cn('py-12 text-center', className)}>
      {Icon && <Icon className={cn('size-5 mx-auto', tone === 'success' ? 'text-success' : 'text-text-muted')} aria-hidden />}
      <p className="mt-3 text-base font-medium text-text">{title}</p>
      {description && <p className="mt-1 text-sm text-text-secondary max-w-sm mx-auto">{description}</p>}
      {children && <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{children}</div>}
    </div>
  )
}

/** Ghost action used inside empty/error states. */
export function StateAction({ onClick, href, children }: { onClick?: () => void; href?: string; children: React.ReactNode }) {
  const cls = 'inline-flex items-center gap-1.5 h-10 px-4 rounded-md border border-border bg-surface text-sm font-medium text-text hover:border-border-strong hover:bg-surface-subtle transition-colors duration-[120ms]'
  if (href) return <a href={href} className={cls}>{children}</a>
  return <button type="button" onClick={onClick} className={cls}>{children}</button>
}

/** Plain-language fetch failure with a retry. */
export function ErrorState({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn('rounded-lg bg-danger-soft px-5 py-6 text-center', className)}>
      <p className="text-base font-medium text-text">Bir şey ters gitti.</p>
      <p className="mt-1 text-sm text-text-secondary">Verilerini yükleyemedik.</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center h-10 px-4 rounded-md border border-border-strong bg-transparent text-sm font-medium text-text hover:bg-surface/60 transition-colors duration-[120ms]"
        >
          Tekrar dene
        </button>
      )}
    </div>
  )
}

/** Checkmark that draws itself (200ms) — for task-completion checkboxes. */
export function AnimatedCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={cn('size-3', className)} aria-hidden>
      <motion.path
        d="M2.5 6.2 5 8.6l4.5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      />
    </svg>
  )
}
