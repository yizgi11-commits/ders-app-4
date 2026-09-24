import type { SupabaseClient } from '@supabase/supabase-js'
import { PROGRESS_WEIGHTS, type SubjectWithProgress, type TopicProgress } from './types'

// ─────────────────────────────────────────────────────────────────
// Atlas — shared topic/subject progress computation.
// Used by both /api/atlas (client tree fetch) and the Atlas server
// pages ([subjectId], [subjectId]/[topicId]) so the formula lives
// in exactly one place.
// ─────────────────────────────────────────────────────────────────
export async function getSubjectsWithProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<SubjectWithProgress[]> {
  const [{ data: subjectsRaw }, { data: sessions }, { data: flashcards }, { data: notes }] =
    await Promise.all([
      supabase
        .from('subjects')
        .select('*, topics(*)')
        .eq('user_id', userId)
        .order('sort_order')
        .order('sort_order', { referencedTable: 'topics' }),
      supabase
        .from('pomodoro_sessions')
        .select('topic_id, started_at, elapsed_seconds')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .not('topic_id', 'is', null),
      supabase
        .from('flashcards')
        .select('topic_id, review_count')
        .eq('user_id', userId)
        .not('topic_id', 'is', null),
      supabase
        .from('notes')
        .select('topic_id, updated_at')
        .eq('user_id', userId)
        .not('topic_id', 'is', null),
    ])

  const bump = (m: Map<string, number>, k: string, by: number) => m.set(k, (m.get(k) ?? 0) + by)

  const focusLast    = new Map<string, string>()
  const focusSeconds = new Map<string, number>()
  for (const s of (sessions ?? []) as { topic_id: string; started_at: string; elapsed_seconds: number | null }[]) {
    const prev = focusLast.get(s.topic_id)
    if (!prev || s.started_at > prev) focusLast.set(s.topic_id, s.started_at)
    bump(focusSeconds, s.topic_id, s.elapsed_seconds ?? 0)
  }

  const recallDone    = new Set<string>()
  const recallReviews = new Map<string, number>()
  for (const f of (flashcards ?? []) as { topic_id: string; review_count: number }[]) {
    if (f.review_count > 0) recallDone.add(f.topic_id)
    bump(recallReviews, f.topic_id, f.review_count)
  }

  const noteLast  = new Map<string, string>()
  const noteCount = new Map<string, number>()
  for (const n of (notes ?? []) as { topic_id: string; updated_at: string }[]) {
    const prev = noteLast.get(n.topic_id)
    if (!prev || n.updated_at > prev) noteLast.set(n.topic_id, n.updated_at)
    bump(noteCount, n.topic_id, 1)
  }

  return ((subjectsRaw ?? []) as ({ topics: unknown[] } & Record<string, unknown>)[]).map(s => {
    const topics: TopicProgress[] = ((s.topics ?? []) as Record<string, unknown>[]).map(t => {
      const id = t.id as string
      const hasFocus  = focusLast.has(id)
      const hasRecall = recallDone.has(id)
      const hasNote   = noteLast.has(id)
      const progress_pct =
        (hasFocus  ? PROGRESS_WEIGHTS.focus  : 0) +
        (hasRecall ? PROGRESS_WEIGHTS.recall : 0) +
        (hasNote   ? PROGRESS_WEIGHTS.note   : 0)

      const dates = [focusLast.get(id), noteLast.get(id)].filter(Boolean) as string[]
      const last_studied_at = dates.length > 0 ? dates.sort().slice(-1)[0] : null

      return {
        ...(t as unknown as TopicProgress),
        progress_pct,
        has_focus:  hasFocus,
        has_recall: hasRecall,
        has_note:   hasNote,
        last_studied_at,
        focus_minutes: Math.round((focusSeconds.get(id) ?? 0) / 60),
        recall_count:  recallReviews.get(id) ?? 0,
        note_count:    noteCount.get(id) ?? 0,
      }
    })

    const totalTopics     = topics.length
    const completedTopics = topics.filter(t => t.progress_pct >= 100).length
    const subjectPct      = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

    return {
      ...(s as unknown as SubjectWithProgress),
      topics,
      completedTopics,
      totalTopics,
      subjectPct,
    }
  })
}

export async function getAtlasExamName(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('user_profiles')
    .select('exam_type')
    .eq('user_id', userId)
    .maybeSingle()

  return data?.exam_type || null
}
