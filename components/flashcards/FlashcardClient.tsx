'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Plus, Upload, BookOpen, Clock, ChevronRight } from 'lucide-react'
import type { FlashcardWithSubject } from '@/lib/flashcards/types'
import PDFUploadModal from './PDFUploadModal'
import FlashcardStudyMode from './FlashcardStudyMode'
import FlashcardList from './FlashcardList'
import CreateFlashcardModal from './CreateFlashcardModal'

type Tab = 'bugun' | 'tumkartlar'

// ── Skeleton ─────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1,2,3].map(i => (
          <div key={i} className="h-20 bg-gray-100 rounded-2xl border border-gray-200" />
        ))}
      </div>
      <div className="h-64 bg-gray-100 rounded-2xl border border-gray-200" />
    </div>
  )
}

export default function FlashcardClient() {
  const [flashcards, setFlashcards]   = useState<FlashcardWithSubject[]>([])
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState<Tab>('bugun')
  const [showUpload, setShowUpload]   = useState(false)
  const [showCreate, setShowCreate]   = useState(false)
  const [editCard, setEditCard]       = useState<FlashcardWithSubject | null>(null)
  const [studySession, setStudySession] = useState<FlashcardWithSubject[] | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/flashcards')
      if (!res.ok) return
      const data = await res.json()
      setFlashcards(data.flashcards ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Derived stats ──
  const dueCards   = flashcards.filter(c => c.next_review_date <= today)
  const allCards   = flashcards
  const totalCards = flashcards.length

  // ── Handlers ──
  function handleGenerated(newCards: FlashcardWithSubject[]) {
    setFlashcards(prev => [...newCards, ...prev])
    setShowUpload(false)
  }

  function handleCreated(card: FlashcardWithSubject) {
    setFlashcards(prev => [card, ...prev])
    setShowCreate(false)
    setEditCard(null)
  }

  function handleDeleted(id: string) {
    setFlashcards(prev => prev.filter(c => c.id !== id))
  }

  function handleUpdated(updated: FlashcardWithSubject) {
    setFlashcards(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  function startStudy(cards: FlashcardWithSubject[]) {
    setStudySession([...cards].sort(() => Math.random() - 0.5))
  }

  function handleReviewed(id: string, result: 'know' | 'again') {
    setFlashcards(prev => prev.map(c => {
      if (c.id !== id) return c
      const days = result === 'know' ? 3 : 1
      const next = new Date()
      next.setDate(next.getDate() + days)
      return { ...c, next_review_date: next.toISOString().split('T')[0], review_count: c.review_count + 1 }
    }))
  }

  // ── Study session active ──
  if (studySession !== null) {
    return (
      <FlashcardStudyMode
        cards={studySession}
        onReviewed={handleReviewed}
        onClose={() => setStudySession(null)}
      />
    )
  }

  const displayCards = tab === 'bugun' ? dueCards : allCards

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* ── Header ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-500" />
            Flash Kartlar
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            PDF&apos;lerden ve notlarından akıllı kartlar oluştur
          </p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => setShowUpload(true)}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-white border border-border hover:bg-gray-50 text-gray-700 font-semibold text-sm px-3 py-2 rounded-xl transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">PDF Yükle</span>
          </motion.button>

          <motion.button
            onClick={() => { setEditCard(null); setShowCreate(true) }}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors shadow-lg shadow-indigo-200/50"
          >
            <Plus className="w-4 h-4" />
            Kart Ekle
          </motion.button>
        </div>
      </motion.div>

      {loading ? <Skeleton /> : (
        <>
          {/* ── Stats row ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {/* Due today */}
            <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
              dueCards.length > 0
                ? 'bg-amber-50 border-amber-200'
                : 'bg-white border-border'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                dueCards.length > 0 ? 'bg-amber-100' : 'bg-gray-50'
              }`}>
                <Clock className={`w-5 h-5 ${dueCards.length > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{dueCards.length}</p>
                <p className="text-xs text-muted-foreground">Bugün tekrar bekliyor</p>
              </div>
              {dueCards.length > 0 && (
                <motion.button
                  onClick={() => startStudy(dueCards)}
                  whileHover={{ x: 2 }}
                  className="ml-auto flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900"
                >
                  Çalış <ChevronRight className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </div>

            {/* Total cards */}
            <div className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Brain className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{totalCards}</p>
                <p className="text-xs text-muted-foreground">Toplam kart</p>
              </div>
            </div>

            {/* Total reviewed */}
            <div className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">
                  {flashcards.reduce((s, c) => s + c.review_count, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Toplam tekrar</p>
              </div>
            </div>
          </motion.div>

          {/* ── Tab bar ────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex bg-white rounded-xl border border-border p-1 gap-0.5 w-fit shadow-sm"
          >
            {([
              { id: 'bugun',     label: `Bugün (${dueCards.length})` },
              { id: 'tumkartlar', label: `Tüm Kartlar (${totalCards})` },
            ] as { id: Tab; label: string }[]).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="relative px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                {tab === id && (
                  <motion.div
                    layoutId="fc-tab"
                    className="absolute inset-0 bg-indigo-600 rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className={`relative z-10 ${tab === id ? 'text-white' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </button>
            ))}
          </motion.div>

          {/* ── Content ────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              {displayCards.length === 0 ? (
                <EmptyState
                  tab={tab}
                  onUpload={() => setShowUpload(true)}
                  onCreate={() => setShowCreate(true)}
                />
              ) : (
                <>
                  {/* Study button */}
                  {displayCards.length > 0 && (
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {displayCards.length} kart {tab === 'bugun' ? '— bugün tekrar zamanı' : ''}
                      </p>
                      <motion.button
                        onClick={() => startStudy(displayCards)}
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm px-5 py-2 rounded-xl shadow-lg shadow-indigo-200/50"
                      >
                        <Brain className="w-4 h-4" />
                        Çalışmaya Başla
                      </motion.button>
                    </div>
                  )}
                  <FlashcardList
                    cards={displayCards}
                    onDelete={handleDeleted}
                    onEdit={(card) => { setEditCard(card); setShowCreate(true) }}
                    onUpdated={handleUpdated}
                  />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {/* ── Modals ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showUpload && (
          <PDFUploadModal
            onClose={() => setShowUpload(false)}
            onGenerated={handleGenerated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreate && (
          <CreateFlashcardModal
            initial={editCard}
            onClose={() => { setShowCreate(false); setEditCard(null) }}
            onSaved={handleCreated}
            onUpdated={handleUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────
function EmptyState({ tab, onUpload, onCreate }: {
  tab: Tab; onUpload: () => void; onCreate: () => void
}) {
  if (tab === 'bugun') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mb-4">
          ✅
        </div>
        <h2 className="text-base font-bold text-gray-900 mb-1">Bugün incelenecek kart yok!</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Tüm kartlarını başarıyla tamamladın. Yeni kartlar eklemek ister misin?
        </p>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onUpload}
            className="flex items-center gap-2 bg-white border border-border text-gray-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4 text-indigo-500" /> PDF Yükle
          </button>
          <button
            onClick={onCreate}
            className="flex items-center gap-2 bg-indigo-600 text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-indigo-500 transition-colors"
          >
            <Plus className="w-4 h-4" /> Kart Ekle
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-4xl mb-5"
      >
        🧠
      </motion.div>
      <h2 className="text-lg font-bold text-gray-900 mb-1.5">Henüz flash kart yok</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        PDF yükleyerek AI ile otomatik kart oluştur veya manuel olarak ekle.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button
          onClick={onUpload}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 bg-white border border-border text-gray-700 font-semibold text-sm px-5 py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4 text-indigo-500" /> PDF&apos;den Oluştur
        </motion.button>
        <motion.button
          onClick={onCreate}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-colors shadow-lg shadow-indigo-200/50"
        >
          <Plus className="w-4 h-4" /> Manuel Kart Ekle
        </motion.button>
      </div>
    </motion.div>
  )
}
