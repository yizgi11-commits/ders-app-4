import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeString, validateUUID, MAX } from '@/lib/security'
import { RATING_REVIEW_DAYS, type SessionRating } from '@/lib/pomodoro/types'

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

  await supabase
    .from('pomodoro_sessions')
    .update({ session_rating: rating, recall_text: recallText })
    .eq('id', sessionId)

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
      await supabase
        .from('daily_tasks')
        .update({ completed: true, completed_at: new Date().toISOString(), xp_earned: xpReward })
        .eq('id', session.task_id)

      if (xpReward > 0) {
        const { data: userXp } = await supabase.from('user_xp').select('*').eq('user_id', user.id).maybeSingle()
        if (userXp) {
          await supabase.from('user_xp').update({
            total_xp:   userXp.total_xp + xpReward,
            updated_at: new Date().toISOString(),
          }).eq('user_id', user.id)
        }
      }
      taskCompleted = true
    }
  }

  // ── Recall Engine — schedule the next review for this topic ──
  let nextReviewDate: string | null = null
  if (session.topic_id) {
    const days = RATING_REVIEW_DAYS[rating]
    const next = new Date()
    next.setDate(next.getDate() + days)
    nextReviewDate = next.toISOString().split('T')[0]

    const { data: existingCard } = await supabase
      .from('flashcards')
      .select('id, review_count')
      .eq('user_id', user.id)
      .eq('topic_id', session.topic_id)
      .maybeSingle()

    if (existingCard) {
      await supabase
        .from('flashcards')
        .update({
          next_review_date: nextReviewDate,
          review_count:     existingCard.review_count + 1,
        })
        .eq('id', existingCard.id)
    } else {
      const { data: topic } = await supabase
        .from('topics')
        .select('title')
        .eq('id', session.topic_id)
        .maybeSingle()

      await supabase.from('flashcards').insert({
        user_id:          user.id,
        subject_id:       session.subject_id,
        topic_id:         session.topic_id,
        front:            topic?.title ?? 'Konu',
        back:             recallText,
        next_review_date: nextReviewDate,
      })
    }
  }

  return NextResponse.json({ next_review_date: nextReviewDate, task_completed: taskCompleted })
}
