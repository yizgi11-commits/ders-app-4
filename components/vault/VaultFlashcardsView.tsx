'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Brain, Plus, ChevronRight } from 'lucide-react'
import type { FlashcardWithSubject } from '@/lib/flashcards/types'
import FlashcardList from '@/components/flashcards/FlashcardList'
import FlashcardStudyMode from '@/components/flashcards/FlashcardStudyMode'
import CreateFlashcardModal from '@/components/flashcards/CreateFlashcardModal'

interface Props {
  search:      string
  savedOnly?:  boolean
  refreshKey?: number
}

export default function VaultFlashcardsView({ search, savedOnly = false, refreshKey = 0 }: Props) {
  const [cards, setCards]     = useState<FlashcardWithSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editCard, setEditCard]     = useState<FlashcardWithSubject | null>(null)
  const [studySession, setStudySession] = useState<FlashcardWithSubject[] | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/flashcards${savedOnly ? '?saved=1' : ''}`)
      if (!res.ok) return
      const data = await res.json()
      setCards(data.flashcards ?? [])
    } finally { setLoading(false) }
  }, [savedOnly])

  useEffect(() => { load() }, [load, refreshKey])

  function handleReviewed(id: string, result: 'know' | 'again') {
    setCards(prev => prev.map(c => {
      if (c.id !== id) return c
      const next = new Date()
      next.setDate(next.getDate() + (result === 'know' ? 3 : 1))
      return { ...c, next_review_date: next.toISOString().split('T')[0], review_count: c.review_count + 1 }
    }))
  }

  if (studySession !== null) {
    return (
      <FlashcardStudyMode
        cards={studySession}
        onReviewed={handleReviewed}
        onClose={() => setStudySession(null)}
      />
    )
  }

  const q = search.trim().toLowerCase()
  const filtered = q
    ? cards.filter(c => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q))
    : cards
  const dueCards = filtered.filter(c => c.next_review_date <= today)

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 rounded-lg skeleton-shimmer" />)}
      </div>
    )
  }

  const textBtn = 'inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-accent transition-colors duration-[160ms]'

  return (
    <div className="space-y-4">
      {dueCards.length > 0 && (
        <div className="flex items-center gap-3 rounded-md bg-warning-soft px-4 py-2.5">
          <p className="flex-1 text-sm text-text">
            <span className="tabular">{dueCards.length}</span> kart tekrar bekliyor
          </p>
          <button
            onClick={() => setStudySession([...dueCards].sort(() => Math.random() - 0.5))}
            className="inline-flex items-center gap-0.5 text-sm font-medium text-warning hover:opacity-80 shrink-0"
          >
            Çalış <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex items-center justify-between gap-4 py-4 border-y border-border">
          <p className="text-sm text-text-muted">
            {q ? 'Eşleşen kart yok.' : savedOnly ? 'Kaydedilmiş kart yok.' : 'Henüz flashcard yok.'}
          </p>
          {!savedOnly && (
            <button onClick={() => { setEditCard(null); setShowCreate(true) }} className={textBtn}>
              <Plus className="size-3.5" /> Kart ekle
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-text-muted"><span className="tabular">{filtered.length}</span> kart</p>
            <div className="flex items-center gap-5">
              <button onClick={() => setStudySession([...filtered].sort(() => Math.random() - 0.5))} className={textBtn}>
                <Brain className="size-3.5" /> Çalışmaya başla
              </button>
              {!savedOnly && (
                <button onClick={() => { setEditCard(null); setShowCreate(true) }} className={textBtn}>
                  <Plus className="size-3.5" /> Kart ekle
                </button>
              )}
            </div>
          </div>

          <FlashcardList
            cards={filtered}
            onDelete={id => setCards(prev => prev.filter(c => c.id !== id))}
            onEdit={card => { setEditCard(card); setShowCreate(true) }}
            onUpdated={updated => setCards(prev => prev.map(c => c.id === updated.id ? updated : c))}
          />
        </>
      )}

      <AnimatePresence>
        {showCreate && (
          <CreateFlashcardModal
            initial={editCard}
            onClose={() => { setShowCreate(false); setEditCard(null) }}
            onSaved={card => { setCards(prev => [card, ...prev]); setShowCreate(false) }}
            onUpdated={updated => {
              setCards(prev => prev.map(c => c.id === updated.id ? updated : c))
              setShowCreate(false); setEditCard(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
