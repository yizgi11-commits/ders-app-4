import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCachedLearningScore } from '@/lib/dashboard/learning-score'

// GET /api/learning-score — the 0-100 Learning Score for the last 7
// days, plus the change vs the previous 7 days and its breakdown
// (Focus/Recall/Completion/Consistency). Cached 6h in app_cache,
// invalidated on task/pomodoro/recall completion. No AI — plain math.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  try {
    const data = await getCachedLearningScore(supabase, user.id)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Learning Score alınamadı' }, { status: 500 })
  }
}
