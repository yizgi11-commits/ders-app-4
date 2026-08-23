import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/security'
import { getJourneyData } from '@/lib/journey/queries'

// GET /api/journey — daily activity history, XP/streak, unlocked milestones.
// The initial page load is server-rendered (app/dashboard/journey/page.tsx
// calls getJourneyData directly); this route exists for client refetches.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  try {
    const data = await getJourneyData(supabase, user.id)
    return NextResponse.json(data)
  } catch (err) {
    return safeError(err, 'Journey verisi alınamadı')
  }
}
