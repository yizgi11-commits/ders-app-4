'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Edit2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlashcardWithSubject } from '@/lib/flashcards/types'

interface Props {
  cards:      FlashcardWithSubject[]
  onDelete:   (id: string) => void
  onEdit:     (card: FlashcardWithSubject) => void
  onUpdated:  (card: FlashcardWithSubject) => void
}

// Compact card: front only; clicking opens the answer + actions in place.
function FlashcardCell({
  card,
  onDelete,
  onEdit,
}: {
  card:     FlashcardWithSubject
  onDelete: (id: string) => void
  onEdit:   (c: FlashcardWithSubject) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const isDue = card.next_review_date <= today

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/flashcards/${card.id}`, { method: 'DELETE' })
    onDelete(card.id)
  }

  const dueLabel = (() => {
    const d = new Date(card.next_review_date + 'T00:00:00')
    const t = new Date(); t.setHours(0,0,0,0)
    const diff = Math.round((d.getTime() - t.getTime()) / 86400000)
    if (diff <= 0) return 'Bugün'
    if (diff === 1) return 'Yarın'
    return `${diff} gün sonra`
  })()

  return (
    <div className={cn(
      'rounded-lg border bg-surface transition-[transform,box-shadow,border-color] duration-[160ms]',
      // Interactive card: lifts 2px with a slightly stronger shadow on hover.
      expanded ? 'border-border-strong' : 'border-border hover:border-border-strong hover:-translate-y-0.5 hover:shadow-md',
    )}>
      <button
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        className="w-full text-left p-3 flex flex-col gap-2"
      >
        <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
          <span className="truncate">
            {card.subjects ? `${card.subjects.icon} ${card.subjects.name}` : 'Konusuz'}
          </span>
          <span className={cn('shrink-0 tabular-nums', isDue && 'text-warning font-medium')}>{dueLabel}</span>
        </div>
        <p className="text-base font-medium text-text line-clamp-3">{card.front}</p>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mx-3 pt-2.5 pb-3 border-t border-border space-y-2.5">
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{card.back}</p>
              {card.source_pdf_name && (
                <p className="flex items-center gap-1.5 text-xs text-text-muted">
                  <FileText className="size-3" /> {card.source_pdf_name}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs">
                {card.review_count > 0 && (
                  <span className="text-text-muted">
                    <span className="tabular">{card.review_count}</span> tekrar
                  </span>
                )}
                <button onClick={() => onEdit(card)} className="inline-flex items-center gap-1 font-medium text-text-secondary hover:text-accent">
                  <Edit2 className="size-3" /> Düzenle
                </button>
                <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-1 font-medium text-text-secondary hover:text-danger disabled:opacity-40">
                  <Trash2 className="size-3" /> {deleting ? 'Siliniyor…' : 'Sil'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FlashcardList({ cards, onDelete, onEdit }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
      {cards.map(card => (
        <FlashcardCell key={card.id} card={card} onDelete={onDelete} onEdit={onEdit} />
      ))}
    </div>
  )
}
