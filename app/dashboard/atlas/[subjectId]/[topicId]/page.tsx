import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSubjectsWithProgress } from '@/lib/subjects/progress'
import TopicTabs from '@/components/atlas/TopicTabs'
import type { Note } from '@/lib/notes/types'
import type { FlashcardWithSubject } from '@/lib/flashcards/types'
import type { PomodoroSession } from '@/lib/pomodoro/types'

interface Props {
  params: Promise<{ subjectId: string; topicId: string }>
}

export default async function TopicPage({ params }: Props) {
  const { subjectId, topicId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const subjects = await getSubjectsWithProgress(supabase, user.id)
  const subject = subjects.find(s => s.id === subjectId)
  const topic = subject?.topics.find(t => t.id === topicId)
  if (!subject || !topic) notFound()

  const [{ data: notes }, { data: flashcards }, { data: sessions }] = await Promise.all([
    supabase.from('notes').select('*').eq('user_id', user.id).eq('topic_id', topicId).order('updated_at', { ascending: false }),
    supabase.from('flashcards').select('*, subjects(id,name,icon,color)').eq('user_id', user.id).eq('topic_id', topicId).order('created_at', { ascending: false }),
    supabase.from('pomodoro_sessions').select('*').eq('user_id', user.id).eq('topic_id', topicId).eq('status', 'completed').order('started_at', { ascending: false }),
  ])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/atlas/${subjectId}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gray-700 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {subject.name}
        </Link>

        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-900">{topic.title}</h1>
          <span className="text-sm font-bold text-gray-700 tabular-nums shrink-0">{topic.progress_pct}%</span>
        </div>

        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${topic.progress_pct}%`, background: topic.progress_pct >= 100 ? '#10b981' : subject.color }}
          />
        </div>
      </div>

      <TopicTabs
        subjectId={subjectId}
        topicId={topicId}
        notes={(notes ?? []) as Note[]}
        flashcards={(flashcards ?? []) as FlashcardWithSubject[]}
        sessions={(sessions ?? []) as PomodoroSession[]}
      />
    </div>
  )
}
