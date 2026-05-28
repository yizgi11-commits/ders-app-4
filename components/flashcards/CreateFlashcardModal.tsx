'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Brain, ChevronDown, Save } from 'lucide-react'
import type { FlashcardWithSubject } from '@/lib/flashcards/types'

interface Subject { id: string; name: string; icon: string; color: string }

interface Props {
  initial?:   FlashcardWithSubject | null
  onClose:    () => void
  onSaved:    (card: FlashcardWithSubject) => void
  onUpdated:  (card: FlashcardWithSubject) => void
}

const backdrop = {
  hidden: { opacity: 0 },
  show:   { opacity: 1 },
}
const modal = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  show:   { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 360, damping: 30 } },
  exit:   { opacity: 0, scale: 0.95, y: 12, transition: { duration: 0.18 } },
}

export default function CreateFlashcardModal({ initial, onClose, onSaved, onUpdated }: Props) {
  const isEdit = !!initial

  const [front, setFront]       = useState(initial?.front ?? '')
  const [back, setBack]         = useState(initial?.back ?? '')
  const [subjectId, setSubject] = useState(initial?.subject_id ?? '')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    fetch('/api/subjects')
      .then(r => r.json())
      .then(d => setSubjects(d.subjects ?? []))
      .catch(() => {})
  }, [])

  async function handleSave() {
    if (!front.trim() || !back.trim()) {
      setError('Ön yüz ve arka yüz doldurulmalıdır.')
      return
    }
    setSaving(true)
    setError('')

    try {
      if (isEdit && initial) {
        // Update
        const res = await fetch(`/api/flashcards/${initial.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ front: front.trim(), back: back.trim(), subject_id: subjectId || null }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Kaydedilemedi'); return }
        onUpdated(data)
        onClose()
      } else {
        // Create
        const res = await fetch('/api/flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ front: front.trim(), back: back.trim(), subject_id: subjectId || null }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Kaydedilemedi'); return }
        onSaved(data)
      }
    } catch {
      setError('Bağlantı hatası. Tekrar deneyin.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      variants={backdrop}
      initial="hidden"
      animate="show"
      exit="hidden"
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        variants={modal}
        initial="hidden"
        animate="show"
        exit="exit"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">
              {isEdit ? 'Kartı Düzenle' : 'Yeni Flash Kart'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Front */}
          <div>
            <label className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1.5">
              Ön Yüz — Soru / Kavram
            </label>
            <textarea
              value={front}
              onChange={e => setFront(e.target.value)}
              placeholder="Soru veya kavramı yaz…"
              rows={3}
              className="w-full text-sm border border-border rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all"
            />
          </div>

          {/* Back */}
          <div>
            <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1.5">
              Arka Yüz — Cevap / Açıklama
            </label>
            <textarea
              value={back}
              onChange={e => setBack(e.target.value)}
              placeholder="Cevap veya açıklamayı yaz…"
              rows={4}
              className="w-full text-sm border border-border rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 transition-all"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Ders (isteğe bağlı)
            </label>
            <div className="relative">
              <select
                value={subjectId}
                onChange={e => setSubject(e.target.value)}
                className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 pr-8"
              >
                <option value="">— Ders yok</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Preview */}
          {(front || back) && (
            <div className="bg-gray-50 rounded-xl border border-border/60 p-3 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Önizleme</p>
              {front && (
                <div className="bg-gray-900 rounded-lg p-3">
                  <p className="text-[10px] text-indigo-400 font-bold mb-1 uppercase tracking-wider">SORU</p>
                  <p className="text-sm text-white font-medium">{front}</p>
                </div>
              )}
              {back && (
                <div className="bg-indigo-950 rounded-lg p-3">
                  <p className="text-[10px] text-violet-400 font-bold mb-1 uppercase tracking-wider">CEVAP</p>
                  <p className="text-sm text-white/80">{back}</p>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <motion.button
              onClick={handleSave}
              disabled={saving || !front.trim() || !back.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-200/50 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Kaydediliyor…' : isEdit ? 'Güncelle' : 'Kaydet'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
