import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchAnalyticsData } from '@/lib/analytics/queries'
import InsightsClient from '@/components/insights/InsightsClient'

export const metadata = { title: 'Insights' }

// Server-render the metric layer; the AI layer fetches on the client so a
// slow Claude call never blocks the numbers.
export const revalidate = 300

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const analytics = await fetchAnalyticsData(supabase, user.id)

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
