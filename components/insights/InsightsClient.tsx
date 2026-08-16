'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { BarChart2 } from 'lucide-react'
import type { AnalyticsData } from '@/lib/analytics/types'
import WeekMetrics from './WeekMetrics'
import ProductiveHours from './ProductiveHours'
import NoeticInsight from './NoeticInsight'
import WeeklyReportButton from './WeeklyReportButton'

// Recharts is heavy — kept lazy, exactly as the old analytics page did.
const SubjectDistribution = dynamic(() => import('@/components/analytics/SubjectDistribution'), { ssr: false })
const FocusHeatmap        = dynamic(() => import('@/components/analytics/FocusHeatmap'),        { ssr: false })

export default function InsightsClient({ data }: { data: AnalyticsData }) {
  return (
    <div className="space-y-8">
      {/* ── Layer 1 — objective metrics ───────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-900">Metrics</h2>
          </div>
          <WeeklyReportButton />
        </div>

        <WeekMetrics data={data} />

        <ProductiveHours hourly={data.hourlyStats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SubjectDistribution subjects={data.subjectStats} />
          <FocusHeatmap data={data.dailyFocus} />
        </div>
      </section>

      {/* ── Layer 2 — AI commentary ───────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <NoeticInsight />
      </motion.section>
    </div>
  )
}
