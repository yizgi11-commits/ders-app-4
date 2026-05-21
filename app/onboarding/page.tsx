import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/giris')

  // Check if already completed
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profile?.onboarding_completed) {
    redirect('/dashboard')
  }

  const userName = user.user_metadata?.ad ?? user.email?.split('@')[0] ?? 'Öğrenci'

  return <OnboardingWizard userName={userName} />
}
