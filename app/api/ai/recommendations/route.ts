import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { collectUserStats } from '@/lib/ai/collect-stats'
import { generateSmartRecommendations } from '@/lib/ai/smart-recommendations'

export const runtime = 'nodejs'

// GET /api/ai/recommendations
// Uses smart algorithm — no AI API call needed
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const stats = await collectUserStats(supabase, user.id)
  const data = generateSmartRecommendations(stats)

  return NextResponse.json(data)
}
