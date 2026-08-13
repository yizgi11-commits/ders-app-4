'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ListTodo, CalendarDays, Target, GraduationCap, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import TasksPanel from './TasksPanel'
import WeeklyCalendar from './WeeklyCalendar'
import GoalsPanel from './GoalsPanel'
import ExamsPanel from './ExamsPanel'
import PlannerClient from './PlannerClient'

type Tab = 'tasks' | 'calendar' | 'goals' | 'exams'

const TABS: { id: Tab; label: string; icon: typeof ListTodo }[] = [
  { id: 'tasks',    label: 'Tasks',    icon: ListTodo },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'goals',    label: 'Goals',    icon: Target },
  { id: 'exams',    label: 'Exams',    icon: GraduationCap },
]

export default function PlannerHub() {
  const [tab, setTab] = useState<Tab>('tasks')
  const [showAiPlanner, setShowAiPlanner] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex bg-white border border-border rounded-xl p-1 gap-0.5 shadow-sm">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'relative flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-lg transition-all z-10',
                tab === id ? 'text-white' : 'text-muted-foreground hover:text-gray-700'
              )}
            >
              {tab === id && (
                <motion.div
                  layoutId="planner-tab"
                  className="absolute inset-0 bg-indigo-600 rounded-lg"
                  transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                />
              )}
              <Icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>

        <motion.button
          onClick={() => setShowAiPlanner(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-200/50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generate plan from exam
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {tab === 'tasks' && <TasksPanel />}
          {tab === 'calendar' && <WeeklyCalendar />}
          {tab === 'goals' && <GoalsPanel />}
          {tab === 'exams' && <ExamsPanel />}
        </motion.div>
      </AnimatePresence>

      {/* AI Planner (existing schedule_blocks system) */}
      <AnimatePresence>
        {showAiPlanner && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm overflow-y-auto py-8 px-4"
            onClick={() => setShowAiPlanner(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
              onClick={e => e.stopPropagation()}
              className="bg-[oklch(0.979_0.003_250)] rounded-2xl max-w-5xl mx-auto p-5 relative shadow-2xl"
            >
              <button
                onClick={() => setShowAiPlanner(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg bg-white border border-border hover:bg-gray-50 flex items-center justify-center shadow-sm"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
              <PlannerClient />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
