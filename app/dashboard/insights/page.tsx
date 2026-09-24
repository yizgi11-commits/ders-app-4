import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCachedAnalyticsData } from '@/lib/analytics/queries'
import { getCachedLearningScore } from '@/lib/dashboard/learning-score'
import { getUserTier } from '@/lib/subscription'
import InsightsClient from '@/components/insights/InsightsClient'

export const metadata = { title: 'Insights' }

// This route is force-dynamic (createClient() reads the session cookie),
// so a static `revalidate` export never applies here — the real caching
// is app_cache-backed, inside getCachedAnalyticsData (24h, invalidated
// on task/pomodoro/recall completion).
export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const [analytics, learningScore, tier] = await Promise.all([
    getCachedAnalyticsData(supabase, user.id),
    getCachedLearningScore(supabase, user.id),
    getUserTier(supabase, user.id),
  ])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text">Insights</h1>
          <p className="text-base text-text-secondary mt-1">Verilerin ne söylüyor?</p>
        </div>
        <Link
          href="/dashboard/insights/weekly-review"
          className="inline-flex items-center gap-1.5 shrink-0 text-sm font-medium text-text-secondary hover:text-accent transition-colors duration-[160ms]"
        >
          <FileText className="size-3.5" /> Haftalık rapor
        </Link>
      </div>

      <InsightsClient data={analytics} learningScore={learningScore} tier={tier} />
    </div>
  )
}
