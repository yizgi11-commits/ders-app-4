'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Plus, Clock, ChevronRight } from 'lucide-react'
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
      <div className="space-y-3">
        <div className="h-20 bg-white border border-border rounded-2xl animate-pulse" />
        <div className="h-64 bg-white border border-border rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {dueCards.length > 0 ? (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{dueCards.length} kart tekrar bekliyor</p>
              <p className="text-[11px] text-muted-foreground">Bugün gözden geçirme zamanı</p>
            </div>
            <button
              onClick={() => setStudySession([...dueCards].sort(() => Math.random() - 0.5))}
              className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 shrink-0"
            >
              Çalış <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : <div className="flex-1" />}

        {!savedOnly && (
          <motion.button
            onClick={() => { setEditCard(null); setShowCreate(true) }}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-200/50 shrink-0"
          >
            <Plus className="w-4 h-4" /> Kart Ekle
          </motion.button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-border rounded-2xl">
          <Brain className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {q ? 'Eşleşen kart yok.' : savedOnly ? 'Kaydedilmiş kart yok.' : 'Henüz flashcard yok.'}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{filtered.length} kart</p>
            <motion.button
              onClick={() => setStudySession([...filtered].sort(() => Math.random() - 0.5))}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm"
            >
              <Brain className="w-3.5 h-3.5" /> Çalışmaya Başla
            </motion.button>
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
