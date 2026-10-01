import { createClient } from '@/lib/supabase/server'
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
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDuration(seconds: number) {
  const mins = Math.max(1, Math.round(seconds / 60))
  return `${mins} dk`
}

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

const RATING_DOT: Record<SessionRating, string> = {
  poor: 'bg-danger', okay: 'bg-warning', good: 'bg-dark-accent', excellent: 'bg-success',
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
    <section className="max-w-2xl mx-auto">
      <p className="pb-2 border-b border-dark-border text-[11px] font-medium tracking-[0.08em] text-dark-text-muted">
        FOCUS GEÇMİŞİ
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-dark-text-muted py-6">Henüz Focus oturumu yok.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-dark-text-muted">
                <th className="font-medium py-2.5 pr-4">Tarih</th>
                <th className="font-medium py-2.5 pr-4">Ders</th>
                <th className="font-medium py-2.5 pr-4">Konu</th>
                <th className="font-medium py-2.5 pr-4">Süre</th>
                <th className="font-medium py-2.5">Değerlendirme</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const subject = one(row.subjects)
                const topic   = one(row.topics)
                return (
                  <tr key={row.id} className="border-t border-dark-border text-dark-text-secondary">
                    <td className="py-2.5 pr-4 whitespace-nowrap tabular-nums text-dark-text-muted">{fmtDate(row.started_at)}</td>
                    <td className="py-2.5 pr-4 text-dark-text">{subject?.name ?? '—'}</td>
                    <td className="py-2.5 pr-4">{topic?.title ?? '—'}</td>
                    <td className="py-2.5 pr-4 whitespace-nowrap tabular">{fmtDuration(row.elapsed_seconds)}</td>
                    <td className="py-2.5">
                      {row.session_rating ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`size-1.5 rounded-full ${RATING_DOT[row.session_rating]}`} />
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
    </section>
  )
}
