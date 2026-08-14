'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { StickyNote, Brain, FileText, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note } from '@/lib/notes/types'
import type { FlashcardWithSubject } from '@/lib/flashcards/types'
import {
  relativeTime, atlasLabel,
  type VaultDocument, type VaultFeedItem, type VaultItemKind,
} from '@/lib/vault/types'

interface Props {
  search:      string
  refreshKey?: number
  onOpenTab:   (kind: VaultItemKind) => void
}

const KIND_META: Record<VaultItemKind, { icon: typeof StickyNote; label: string; color: string; bg: string }> = {
  note:      { icon: StickyNote, label: 'Note',      color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  flashcard: { icon: Brain,      label: 'Flashcard', color: 'text-violet-600',  bg: 'bg-violet-50' },
  document:  { icon: FileText,   label: 'Document',  color: 'text-emerald-600', bg: 'bg-emerald-50' },
}

export default function VaultAllView({ search, refreshKey = 0, onOpenTab }: Props) {
  const [items, setItems]     = useState<VaultFeedItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [notesRes, cardsRes, docsRes] = await Promise.all([
        fetch('/api/notes'),
        fetch('/api/flashcards'),
        fetch('/api/documents'),
      ])
      const [notesJson, cardsJson, docsJson] = await Promise.all([
        notesRes.ok ? notesRes.json() : { notes: [] },
        cardsRes.ok ? cardsRes.json() : { flashcards: [] },
        docsRes.ok  ? docsRes.json()  : { documents: [] },
      ])

      const notes: VaultFeedItem[] = (notesJson.notes ?? []).map((n: Note) => ({
        kind:     'note' as const,
        id:       n.id,
        title:    n.title || 'Başlıksız Not',
        subtitle: n.content_preview ? n.content_preview.replace(/[#*`>_[\]]/g, '').trim() : null,
        atlas:    atlasLabel(n.subjects, n.topics),
        date:     n.updated_at,
      }))

      const cards: VaultFeedItem[] = (cardsJson.flashcards ?? []).map((c: FlashcardWithSubject) => ({
        kind:     'flashcard' as const,
        id:       c.id,
        title:    c.front,
        subtitle: c.back,
        atlas:    atlasLabel(c.subjects, c.topics),
        date:     c.created_at,
      }))

      const docs: VaultFeedItem[] = (docsJson.documents ?? []).map((d: VaultDocument) => ({
        kind:     'document' as const,
        id:       d.id,
        title:    d.name,
        subtitle: null,
        atlas:    atlasLabel(d.subjects, d.topics),
        date:     d.created_at,
      }))

      setItems([...notes, ...cards, ...docs].sort((a, b) => b.date.localeCompare(a.date)))
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const q = search.trim().toLowerCase()
  const filtered = q
    ? items.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.subtitle ?? '').toLowerCase().includes(q) ||
        (i.atlas ?? '').toLowerCase().includes(q))
    : items

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-16 bg-white border border-border rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-dashed border-border rounded-2xl">
        <Layers className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          {q ? 'Vault içinde eşleşen bir şey yok.' : 'Vault henüz boş — not, kart veya PDF ekle.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {filtered.map(item => {
        const meta = KIND_META[item.kind]
        const Icon = meta.icon
        return (
          <motion.button
            key={`${item.kind}-${item.id}`}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onOpenTab(item.kind)}
            className="w-full text-left flex items-start gap-3 bg-white border border-border rounded-2xl p-3.5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', meta.bg)}>
              <Icon className={cn('w-4 h-4', meta.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                <span className={cn('text-[10px] font-bold uppercase tracking-wider shrink-0', meta.color)}>
                  {meta.label}
                </span>
              </div>
              {item.atlas && <p className="text-[11px] text-indigo-600 font-medium truncate mt-0.5">Atlas: {item.atlas}</p>}
              {!item.atlas && item.subtitle && (
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{item.subtitle}</p>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground/70 shrink-0 whitespace-nowrap">
              {relativeTime(item.date)}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
