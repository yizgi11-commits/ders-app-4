'use client'

import { motion } from 'framer-motion'
import { EASE_CURVE } from '@/lib/motion'
import type { JourneyResponse } from '@/lib/journey/types'
import { SectionLabel } from '@/components/ui/section-label'
import JourneyTimeline from './JourneyTimeline'
import JourneyCalendar from './JourneyCalendar'
import JourneyMilestones from './JourneyMilestones'

export default function JourneyClient({ data }: { data: JourneyResponse }) {
  return (
    <div className="space-y-12">
      {/* Level + XP + streak */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <SectionLabel>LEVEL</SectionLabel>
            <p className="mt-1 text-2xl font-semibold text-text">
              Level <span className="tabular">{data.xp.level}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-base font-medium text-text">
              🔥 <span className="tabular">{data.streak.current}</span> {data.streak.current === 1 ? 'day' : 'days'}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              Rekor: <span className="tabular">{data.streak.longest}</span> gün
            </p>
          </div>
        </div>

        <div className="mt-4 h-1 rounded-full bg-border overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${data.xp.pct}%` }}
            transition={{ duration: 0.8, ease: EASE_CURVE }}
          />
        </div>
        <p className="mt-2 text-sm text-text-muted">
          <span className="tabular">{data.xp.current} / {data.xp.required}</span> XP — sonraki seviyeye
          {' · '}Toplam <span className="tabular">{data.xp.totalXp.toLocaleString('tr-TR')}</span> XP
        </p>
      </section>

      <section>
        <SectionLabel className="mb-3">CALENDAR</SectionLabel>
        <JourneyCalendar days={data.days} />
      </section>

      <section>
        <SectionLabel className="mb-4">TIMELINE</SectionLabel>
        <JourneyTimeline days={data.days} unlocked={data.unlocked} />
      </section>

      <section>
        <SectionLabel className="mb-3">MILESTONES</SectionLabel>
        <JourneyMilestones unlocked={data.unlocked} />
      </section>
    </div>
  )
}
