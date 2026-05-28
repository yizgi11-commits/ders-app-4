'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Edit2, FileText, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import type { FlashcardWithSubject } from '@/lib/flashcards/types'
import { stagger } from '@/lib/motion'

interface Props {
  cards:      FlashcardWithSubject[]
  onDelete:   (id: string) => void
  onEdit:     (card: FlashcardWithSubject) => void
  onUpdated:  (card: FlashcardWithSubject) => void
}

function FlashcardRow({
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
    <motion.div
      layout
      className={`bg-white border rounded-2xl overflow-hidden transition-shadow hover:shadow-sm ${
        isDue ? 'border-amber-200' : 'border-border'
      }`}
    >
      {/* Row header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {/* Subject chip */}
        {card.subjects ? (
          <span className="text-base shrink-0" title={card.subjects.name}>
            {card.subjects.icon}
          </span>
        ) : (
          <div className="w-5 h-5 rounded-md bg-gray-100 shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{card.front}</p>
          <p className="text-xs text-muted-foreground truncate">{card.back}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Due badge */}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
            isDue
              ? 'text-amber-700 bg-amber-50 border-amber-200'
              : 'text-gray-400 bg-gray-50 border-gray-200'
          }`}>
            {isDue ? '📅 ' : ''}{dueLabel}
          </span>

          {/* Review count */}
          {card.review_count > 0 && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <RotateCcw className="w-2.5 h-2.5" />
              {card.review_count}
            </span>
          )}

          {expanded
            ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
            : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          }
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/60 px-4 py-3 space-y-3 bg-gray-50/50">
              {/* Front */}
              <div>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Soru</p>
                <p className="text-sm text-gray-800">{card.front}</p>
              </div>
              {/* Back */}
              <div>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Cevap</p>
                <p className="text-sm text-gray-700">{card.back}</p>
              </div>
              {/* Source PDF */}
              {card.source_pdf_name && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <FileText className="w-3 h-3" />
                  {card.source_pdf_name}
                </div>
              )}
              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onEdit(card)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-indigo-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-indigo-50"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Düzenle
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {deleting ? 'Siliniyor…' : 'Sil'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FlashcardList({ cards, onDelete, onEdit, onUpdated }: Props) {
  return (
    <motion.div
      variants={stagger(0.04)}
      initial="hidden"
      animate="show"
      className="space-y-2"
    >
      {cards.map(card => (
        <motion.div
          key={card.id}
          variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        >
          <FlashcardRow
            card={card}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
