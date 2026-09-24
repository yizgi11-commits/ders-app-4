import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/subscription'
import { trackDailyLogin } from '@/lib/analytics/track'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'
import MobileNav from '@/components/dashboard/MobileNav'
import PageTransition from '@/components/dashboard/PageTransition'
import GamificationProvider from '@/components/gamification/GamificationProvider'
import AssistProvider from '@/components/assist/AssistProvider'
import FloatingAssist from '@/components/assist/FloatingAssist'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/giris')

  // Onboarding status + tier, read in parallel. They stay separate queries on
  // purpose: if the subscription columns aren't deployed yet, the tier read
  // must fall back to 'free' without breaking the onboarding check.
  const [{ data: profile }, tier] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .maybeSingle(),
    getUserTier(supabase, user.id),
  ])

  if (!profile?.onboarding_completed) {
    redirect('/onboarding')
  }

  const ad = user.user_metadata?.ad ?? user.email?.split('@')[0] ?? 'Öğrenci'

  void trackDailyLogin(supabase, user.id)

  return (
    <GamificationProvider>
      <AssistProvider>
        <div className="flex min-h-screen bg-background">
          <Sidebar tier={tier} userName={ad} />
          {/* overflow-x-clip (not hidden) so the sticky header still sticks to the window */}
          <div className="flex-1 flex flex-col min-w-0 overflow-x-clip">
            <Header userName={ad} />
            {/* Extra bottom padding below lg clears the fixed mobile tab bar */}
            <main className="flex-1 p-4 pb-24 lg:p-6">
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
        </div>
        <MobileNav />
        <FloatingAssist tier={tier} />
      </AssistProvider>
    </GamificationProvider>
  )
}
