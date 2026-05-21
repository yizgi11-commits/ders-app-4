import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AICoachPageClient from '@/components/ai/AICoachPageClient'

export default async function AICoachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const ad = user.user_metadata?.ad ?? user.email?.split('@')[0] ?? 'Öğrenci'

  return <AICoachPageClient userName={ad} />
}
