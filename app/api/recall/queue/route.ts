import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/security'
import type { RecallCard, RecallQueueGroup } from '@/lib/recall/types'

interface CardRow {
  id:               string
  front:            string
  back:             string
  review_count:     number
  topic_id:         string | null
  subject_id:       string | null
  last_reviewed_at: string | null
  subjects:         { name: string; icon: string } | null
  topics:           { title: string } | null
}

// GET /api/recall/queue
// Cards whose next_review_date has arrived, grouped by Atlas topic.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('flashcards')
    .select('id, front, back, review_count, topic_id, subject_id, last_reviewed_at, subjects(name, icon), topics(title)')
    .eq('user_id', user.id)
    .lte('next_review_date', today)
    .order('next_review_date', { ascending: true })

  if (error) return safeError(error, 'Tekrar kuyruğu alınamadı')

  const rows = (data ?? []) as unknown as CardRow[]

  // Group by topic; cards with no Atlas topic fall into one bucket so
  // they stay reviewable instead of disappearing from the queue.
  const byTopic = new Map<string, RecallQueueGroup>()

  for (const row of rows) {
    const key = row.topic_id ?? '__none__'
    const card: RecallCard = {
      id:               row.id,
      front:            row.front,
      back:             row.back,
      review_count:     row.review_count,
      topic_id:         row.topic_id,
      subject_id:       row.subject_id,
      topic_title:      row.topics?.title ?? null,
      subject_name:     row.subjects?.name ?? null,
      subject_icon:     row.subjects?.icon ?? null,
      last_reviewed_at: row.last_reviewed_at,
    }

    let group = byTopic.get(key)
    if (!group) {
      group = {
        topicId:       row.topic_id,
        topicTitle:    row.topics?.title ?? 'Konusuz kartlar',
        subjectName:   row.subjects?.name ?? null,
        subjectIcon:   row.subjects?.icon ?? null,
        cards:         [],
        lastStudiedAt: null,
      }
      byTopic.set(key, group)
    }

    group.cards.push(card)
    if (row.last_reviewed_at && (!group.lastStudiedAt || row.last_reviewed_at > group.lastStudiedAt)) {
      group.lastStudiedAt = row.last_reviewed_at
    }
  }

  const groups = Array.from(byTopic.values()).sort((a, b) => b.cards.length - a.cards.length)

  return NextResponse.json({
    groups,
    totalCards:  rows.length,
    totalTopics: groups.length,
  })
}
