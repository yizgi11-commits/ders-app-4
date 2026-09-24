'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, ArrowLeft, Star, Pin, Sparkles, Lock } from 'lucide-react'
import type { Note } from '@/lib/notes/types'
import { relativeTime, atlasLabel, shortDate } from '@/lib/vault/types'
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
  // Depend on the primitives, not the `selected` object: every autosave
  // replaces it with a new identity and would re-fire this needlessly.
  const selectedId    = selected?.id ?? null
  const selectedTitle = selected?.title ?? ''
  useEffect(() => {
    setOverride(selectedId ? { kind: 'vault-note', noteId: selectedId, title: selectedTitle || 'Başlıksız Not' } : null)
  }, [selectedId, selectedTitle, setOverride])

  // Debounced + stale-safe: typing in search must not fire one request per
  // keystroke, and a slow older response must never overwrite a newer one.
  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      if (savedOnly) params.set('filter', 'favorites')
      try {
        const res = await fetch(`/api/notes?${params.toString()}`)
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (!cancelled) setNotes(data.notes ?? [])
      } finally { if (!cancelled) setLoading(false) }
    }, search.trim() ? 250 : 0)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [search, savedOnly, refreshKey])

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
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text transition-colors duration-[160ms]"
          >
            <ArrowLeft className="size-3.5" /> Tüm notlar
          </button>
          <button
            onClick={() => onAssist(selected)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium text-accent hover:bg-accent-soft transition-colors duration-[160ms]"
          >
            <Sparkles className="size-3.5" /> Noetic Assist
          </button>
        </div>
        {/* Paper: white sheet, no frame — the page background does the separating */}
        <div className="h-[calc(100vh-16rem)] min-h-[420px] rounded-lg bg-surface shadow-sm overflow-hidden">
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

  // ── List mode ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-12 rounded-md skeleton-shimmer" />)}
      </div>
    )
  }

  return (
    <div>
      {locked && (
        <div className="flex items-center gap-3 rounded-md bg-warning-soft px-4 py-2.5 mb-4">
          <Lock className="size-4 text-warning shrink-0" />
          <p className="flex-1 text-sm text-text">Free planda not limitine ulaştın (10 not).</p>
          <Link href="/dashboard/upgrade" className="shrink-0 text-sm font-medium text-accent hover:text-accent-dark">
            Upgrade
          </Link>
        </div>
      )}

      {!savedOnly && (
        <div className="flex justify-end mb-2">
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-accent transition-colors duration-[160ms]"
          >
            <Plus className="size-3.5" /> New note
          </button>
        </div>
      )}

      {notes.length === 0 ? (
        <p className="text-sm text-text-muted py-4 border-y border-border">
          {search.trim() ? 'Eşleşen not yok.' : savedOnly ? 'Kaydedilmiş not yok.' : 'Henüz not oluşturulmadı.'}
        </p>
      ) : (
        <ul className="border-t border-border">
          {notes.map(note => {
            const atlas = atlasLabel(note.subjects, note.topics)
            const preview = note.content_preview?.replace(/[#*`>_[\]]/g, '').trim()
            return (
              <li key={note.id} className="border-b border-border">
                <button
                  onClick={() => setSelected(note)}
                  className="w-full text-left flex items-center gap-4 px-2 py-2.5 hover:bg-surface-subtle transition-colors duration-[160ms]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="flex items-center gap-1.5 text-base font-medium text-text">
                      <span className="truncate">{note.title || 'Başlıksız Not'}</span>
                      {note.is_pinned   && <Pin  className="size-3 shrink-0 text-text-muted" aria-label="Sabitlenmiş" />}
                      {note.is_favorite && <Star className="size-3 shrink-0 fill-warning text-warning" aria-label="Favori" />}
                    </p>
                    {(atlas || preview) && (
                      <p className="text-xs text-text-muted truncate mt-0.5">{atlas ?? preview}</p>
                    )}
                  </div>
                  <span className="tabular text-xs text-text-muted shrink-0" title={relativeTime(note.updated_at)}>
                    {shortDate(note.updated_at)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
