import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { collectUserStats } from '@/lib/ai/collect-stats'
import { generateSmartWeeklyReport } from '@/lib/ai/smart-weekly'

export const runtime = 'nodejs'

// GET /api/insights/weekly-report
// Deterministic, template + data-driven — no Claude call, so no rate
// limit or cache is needed; it's cheap to regenerate on every click.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const stats = await collectUserStats(supabase, user.id)
  const report = generateSmartWeeklyReport(stats)

  return NextResponse.json(report)
}
