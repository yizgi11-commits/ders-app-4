import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfileData } from '@/lib/profile/queries'
import ProfileClient from '@/components/profile/ProfileClient'

export const metadata = { title: 'Profil' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const data = await getProfileData(supabase, user)

  return (
    <div className="max-w-3xl mx-auto">
      {/* The header's page title already says "Profile" — the name is the heading here. */}
      <ProfileClient data={data} />
    </div>
  )
}
