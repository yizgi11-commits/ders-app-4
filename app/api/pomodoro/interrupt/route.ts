import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { StudyStatistics } from '@/lib/pomodoro/types'

// POST /api/pomodoro/interrupt
// Body: { sessionId: string, elapsedSeconds: number }
// Called when user resets an active session.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const { sessionId, elapsedSeconds } = body
  if (!sessionId) return NextResponse.json({ error: 'sessionId eksik' }, { status: 400 })

  // ── Mark session interrupted ──────────
  const { error } = await supabase
    .from('pomodoro_sessions')
    .update({ status: 'interrupted', elapsed_seconds: elapsedSeconds ?? 0 })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .eq('status', 'active')  // only interrupt if still active

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Reset session streak ──────────────
  const { data: stats } = await supabase
    .from('study_statistics')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle<StudyStatistics>()

  if (stats) {
    await supabase.from('study_statistics').update({
      total_sessions_interrupted: stats.total_sessions_interrupted + 1,
      current_session_streak: 0,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id)
  }

  return NextResponse.json({ ok: true })
}
