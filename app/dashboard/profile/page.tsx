import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfileData } from '@/lib/profile/queries'
import ProfileClient from '@/components/profile/ProfileClient'

export const metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const data = await getProfileData(supabase, user)

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
      </div>

      <ProfileClient data={data} />
    </div>
  )
}
