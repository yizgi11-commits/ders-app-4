import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeString, validateUUID, MAX, safeError, logWriteError } from '@/lib/security'
import { RATING_REVIEW_DAYS, type SessionRating } from '@/lib/pomodoro/types'
import { trackEvent } from '@/lib/analytics/track'

const VALID_RATINGS: SessionRating[] = ['poor', 'okay', 'good', 'excellent']

// POST /api/pomodoro/finish
// Body: { sessionId: string, rating: SessionRating, recallText: string }
// Called from the Session Complete overlay's "Save & Continue" — records the
// reflection, closes out the linked daily task, and schedules the next
// spaced-repetition review for the studied topic.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const sessionId  = String(body?.sessionId ?? '')
  const rating: SessionRating = body?.rating
  const recallText = sanitizeString(body?.recallText ?? '', MAX.GENERIC_TEXT)

  if (!validateUUID(sessionId)) return NextResponse.json({ error: 'Geçersiz sessionId' }, { status: 400 })
  if (!VALID_RATINGS.includes(rating)) return NextResponse.json({ error: 'Geçersiz rating' }, { status: 400 })
  if (!recallText) return NextResponse.json({ error: 'recallText gerekli' }, { status: 400 })

  const { data: session, error: sErr } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (sErr || !session) return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 404 })

  const { error: sessionUpdateError } = await supabase
    .from('pomodoro_sessions')
    .update({ session_rating: rating, recall_text: recallText })
    .eq('id', sessionId)

  if (sessionUpdateError) return safeError(sessionUpdateError, 'Yansıma kaydedilemedi')

  void trackEvent(supabase, user.id, 'session_reflection_saved', { rating })

  // ── Mark the linked daily task complete ───────────────────────
  let taskCompleted = false
  if (session.task_id) {
    const { data: task } = await supabase
      .from('daily_tasks')
      .select('*, task_templates(xp_reward)')
      .eq('id', session.task_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (task && !task.completed) {
      const xpReward = task.task_templates?.xp_reward ?? 0
      const { error: taskError } = await supabase
        .from('daily_tasks')
        .update({ completed: true, completed_at: new Date().toISOString(), xp_earned: xpReward })
        .eq('id', session.task_id)

      if (taskError) {
        logWriteError('pomodoro/finish daily_tasks update', taskError)
      } else {
        taskCompleted = true
        void trackEvent(supabase, user.id, 'task_completed', { task_id: session.task_id, source: 'focus_reflection' })

        if (xpReward > 0) {
          const { data: userXp } = await supabase.from('user_xp').select('*').eq('user_id', user.id).maybeSingle()
          if (userXp) {
            const { error: xpError } = await supabase.from('user_xp').update({
              total_xp:   userXp.total_xp + xpReward,
              updated_at: new Date().toISOString(),
            }).eq('user_id', user.id)
            if (xpError) logWriteError('pomodoro/finish user_xp update', xpError)
          }
        }
      }
    }
  }

  // ── Recall Engine — schedule the next review for this topic ──
  let nextReviewDate: string | null = null
  if (session.topic_id) {
    const days = RATING_REVIEW_DAYS[rating]
    const next = new Date()
    next.setDate(next.getDate() + days)
    const scheduledDate = next.toISOString().split('T')[0]

    const { data: existingCard } = await supabase
      .from('flashcards')
      .select('id, review_count')
      .eq('user_id', user.id)
      .eq('topic_id', session.topic_id)
      .maybeSingle()

    if (existingCard) {
      const { error } = await supabase
        .from('flashcards')
        .update({
          next_review_date: scheduledDate,
          review_count:     existingCard.review_count + 1,
        })
        .eq('id', existingCard.id)
      if (error) logWriteError('pomodoro/finish flashcards update', error)
      else nextReviewDate = scheduledDate
    } else {
      const { data: topic } = await supabase
        .from('topics')
        .select('title')
        .eq('id', session.topic_id)
        .maybeSingle()

      const { error } = await supabase.from('flashcards').insert({
        user_id:          user.id,
        subject_id:       session.subject_id,
        topic_id:         session.topic_id,
        front:            topic?.title ?? 'Konu',
        back:             recallText,
        next_review_date: scheduledDate,
      })
      if (error) logWriteError('pomodoro/finish flashcards insert', error)
      else nextReviewDate = scheduledDate
    }
  }

  return NextResponse.json({ next_review_date: nextReviewDate, task_completed: taskCompleted })
}
