import { cn } from '@/lib/utils'

/**
 * Small tracked section label ("TODAY'S PLAN", "EXAMS", …).
 * Pass the text already uppercase — CSS `uppercase` under lang="tr" turns i into İ.
 */
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-[11px] font-medium tracking-[0.08em] text-text-muted', className)}>{children}</p>
}
