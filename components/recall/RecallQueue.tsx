'use client'

import Link from 'next/link'
import { ArrowRight, Lock, Play, CheckCircle2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/states'
import { daysAgoLabel, type RecallQueueResponse, type RecallQueueGroup } from '@/lib/recall/types'

interface Props {
  queue:        RecallQueueResponse | null
  onStart:      () => void
  onStartTopic: (group: RecallQueueGroup) => void
}

const plural = (n: number) => (n === 1 ? 'card' : 'cards')

function Header({ title }: { title: React.ReactNode }) {
  return (
    <div className="mb-8">
      <p className="text-[13px] font-medium tracking-[0.12em] text-text-muted">RECALL</p>
      <h1 className="mt-1 text-2xl font-semibold text-text">{title}</h1>
    </div>
  )
}

export default function RecallQueue({ queue, onStart, onStartTopic }: Props) {
  if (!queue) {
    return (
      <div>
        <div className="h-4 w-16 rounded-sm skeleton-shimmer" />
        <div className="h-8 w-72 rounded-md skeleton-shimmer mt-2 mb-8" />
        <div className="space-y-2">
          {[0, 1, 2].map(i => <div key={i} className="h-10 rounded-md skeleton-shimmer" />)}
        </div>
      </div>
    )
  }

  // ── Nothing due ────────────────────────────────────────────
  if (queue.totalCards === 0) {
    return (
      <div>
        <p className="text-[13px] font-medium tracking-[0.12em] text-text-muted">RECALL</p>
        <EmptyState
          icon={CheckCircle2}
          tone="success"
          title="Bugün tekrar edilecek konu yok."
          description="Harika iş — her şey güncel."
          className="border-y border-border mt-4"
        >
          <Link
            href="/dashboard/vault"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-accent transition-colors duration-[120ms]"
          >
            Vault&apos;a git <ArrowRight className="size-3.5" />
          </Link>
        </EmptyState>
      </div>
    )
  }

  const locked = queue.remainingToday === 0

  return (
    <div>
      <Header title={<>Due today — <span className="tabular">{queue.totalCards}</span> {plural(queue.totalCards)}</>} />

      {locked && (
        <div className="flex items-center gap-3 rounded-md bg-warning-soft px-4 py-2.5 mb-6">
          <Lock className="size-4 text-warning shrink-0" />
          <p className="flex-1 text-sm text-text">
            Bugünkü Recall limitine ulaştın — Free planda günde 20 kart.
          </p>
          <Link href="/dashboard/upgrade" className="shrink-0 text-sm font-medium text-accent hover:text-accent-dark">
            Upgrade
          </Link>
        </div>
      )}

      {/* Topic groups */}
      <ul className="border-t border-border">
        {queue.groups.map(group => {
          const lastStudied = daysAgoLabel(group.lastStudiedAt)
          return (
            <li key={group.topicId ?? '__none__'} className="group h-12 flex items-center gap-3 border-b border-border">
              <p className="flex-1 min-w-0 truncate text-base">
                {group.subjectName && <span className="text-text-secondary">{group.subjectName} · </span>}
                <span className="font-medium text-text">{group.topicTitle}</span>
              </p>
              {lastStudied && (
                <span className="hidden sm:inline text-xs text-text-muted shrink-0">Son çalışma: {lastStudied}</span>
              )}
              <span className="tabular text-sm text-text-muted shrink-0 w-16 text-right">
                {group.cards.length} {plural(group.cards.length)}
              </span>
              <button
                onClick={() => onStartTopic(group)}
                disabled={locked}
                aria-label={`${group.topicTitle} kartlarını başlat`}
                className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-accent transition-opacity duration-[160ms] sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 disabled:hidden"
              >
                <Play className="size-3 fill-current" /> Start
              </button>
            </li>
          )
        })}
      </ul>

      {/* Start */}
      <button
        onClick={onStart}
        disabled={locked}
        className="mt-6 w-full h-11 rounded-md bg-accent hover:bg-accent-dark text-white text-base font-medium inline-flex items-center justify-center gap-2 transition-colors duration-[160ms] disabled:bg-surface-subtle disabled:text-text-muted disabled:cursor-not-allowed"
      >
        {locked ? <><Lock className="size-4" /> Limit doldu</> : 'Start Recall'}
      </button>
    </div>
  )
}
