'use client'

import dynamic from 'next/dynamic'
import type { AnalyticsData } from '@/lib/analytics/types'
import type { LearningScoreResponse } from '@/lib/dashboard/learning-score'
import type { SubscriptionTier } from '@/lib/subscription'
import WeekMetrics from './WeekMetrics'
import LearningScoreCard from './LearningScoreCard'
import ProductiveHours from './ProductiveHours'
import NoeticInsight from './NoeticInsight'
import ProLock from '@/components/subscription/ProLock'

// Kept lazy (below the fold), exactly as the old analytics page did.
const SubjectDistribution = dynamic(() => import('@/components/analytics/SubjectDistribution'), { ssr: false })
const FocusHeatmap        = dynamic(() => import('@/components/analytics/FocusHeatmap'),        { ssr: false })

export default function InsightsClient({ data, learningScore, tier }: {
  data: AnalyticsData
  learningScore: LearningScoreResponse
  tier: SubscriptionTier
}) {
  const detail = (
    <div className="space-y-6">
      <ProductiveHours hourly={data.hourlyStats} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubjectDistribution subjects={data.subjectStats} />
        <FocusHeatmap data={data.dailyFocus} />
      </div>
    </div>
  )

  return (
    <div className="space-y-10">
      {/* ── Layer 1 — measurements ───────────────────────────── */}
      <LearningScoreCard data={learningScore} />

      <WeekMetrics data={data} />

      {tier === 'pro' ? detail : <ProLock label="Tam analiz — Pro’da açılır">{detail}</ProLock>}

      {/* ── Layer 2 — written commentary ─────────────────────── */}
      <NoeticInsight tier={tier} />
    </div>
  )
}
