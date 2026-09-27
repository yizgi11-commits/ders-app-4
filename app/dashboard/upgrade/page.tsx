import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/subscription'
import UpgradeView from '@/components/subscription/UpgradeView'

export const metadata = { title: 'Upgrade' }

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const tier = await getUserTier(supabase, user.id)

  return <UpgradeView tier={tier} />
}
