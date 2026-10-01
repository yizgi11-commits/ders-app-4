'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EASE_CURVE } from '@/lib/motion'
import { GRADE_CONFIG, RECALL_GRADES, type RecallGrade, type RecallStats } from '@/lib/recall/types'

const GRADE_BAR: Record<RecallGrade, string> = {
  again: 'bg-danger', hard: 'bg-warning', good: 'bg-accent', easy: 'bg-success',
}
const GRADE_TEXT: Record<RecallGrade, string> = {
  again: 'text-danger', hard: 'text-warning', good: 'text-accent', easy: 'text-success',
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-text mb-3">{children}</p>
}

export default function RecallAnalytics({ stats }: { stats: RecallStats | null }) {
  if (!stats) {
    return (
      <div className="space-y-4">
        <div className="h-16 rounded-md skeleton-shimmer" />
        <div className="h-40 rounded-md skeleton-shimmer" />
      </div>
    )
  }

  const maxScheduled = Math.max(1, ...stats.schedule.map(d => d.count))

  const headline: { value: string; label: string; hint?: string }[] = [
    { value: String(stats.totalReviews), label: 'Toplam tekrar' },
    { value: `%${stats.successRate}`, label: 'Başarı oranı', hint: 'İyi + Kolay' },
    { value: `%${stats.weeklyCompletion}`, label: 'Bu hafta tamamlama', hint: `${stats.weeklyReviewed} yapıldı · ${stats.weeklyOverdue} geciken` },
    { value: String(stats.gradeBreakdown.again + stats.gradeBreakdown.hard), label: 'Zorlanılan cevap', hint: 'Tekrar + Zor' },
  ]

  return (
    <div className="space-y-10">
      {/* ── Headline stats — one row, no tiles ───────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 sm:divide-x sm:divide-border">
        {headline.map(h => (
          <div key={h.label} className="sm:px-5 sm:first:pl-0">
            <p className="tabular text-xl text-text">{h.value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{h.label}</p>
            {h.hint && <p className="text-[11px] text-text-muted mt-0.5">{h.hint}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ── Grade breakdown + hardest topics ─────────────── */}
        <div className="space-y-8">
          <div>
            <Label>Cevap dağılımı</Label>
            {stats.totalReviews === 0 ? (
              <p className="text-sm text-text-muted">Henüz tekrar yapılmadı.</p>
            ) : (
              <>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-border mb-3">
                  {RECALL_GRADES.map(g => {
                    const pct = (stats.gradeBreakdown[g] / stats.totalReviews) * 100
                    if (pct === 0) return null
                    return <div key={g} className={GRADE_BAR[g]} style={{ width: `${pct}%` }} />
                  })}
                </div>
                <div className="grid grid-cols-4">
                  {RECALL_GRADES.map(g => (
                    <div key={g}>
                      <p className="tabular text-base text-text">{stats.gradeBreakdown[g]}</p>
                      <p className={cn('text-xs font-medium', GRADE_TEXT[g])}>{GRADE_CONFIG[g].label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <Label>En zor konular</Label>
            {stats.hardestTopics.length === 0 ? (
              <p className="text-sm text-text-muted">Henüz zorlanılan bir konu yok.</p>
            ) : (
              <ul className="border-t border-border">
                {stats.hardestTopics.map(t => {
                  const pct = t.totalCount > 0 ? Math.round((t.hardCount / t.totalCount) * 100) : 0
                  return (
                    <li key={t.topicId ?? '__none__'} className="h-10 flex items-center gap-3 border-b border-border">
                      <span className="text-sm text-text flex-1 min-w-0 truncate">{t.topicTitle}</span>
                      <span className="w-20 h-1 bg-border rounded-full overflow-hidden shrink-0">
                        <span className="block h-full bg-warning rounded-full" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="tabular text-xs text-text-muted w-12 text-right shrink-0">
                        {t.hardCount}/{t.totalCount}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── 7-day schedule ───────────────────────────────── */}
        <div>
          <Label>Recall programı</Label>
          <p className="text-xs text-text-muted -mt-2 mb-4">Önümüzdeki 7 günde tekrara gelecek kartlar</p>
          <div className="space-y-2.5">
            {stats.schedule.map((day, i) => (
              <div key={day.date} className="flex items-center gap-3">
                <span className={cn('text-xs w-24 shrink-0', i === 0 ? 'font-medium text-text' : 'text-text-secondary')}>
                  {day.label}
                </span>
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full', i === 0 ? 'bg-accent' : 'bg-accent/40')}
                    initial={{ width: 0 }}
                    animate={{ width: `${(day.count / maxScheduled) * 100}%` }}
                    transition={{ duration: 0.5, delay: i * 0.04, ease: EASE_CURVE }}
                  />
                </div>
                <span className="tabular text-xs text-text-secondary w-8 text-right shrink-0">{day.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
