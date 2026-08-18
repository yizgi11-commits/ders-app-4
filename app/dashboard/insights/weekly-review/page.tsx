import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCachedWeeklyReview } from '@/lib/weeklyReview'
import { getUserTier } from '@/lib/subscription'
import WeeklyReviewClient from '@/components/insights/WeeklyReviewClient'

export const metadata = { title: 'Weekly Review' }

// This route is force-dynamic (createClient() reads the session cookie).
// The review itself is app_cache-backed (24h, invalidated on
// task/pomodoro/recall completion) via getCachedWeeklyReview.
export default async function WeeklyReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const [review, tier] = await Promise.all([
    getCachedWeeklyReview(supabase, user.id),
    getUserTier(supabase, user.id),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <Link href="/dashboard/insights" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gray-700 transition-colors mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Insights
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Your Week</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Bu haftanın özeti — tamamen veriden, yorum yok.</p>
      </div>

      <WeeklyReviewClient data={review} tier={tier} />
    </div>
  )
}
