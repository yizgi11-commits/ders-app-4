'use client'

import { formatFocus, hasActivity, type JourneyDay } from '@/lib/journey/types'
import { ACHIEVEMENT_MAP } from '@/lib/gamification/achievements'
import { dateKey } from '@/components/ui/heat-grid'
import { cn } from '@/lib/utils'
import { Milestone } from 'lucide-react'
import { EmptyState, StateAction } from '@/components/ui/states'

interface Props {
  days:      JourneyDay[]
  /** Unlocked milestones — shown as highlighted events on the day they happened. */
  unlocked?: { achievement_id: string; unlocked_at: string }[]
  limit?:    number
}

/** "23 EYL" */
function shortHeading(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00')
    .toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    .toLocaleUpperCase('tr-TR')
}

export default function JourneyTimeline({ days, unlocked = [], limit = 30 }: Props) {
  const active = days.filter(hasActivity).slice(0, limit)

  // Milestones grouped by the local day they were unlocked.
  const eventsByDay = new Map<string, { icon: string; title: string }[]>()
  for (const u of unlocked) {
    const a = ACHIEVEMENT_MAP.get(u.achievement_id)
    if (!a) continue
    const key = dateKey(new Date(u.unlocked_at))
    eventsByDay.set(key, [...(eventsByDay.get(key) ?? []), { icon: a.icon, title: a.title }])
  }

  if (active.length === 0) {
    return (
      <EmptyState
        icon={Milestone}
        title="Öğrenme geçmişin burada görünecek."
        description="İlk Focus oturumunu tamamlayarak başla."
        className="border-y border-border"
      >
        <StateAction href="/dashboard/focus">Focus&apos;a git</StateAction>
      </EmptyState>
    )
  }

  return (
    <ol className="relative">
      {/* Spine */}
      <span aria-hidden className="absolute left-[2.5px] top-2 bottom-2 w-px bg-border" />

      {active.map(day => {
        const events = eventsByDay.get(day.date) ?? []
        const parts: React.ReactNode[] = []
        if (day.focusMinutes > 0)   parts.push(<><span className="tabular-nums">{formatFocus(day.focusMinutes)}</span> Focus</>)
        if (day.topicsStudied > 0)  parts.push(<><span className="tabular">{day.topicsStudied}</span> konu çalışıldı</>)
        if (day.recallCards > 0)    parts.push(<><span className="tabular">{day.recallCards}</span> Recall kartı</>)
        if (day.tasksCompleted > 0) parts.push(<><span className="tabular">{day.tasksCompleted}</span> görev tamamlandı</>)

        return (
          <li key={day.date} className="relative pl-6 pb-6 last:pb-0">
            {/* Node — accent when the day holds a milestone */}
            <span
              aria-hidden
              className={cn(
                'absolute left-0 top-[5px] size-1.5 rounded-full',
                events.length > 0 ? 'bg-accent' : 'bg-surface border border-border-strong',
              )}
            />
            <p className="tabular text-[11px] tracking-[0.06em] text-text-muted">{shortHeading(day.date)}</p>
            <p className="mt-1 text-base text-text">
              {parts.map((p, i) => (
                <span key={i}>{i > 0 && <span className="text-text-muted"> · </span>}{p}</span>
              ))}
            </p>
            {events.map((e, i) => (
              <p key={i} className="mt-1 text-sm text-accent">
                {e.icon} Kilometre taşı — {e.title}
              </p>
            ))}
          </li>
        )
      })}
    </ol>
  )
}
