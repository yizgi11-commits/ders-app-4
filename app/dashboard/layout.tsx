import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/subscription'
import { trackDailyLogin } from '@/lib/analytics/track'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'
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

  const ad    = user.user_metadata?.ad ?? user.email?.split('@')[0] ?? 'Öğrenci'
  const email = user.email ?? ''

  void trackDailyLogin(supabase, user.id)

  return (
    <GamificationProvider>
      <AssistProvider>
        <div className="flex min-h-screen bg-[oklch(0.979_0.003_250)]">
          <Sidebar tier={tier} />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header userName={ad} userEmail={email} />
            <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
        </div>
        <FloatingAssist tier={tier} />
      </AssistProvider>
    </GamificationProvider>
  )
}
