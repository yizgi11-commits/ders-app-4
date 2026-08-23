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
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Journey</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Öğrenme geçmişin.</p>
      </div>

      <JourneyClient data={data} />
    </div>
  )
}
