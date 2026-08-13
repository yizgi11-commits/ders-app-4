import { createClient } from '@/lib/supabase/server'
import { History } from 'lucide-react'
import { SESSION_RATING_LABELS, type SessionRating } from '@/lib/pomodoro/types'

interface HistoryRow {
  id:               string
  started_at:       string
  elapsed_seconds:  number
  session_rating:   SessionRating | null
  subjects:         { name: string } | { name: string }[] | null
  topics:           { title: string } | { title: string }[] | null
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDuration(seconds: number) {
  const mins = Math.max(1, Math.round(seconds / 60))
  return `${mins} min`
}

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

const RATING_DOT: Record<SessionRating, string> = {
  poor: 'bg-red-400', okay: 'bg-amber-400', good: 'bg-indigo-400', excellent: 'bg-emerald-400',
}

export default async function FocusHistory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('pomodoro_sessions')
    .select('id, started_at, elapsed_seconds, session_rating, subjects(name), topics(title)')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('started_at', { ascending: false })
    .limit(20)

  const rows = (data ?? []) as unknown as HistoryRow[]

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <History className="w-4 h-4 text-indigo-500" />
        <h2 className="text-sm font-bold text-gray-900">Focus History</h2>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No focus sessions yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-2.5">Date</th>
                <th className="px-5 py-2.5">Subject</th>
                <th className="px-5 py-2.5">Topic</th>
                <th className="px-5 py-2.5">Duration</th>
                <th className="px-5 py-2.5">Rating</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const subject = one(row.subjects)
                const topic   = one(row.topics)
                return (
                  <tr key={row.id} className="border-t border-border/70 text-gray-700">
                    <td className="px-5 py-2.5 whitespace-nowrap text-muted-foreground">{fmtDate(row.started_at)}</td>
                    <td className="px-5 py-2.5">{subject?.name ?? '—'}</td>
                    <td className="px-5 py-2.5">{topic?.title ?? '—'}</td>
                    <td className="px-5 py-2.5 tabular-nums">{fmtDuration(row.elapsed_seconds)}</td>
                    <td className="px-5 py-2.5">
                      {row.session_rating ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${RATING_DOT[row.session_rating]}`} />
                          {SESSION_RATING_LABELS[row.session_rating]}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
