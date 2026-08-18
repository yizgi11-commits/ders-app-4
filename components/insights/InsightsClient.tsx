'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BarChart2, FileText } from 'lucide-react'
import type { AnalyticsData } from '@/lib/analytics/types'
import type { LearningScoreResponse } from '@/lib/dashboard/learning-score'
import type { SubscriptionTier } from '@/lib/subscription'
import WeekMetrics from './WeekMetrics'
import LearningScoreCard from './LearningScoreCard'
import ProductiveHours from './ProductiveHours'
import NoeticInsight from './NoeticInsight'
import ProLock from '@/components/subscription/ProLock'

// Recharts is heavy — kept lazy, exactly as the old analytics page did.
const SubjectDistribution = dynamic(() => import('@/components/analytics/SubjectDistribution'), { ssr: false })
const FocusHeatmap        = dynamic(() => import('@/components/analytics/FocusHeatmap'),        { ssr: false })

export default function InsightsClient({ data, learningScore, tier }: {
  data: AnalyticsData
  learningScore: LearningScoreResponse
  tier: SubscriptionTier
}) {
  return (
    <div className="space-y-8">
      {/* ── Layer 1 — objective metrics ───────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-900">Metrics</h2>
          </div>
          <Link href="/dashboard/insights/weekly-review">
            <motion.div
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 bg-white border border-border hover:bg-gray-50 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4 text-indigo-500" />
              Haftalık Rapor
            </motion.div>
          </Link>
        </div>

        <WeekMetrics data={data} />

        <LearningScoreCard data={learningScore} />

        {tier === 'pro' ? (
          <>
            <ProductiveHours hourly={data.hourlyStats} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SubjectDistribution subjects={data.subjectStats} />
              <FocusHeatmap data={data.dailyFocus} />
            </div>
          </>
        ) : (
          <ProLock label="Tam analiz — Pro’da açılır">
            <ProductiveHours hourly={data.hourlyStats} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <SubjectDistribution subjects={data.subjectStats} />
              <FocusHeatmap data={data.dailyFocus} />
            </div>
          </ProLock>
        )}
      </section>

      {/* ── Layer 2 — AI commentary ───────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <NoeticInsight tier={tier} />
      </motion.section>
    </div>
  )
}
