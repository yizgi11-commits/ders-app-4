'use client'

import { motion } from 'framer-motion'
import { BarChart2, Target, AlertTriangle, CalendarDays, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GRADE_CONFIG, RECALL_GRADES, type RecallStats } from '@/lib/recall/types'

export default function RecallAnalytics({ stats }: { stats: RecallStats | null }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-56 bg-white border border-border rounded-2xl animate-pulse" />
        <div className="h-56 bg-white border border-border rounded-2xl animate-pulse" />
      </div>
    )
  }

  const maxScheduled = Math.max(1, ...stats.schedule.map(d => d.count))

  return (
    <div className="space-y-4">
      {/* ── Headline stats ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          icon={Repeat} color="indigo"
          value={String(stats.totalReviews)}
          label="Toplam tekrar"
        />
        <StatTile
          icon={Target} color="emerald"
          value={`%${stats.successRate}`}
          label="Başarı oranı"
          hint="Good + Easy"
        />
        <StatTile
          icon={BarChart2} color="violet"
          value={`%${stats.weeklyCompletion}`}
          label="Bu hafta tamamlama"
          hint={`${stats.weeklyReviewed} yapıldı · ${stats.weeklyOverdue} geciken`}
        />
        <StatTile
          icon={AlertTriangle} color="amber"
          value={String(stats.gradeBreakdown.again + stats.gradeBreakdown.hard)}
          label="Zorlanılan cevap"
          hint="Again + Hard"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Grade breakdown + hardest topics ─────────────── */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-5">
          <div>
            <p className="text-sm font-bold text-gray-900 mb-3">Cevap dağılımı</p>
            {stats.totalReviews === 0 ? (
              <p className="text-xs text-muted-foreground">Henüz tekrar yapılmadı.</p>
            ) : (
              <>
                <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 mb-3">
                  {RECALL_GRADES.map(g => {
                    const pct = (stats.gradeBreakdown[g] / stats.totalReviews) * 100
                    if (pct === 0) return null
                    const bar: Record<string, string> = {
                      again: 'bg-red-400', hard: 'bg-amber-400',
                      good: 'bg-indigo-500', easy: 'bg-emerald-500',
                    }
                    return <div key={g} className={bar[g]} style={{ width: `${pct}%` }} />
                  })}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {RECALL_GRADES.map(g => (
                    <div key={g} className="text-center">
                      <p className={cn('text-lg font-black', GRADE_CONFIG[g].color)}>{stats.gradeBreakdown[g]}</p>
                      <p className="text-[10px] text-muted-foreground">{GRADE_CONFIG[g].label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm font-bold text-gray-900 mb-3">En zor konular</p>
            {stats.hardestTopics.length === 0 ? (
              <p className="text-xs text-muted-foreground">Henüz zorlanılan bir konu yok.</p>
            ) : (
              <div className="space-y-2">
                {stats.hardestTopics.map(t => {
                  const pct = t.totalCount > 0 ? Math.round((t.hardCount / t.totalCount) * 100) : 0
                  return (
                    <div key={t.topicId ?? '__none__'} className="flex items-center gap-3">
                      <span className="text-xs text-gray-700 flex-1 min-w-0 truncate">{t.topicTitle}</span>
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] font-semibold text-amber-600 tabular-nums w-14 text-right shrink-0">
                        {t.hardCount}/{t.totalCount}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── 7-day schedule ───────────────────────────────── */}
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-500" />
            Recall programı
          </p>
          <p className="text-xs text-muted-foreground mb-4">Önümüzdeki 7 günde tekrara gelecek kartlar</p>

          <div className="space-y-2">
            {stats.schedule.map((day, i) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3"
              >
                <span className={cn(
                  'text-xs w-24 shrink-0',
                  i === 0 ? 'font-bold text-indigo-600' : 'text-muted-foreground',
                )}>
                  {day.label}
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full', i === 0 ? 'bg-indigo-500' : 'bg-indigo-300')}
                    initial={{ width: 0 }}
                    animate={{ width: `${(day.count / maxScheduled) * 100}%` }}
                    transition={{ duration: 0.5, delay: i * 0.04 }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 tabular-nums w-10 text-right shrink-0">
                  {day.count}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const TILE_COLORS = {
  indigo:  { bg: 'bg-indigo-50/80',  ring: 'ring-indigo-100',  icon: 'text-indigo-600',  border: 'border-indigo-100' },
  emerald: { bg: 'bg-emerald-50/80', ring: 'ring-emerald-100', icon: 'text-emerald-600', border: 'border-emerald-100' },
  violet:  { bg: 'bg-violet-50/80',  ring: 'ring-violet-100',  icon: 'text-violet-600',  border: 'border-violet-100' },
  amber:   { bg: 'bg-amber-50/80',   ring: 'ring-amber-100',   icon: 'text-amber-600',   border: 'border-amber-100' },
} as const

function StatTile({ icon: Icon, color, value, label, hint }: {
  icon: React.ElementType
  color: keyof typeof TILE_COLORS
  value: string
  label: string
  hint?: string
}) {
  const c = TILE_COLORS[color]
  return (
    <div className={cn('bg-white rounded-2xl border p-4 shadow-sm', c.border)}>
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center ring-1 mb-3', c.bg, c.ring)}>
        <Icon className={cn('w-4 h-4', c.icon)} />
      </div>
      <p className="text-xl font-black text-gray-900 tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {hint && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{hint}</p>}
    </div>
  )
}
