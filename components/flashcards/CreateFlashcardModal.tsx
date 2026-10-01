'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { X, Brain, Save } from 'lucide-react'
import type { FlashcardWithSubject } from '@/lib/flashcards/types'
import AtlasLinkPicker from '@/components/vault/AtlasLinkPicker'

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
  const [subjectId, setSubjectId] = useState<string | null>(initial?.subject_id ?? null)
  const [topicId, setTopicId]     = useState<string | null>(initial?.topic_id ?? null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [locked, setLocked]     = useState(false)

  async function handleSave() {
    if (!front.trim() || !back.trim()) {
      setError('Ön yüz ve arka yüz doldurulmalıdır.')
      return
    }
    setSaving(true)
    setError('')

    try {
      const payload = {
        front:      front.trim(),
        back:       back.trim(),
        subject_id: subjectId,
        topic_id:   topicId,
      }

      if (isEdit && initial) {
        // Update
        const res = await fetch(`/api/flashcards/${initial.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Kaydedilemedi'); setLocked(!!data.locked); return }
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
        className="bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent-soft rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-accent" />
            </div>
            <h2 className="text-sm font-bold text-text">
              {isEdit ? 'Kartı Düzenle' : 'Yeni Kart'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-subtle transition-colors"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Front */}
          <div>
            <label className="text-xs font-bold text-accent uppercase tracking-wider block mb-1.5">
              Ön Yüz — Soru / Kavram
            </label>
            <textarea
              value={front}
              onChange={e => setFront(e.target.value)}
              placeholder="Soru veya kavramı yaz…"
              rows={3}
              className="w-full text-sm border border-border rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/30 transition-all"
            />
          </div>

          {/* Back */}
          <div>
            <label className="text-xs font-bold text-success uppercase tracking-wider block mb-1.5">
              Arka Yüz — Cevap / Açıklama
            </label>
            <textarea
              value={back}
              onChange={e => setBack(e.target.value)}
              placeholder="Cevap veya açıklamayı yaz…"
              rows={4}
              className="w-full text-sm border border-border rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success/30 transition-all"
            />
          </div>

          {/* Atlas link — Subject > Topic */}
          <AtlasLinkPicker
            subjectId={subjectId}
            topicId={topicId}
            onChange={(s, t) => { setSubjectId(s); setTopicId(t) }}
            label="Atlas bağlantısı (isteğe bağlı)"
          />

          {/* Preview */}
          {(front || back) && (
            <div className="bg-surface-subtle rounded-xl border border-border/60 p-3 space-y-2">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Önizleme</p>
              {front && (
                <div className="bg-dark-base rounded-lg p-3">
                  <p className="text-[10px] text-accent font-bold mb-1 uppercase tracking-wider">SORU</p>
                  <p className="text-sm text-white font-medium">{front}</p>
                </div>
              )}
              {back && (
                <div className="bg-accent rounded-lg p-3">
                  <p className="text-[10px] text-accent font-bold mb-1 uppercase tracking-wider">CEVAP</p>
                  <p className="text-sm text-white/80">{back}</p>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-danger bg-danger-soft border border-danger/30 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
              <span>{error}</span>
              {locked && (
                <Link href="/dashboard/upgrade" className="shrink-0 font-bold underline">Yükselt</Link>
              )}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-surface-subtle transition-colors"
            >
              İptal
            </button>
            <motion.button
              onClick={handleSave}
              disabled={saving || !front.trim() || !back.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-dark text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
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
