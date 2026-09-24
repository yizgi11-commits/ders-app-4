'use client'

import { motion } from 'framer-motion'
import { EASE_CURVE } from '@/lib/motion'
import type { SubjectStat } from '@/lib/analytics/types'
import { SectionLabel } from '@/components/ui/section-label'

interface Props { subjects: SubjectStat[] }

// Simple horizontal bars: each subject's share of the last 30 days' tasks.
export default function SubjectDistribution({ subjects }: Props) {
  const totalTasks = subjects.reduce((s, x) => s + x.total, 0)

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <SectionLabel>SUBJECT ANALYSIS</SectionLabel>

      {subjects.length === 0 ? (
        <p className="text-sm text-text-muted py-8">Henüz yeterli veri yok</p>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {subjects.map(({ subject, total, completed }, i) => {
              const share = totalTasks > 0 ? Math.round((total / totalTasks) * 100) : 0
              return (
                <div key={subject} className="flex items-center gap-3" title={`${completed}/${total} görev tamamlandı`}>
                  <span className="w-28 shrink-0 truncate text-sm text-text">{subject}</span>
                  <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${share}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05, ease: EASE_CURVE }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right tabular text-sm text-text">{share}%</span>
                </div>
              )
            })}
          </div>

          <p className="mt-5 pt-3 border-t border-border text-xs text-text-muted">
            Son 30 günün görev dağılımı · Toplam{' '}
            <span className="tabular text-text">{subjects.reduce((s, x) => s + x.xp_earned, 0).toLocaleString('tr')}</span> XP
          </p>
        </>
      )}
    </div>
  )
}
