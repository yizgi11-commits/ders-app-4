import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from '@/components/settings/SettingsClient'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <SettingsClient
      initial={{
        ad:    user.user_metadata?.ad ?? '',
        email: user.email ?? '',
        profile,
      }}
    />
  )
}
