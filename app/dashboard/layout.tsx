import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  // Check onboarding status — redirect if not completed
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile?.onboarding_completed) {
    redirect('/onboarding')
  }

  const ad    = user.user_metadata?.ad ?? user.email?.split('@')[0] ?? 'Öğrenci'
  const email = user.email ?? ''

  return (
    <GamificationProvider>
      <AssistProvider>
        <div className="flex min-h-screen bg-[oklch(0.979_0.003_250)]">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header userName={ad} userEmail={email} />
            <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
        </div>
        <FloatingAssist />
      </AssistProvider>
    </GamificationProvider>
  )
}
