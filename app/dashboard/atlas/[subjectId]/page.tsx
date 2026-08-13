import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSubjectsWithProgress } from '@/lib/subjects/progress'
import TopicCardGrid from '@/components/atlas/TopicCardGrid'

interface Props {
  params: Promise<{ subjectId: string }>
}

export default async function SubjectPage({ params }: Props) {
  const { subjectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const subjects = await getSubjectsWithProgress(supabase, user.id)
  const subject = subjects.find(s => s.id === subjectId)
  if (!subject) notFound()

  const { completedTopics, totalTopics, subjectPct } = subject

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/atlas" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gray-700 transition-colors mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Atlas
        </Link>

        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: `${subject.color}15` }}
          >
            {subject.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{subject.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Progress: %{subjectPct} — {completedTopics}/{totalTopics} topics completed
            </p>
          </div>
          <div className="relative w-14 h-14 shrink-0 hidden sm:block">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#f1f1f4" strokeWidth="5" />
              <circle
                cx="28" cy="28" r="22" fill="none"
                stroke={subject.color} strokeWidth="5" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 22}
                strokeDashoffset={2 * Math.PI * 22 * (1 - subjectPct / 100)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-900">{subjectPct}%</span>
            </div>
          </div>
        </div>

        <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${subjectPct}%`, background: subject.color }} />
        </div>
      </div>

      <TopicCardGrid subjectId={subject.id} initialTopics={subject.topics} />
    </div>
  )
}
