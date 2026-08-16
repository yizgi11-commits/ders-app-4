import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCachedAnalyticsData } from '@/lib/analytics/queries'
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

  const analytics = await getCachedAnalyticsData(supabase, user.id)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Insights</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Verilerin ne söylüyor?</p>
      </div>

      <InsightsClient data={analytics} />
    </div>
  )
}
