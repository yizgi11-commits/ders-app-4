import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchAnalyticsData } from '@/lib/analytics/queries'
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'

export const metadata = { title: 'İstatistikler — Noetic OS' }

// Revalidate every 5 minutes so data stays fresh but server renders fast
export const revalidate = 300

export default async function IstatistikPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/giris')

  // Fetch all analytics data server-side in parallel
  const analytics = await fetchAnalyticsData(supabase, user.id)

  return <AnalyticsDashboard data={analytics} />
}
