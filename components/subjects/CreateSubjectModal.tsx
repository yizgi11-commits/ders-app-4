'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Plus } from 'lucide-react'
import { SUBJECT_COLORS, SUBJECT_ICONS } from '@/lib/subjects/types'

interface Props {
  onClose:   () => void
  onCreated: (subject: any) => void
  initial?:  { id?: string; name?: string; icon?: string; color?: string }
}

export default function CreateSubjectModal({ onClose, onCreated, initial }: Props) {
  const isEdit = !!initial?.id
  const [name, setName]     = useState(initial?.name ?? '')
  const [icon, setIcon]     = useState(initial?.icon ?? '📚')
  const [color, setColor]   = useState(initial?.color ?? '#6366f1')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/subjects', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: initial!.id, name, icon, color } : { name, icon, color }),
      })
      if (!res.ok) return
      const data = await res.json()
      onCreated(data)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[65] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.92, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-gradient-to-br from-gray-950 to-gray-900 border border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h2 className="text-sm font-bold text-white">{isEdit ? 'Ders Düzenle' : 'Yeni Ders Ekle'}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center">
            <X className="w-3.5 h-3.5 text-white/40" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border border-white/[0.08]"
                style={{ background: `${color}15` }}
              >
                {icon}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{name || 'Ders Adı'}</p>
                <p className="text-[10px] text-white/30">0 konu</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block mb-2">Ders Adı</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Örn: Matematik"
              className="input-premium"
              style={{ paddingLeft: '1rem' }}
              autoFocus
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block mb-2">İkon</label>
            <div className="flex flex-wrap gap-1.5">
              {SUBJECT_ICONS.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all border ${
                    icon === ic
                      ? 'bg-white/[0.1] border-indigo-500/40 scale-110'
                      : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07]'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block mb-2">Renk</label>
            <div className="flex gap-2">
              {SUBJECT_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full transition-all border-2 ${
                    color === c.value ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ background: c.value }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isEdit ? 'Kaydet' : 'Ders Ekle'}
            </button>
            <button onClick={onClose} className="px-5 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-white/40 text-sm transition-colors">
              İptal
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
