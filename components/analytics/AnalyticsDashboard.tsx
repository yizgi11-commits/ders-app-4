'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import type { AnalyticsData } from '@/lib/analytics/types'

// Always-visible, lightweight
import StatsSummaryGrid    from './StatsSummaryGrid'
import ProductivityScore   from './ProductivityScore'
import InsightsPanel       from './InsightsPanel'
import SubjectDistribution from './SubjectDistribution'

// Heavy (Recharts) — lazy loaded per tab
const WeeklyBarChart   = dynamic(() => import('./WeeklyBarChart'),   { ssr: false })
const MonthlyLineChart = dynamic(() => import('./MonthlyLineChart'), { ssr: false })
const TaskDonutChart   = dynamic(() => import('./TaskDonutChart'),   { ssr: false })
const FocusHeatmap     = dynamic(() => import('./FocusHeatmap'),     { ssr: false })
const PomodoroStats    = dynamic(() => import('./PomodoroStats'),    { ssr: false })

type Tab = 'genel' | 'haftalik' | 'aylik' | 'odak'

const TABS: { id: Tab; label: string }[] = [
  { id: 'genel',    label: 'Genel Bakış' },
  { id: 'haftalik', label: 'Bu Hafta'    },
  { id: 'aylik',    label: '30 Gün'      },
  { id: 'odak',     label: 'Odak & Seans'},
]

interface Props { data: AnalyticsData }

export default function AnalyticsDashboard({ data }: Props) {
  const [tab, setTab] = useState<Tab>('genel')

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
      >
        <h1 className="text-xl font-black text-gray-900 tracking-tight">İstatistikler</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Çalışma alışkanlıkların, XP büyümen ve odak verilerin
        </p>
      </motion.div>

      {/* Tab bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex bg-white rounded-xl border border-border p-1 gap-0.5 w-fit shadow-sm"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
            style={{ color: tab === id ? undefined : undefined }}
          >
            {tab === id && (
              <motion.div
                layoutId="analytics-tab"
                className="absolute inset-0 bg-indigo-600 rounded-lg"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className={`relative z-10 ${tab === id ? 'text-white' : 'text-muted-foreground hover:text-gray-700'}`}>
              {label}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Summary row — always visible */}
      <StatsSummaryGrid data={data} />

      {/* Tab content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === 'genel' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <WeeklyBarChart   data={data.dailyFocus.slice(-7)} />
                <SubjectDistribution subjects={data.subjectStats} />
              </div>
              <div className="space-y-4">
                <ProductivityScore score={data.productivityScore} />
                <InsightsPanel insights={data.insights} />
              </div>
            </div>
          )}

          {tab === 'haftalik' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <WeeklyBarChart data={data.dailyFocus.slice(-7)} />
              <TaskDonutChart dailyTasks={data.dailyTasks.slice(-7)} />
              <SubjectDistribution subjects={data.subjectStats} />
              <InsightsPanel insights={data.insights} />
            </div>
          )}

          {tab === 'aylik' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="lg:col-span-2">
                <MonthlyLineChart dailyXP={data.dailyXP} dailyFocus={data.dailyFocus} />
              </div>
              <FocusHeatmap data={data.dailyFocus} />
              <TaskDonutChart dailyTasks={data.dailyTasks} />
            </div>
          )}

          {tab === 'odak' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PomodoroStats stats={data.pomodoroStats} />
              <ProductivityScore score={data.productivityScore} />
              <div className="lg:col-span-2">
                <FocusHeatmap data={data.dailyFocus} />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
