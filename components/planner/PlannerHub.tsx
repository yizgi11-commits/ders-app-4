'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import TasksPanel from './TasksPanel'
import WeeklyCalendar from './WeeklyCalendar'
import GoalsPanel from './GoalsPanel'
import ExamsPanel from './ExamsPanel'
import PlannerClient from './PlannerClient'
import { textButtonClass, shortDate } from './ui'
import { getWeekStart, addDays, todayStr } from './week'

type Tab = 'tasks' | 'calendar' | 'goals' | 'exams'

const TABS: { id: Tab; label: string }[] = [
  { id: 'tasks',    label: 'Görevler' },
  { id: 'calendar', label: 'Takvim' },
  { id: 'goals',    label: 'Hedefler' },
  { id: 'exams',    label: 'Sınavlar' },
]

export default function PlannerHub() {
  const [tab, setTab] = useState<Tab>('tasks')
  const [showAiPlanner, setShowAiPlanner] = useState(false)
  // Lives here (not in the Calendar) so the week navigation can sit in the page header.
  const [weekStart, setWeekStart] = useState(() => getWeekStart(todayStr()))

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 mb-6">
        <h1 className="text-2xl font-semibold text-text">Planner</h1>

        <div className="flex items-center gap-5">
          {/* Week navigation drives the Calendar tab (Tasks lists the next 30 days) */}
          {tab === 'calendar' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                aria-label="Önceki hafta"
                className="p-1.5 rounded-md text-text-secondary hover:text-text hover:bg-surface-subtle transition-colors duration-[160ms]"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="tabular-nums text-base font-medium text-text min-w-[128px] text-center">
                {shortDate(weekStart)} – {shortDate(addDays(weekStart, 6))}
              </span>
              <button
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                aria-label="Sonraki hafta"
                className="p-1.5 rounded-md text-text-secondary hover:text-text hover:bg-surface-subtle transition-colors duration-[160ms]"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
          <button onClick={() => setShowAiPlanner(true)} className={textButtonClass}>
            <Sparkles className="size-3.5" /> Sınava göre plan oluştur
          </button>
        </div>
      </div>

      {/* Underline tabs */}
      <div role="tablist" aria-label="Planner" className="flex gap-6 border-b border-border">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              '-mb-px pb-2.5 border-b-2 text-base font-medium transition-colors duration-[160ms]',
              tab === id
                ? 'border-accent text-text'
                : 'border-transparent text-text-secondary hover:text-text',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Enter-only fade: the new tab mounts immediately instead of waiting
          for the old one's exit animation (mode="wait" could leave it stuck). */}
      <motion.div
        key={tab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.12 }}
        className="mt-6"
      >
        {tab === 'tasks'    && <TasksPanel />}
        {tab === 'calendar' && <WeeklyCalendar weekStart={weekStart} />}
        {tab === 'goals'    && <GoalsPanel />}
        {tab === 'exams'    && <ExamsPanel />}
      </motion.div>

      {/* AI Planner (existing schedule_blocks system) — opt-in, never the default view */}
      <AnimatePresence>
        {showAiPlanner && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/40 overflow-y-auto py-8 px-4"
            onClick={() => setShowAiPlanner(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              onClick={e => e.stopPropagation()}
              className="bg-background rounded-lg border border-border max-w-5xl mx-auto p-5 relative shadow-lg"
            >
              <button
                onClick={() => setShowAiPlanner(false)}
                aria-label="Kapat"
                className="absolute top-4 right-4 z-10 p-1.5 rounded-md bg-surface border border-border text-text-secondary hover:text-text"
              >
                <X className="size-4" />
              </button>
              <PlannerClient />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
