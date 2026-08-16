import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCachedUserStats } from '@/lib/ai/collect-stats'
import { generateSmartWeeklyReport } from '@/lib/ai/smart-weekly'

export const runtime = 'nodejs'

// GET /api/insights/weekly-report
// Deterministic, template + data-driven — no Claude call, so no rate
// limit is needed. The underlying stats snapshot is app_cache-backed
// (24h, invalidated on task/pomodoro/recall completion), so repeated
// clicks within a day don't re-run the 13-query stats collection.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const stats = await getCachedUserStats(supabase, user.id)
  const report = generateSmartWeeklyReport(stats)

  return NextResponse.json(report)
}
