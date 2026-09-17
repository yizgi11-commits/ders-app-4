import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackEvent } from '@/lib/analytics/track'

// POST /api/recall/session-complete
// Body: { cardsCount: number, score: number }
// Fired once when a whole Recall session finishes (components/recall/
// RecallSession.tsx) — individual card grades are already recorded by
// /api/recall/review; this just logs the session-level summary event,
// since there's no other server round-trip that marks "session done".
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const cardsCount = Number(body?.cardsCount)
  const score      = Number(body?.score)

  if (!Number.isFinite(cardsCount) || cardsCount <= 0) {
    return NextResponse.json({ error: 'Geçersiz cardsCount' }, { status: 400 })
  }

  void trackEvent(supabase, user.id, 'recall_completed', {
    cards_count: cardsCount,
    score:       Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null,
  })

  return NextResponse.json({ ok: true })
}
