import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getJourneyData } from '@/lib/journey/queries'
import JourneyClient from '@/components/journey/JourneyClient'

export const metadata = { title: 'Journey' }

export default async function JourneyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const data = await getJourneyData(supabase, user.id)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text">Journey</h1>
        <p className="text-base text-text-secondary mt-1">Öğrenme geçmişin.</p>
      </div>

      <JourneyClient data={data} />
    </div>
  )
}
