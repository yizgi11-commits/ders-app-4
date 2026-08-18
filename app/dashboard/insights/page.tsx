import { redirect } from 'next/navigation'
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
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Insights</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Verilerin ne söylüyor?</p>
      </div>

      <InsightsClient data={analytics} learningScore={learningScore} tier={tier} />
    </div>
  )
}
