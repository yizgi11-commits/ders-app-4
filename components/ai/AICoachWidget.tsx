'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import AIInsightsSection from './AIInsightsSection'
import AIRecommendations from './AIRecommendations'
import WeeklyReportModal from './WeeklyReportModal'

export default function AICoachWidget() {
  const [showWeeklyReport, setShowWeeklyReport] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-4">
        <AIInsightsSection onOpenWeeklyReport={() => setShowWeeklyReport(true)} />
        <AIRecommendations />
      </div>

      {/* Weekly Report Modal */}
      <AnimatePresence>
        {showWeeklyReport && (
          <WeeklyReportModal onClose={() => setShowWeeklyReport(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
