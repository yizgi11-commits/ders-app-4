'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, StickyNote, ArrowLeft, Star, Pin, Sparkles, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note } from '@/lib/notes/types'
import { relativeTime, atlasLabel } from '@/lib/vault/types'
import NoteEditor from '@/components/notes/NoteEditor'
import { useAssist } from '@/components/assist/AssistProvider'

interface Props {
  search:     string
  savedOnly?: boolean
  onAssist:   (note: Note) => void
  refreshKey?: number
}

export default function VaultNotesView({ search, savedOnly = false, onAssist, refreshKey = 0 }: Props) {
  const [notes, setNotes]       = useState<Note[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Note | null>(null)
  const [locked, setLocked]     = useState(false)
  const { setOverride } = useAssist()

  // Keep the floating Assist's ambient context in sync with the editor,
  // so reopening the drawer without re-clicking "Noetic Assist" still
  // knows which note is open — and forgets it once the editor closes.
  useEffect(() => {
    setOverride(selected ? { kind: 'vault-note', noteId: selected.id, title: selected.title || 'Başlıksız Not' } : null)
  }, [selected, setOverride])

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (savedOnly) params.set('filter', 'favorites')
    try {
      const res = await fetch(`/api/notes?${params.toString()}`)
      if (!res.ok) return
      const data = await res.json()
      setNotes(data.notes ?? [])
    } finally { setLoading(false) }
  }, [search, savedOnly])

  useEffect(() => { load() }, [load, refreshKey])

  const handleCreate = useCallback(async () => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Yeni Not', content: '' }),
    })
    if (res.status === 403) { setLocked(true); return }
    if (!res.ok) return
    const note: Note = await res.json()
    setNotes(prev => [note, ...prev])
    setSelected(note)
  }, [])

  const handleUpdate = useCallback(async (id: string, updates: Partial<Note>) => {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) return
    const updated = await res.json()
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updated } : n))
    setSelected(prev => prev?.id === id ? { ...prev, ...updated } : prev)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setNotes(prev => prev.filter(n => n.id !== id))
    setSelected(null)
  }, [])

  // ── Editor mode ──────────────────────────────────────────────
  if (selected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelected(null)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Tüm notlar
          </button>
          <button
            onClick={() => onAssist(selected)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2 rounded-xl shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" /> Noetic Assist
          </button>
        </div>
        <div className="h-[calc(100vh-16rem)] min-h-[420px] rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
          <NoteEditor
            key={selected.id}
            note={selected}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onBack={() => setSelected(null)}
          />
        </div>
      </div>
    )
  }

  // ── Grid mode ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[0, 1, 2].map(i => <div key={i} className="h-32 bg-white border border-border rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {locked && (
        <div className="flex items-center gap-3 bg-gray-900 rounded-2xl px-5 py-3.5 text-white shadow-lg">
          <Lock className="w-4 h-4 text-indigo-300 shrink-0" />
          <p className="flex-1 text-sm font-semibold">Free planda not limitine ulaştın (10 not).</p>
          <Link href="/dashboard/upgrade" className="shrink-0 text-xs font-bold text-indigo-300 hover:text-indigo-200 px-3 py-1.5 rounded-lg border border-white/10">
            Upgrade
          </Link>
        </div>
      )}

      {!savedOnly && (
        <div className="flex justify-end">
          <motion.button
            onClick={handleCreate}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-200/50"
          >
            <Plus className="w-4 h-4" /> Yeni Not
          </motion.button>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-border rounded-2xl">
          <StickyNote className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search.trim() ? 'Eşleşen not yok.' : savedOnly ? 'Kaydedilmiş not yok.' : 'Henüz not oluşturulmadı.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {notes.map(note => {
              const atlas = atlasLabel(note.subjects, note.topics)
              return (
                <motion.button
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  onClick={() => setSelected(note)}
                  className="text-left bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">
                      {note.title || 'Başlıksız Not'}
                    </p>
                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      {note.is_pinned   && <Pin  className="w-3 h-3 text-indigo-400" />}
                      {note.is_favorite && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                    </div>
                  </div>

                  {atlas
                    ? <p className="text-[11px] text-indigo-600 font-medium mb-1.5 truncate">Atlas: {atlas}</p>
                    : note.content_preview
                      ? <p className="text-[11px] text-muted-foreground mb-1.5 line-clamp-2">
                          {note.content_preview.replace(/[#*`>_[\]]/g, '').trim()}
                        </p>
                      : null}

                  <p className="text-[11px] text-muted-foreground/70">{relativeTime(note.updated_at)}</p>

                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] bg-indigo-50 text-indigo-600 rounded-full px-1.5 py-0.5">{t}</span>
                      ))}
                    </div>
                  )}
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
