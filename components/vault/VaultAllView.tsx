'use client'

import { useState, useEffect, useCallback } from 'react'
import { StickyNote, Brain, FileText } from 'lucide-react'
import type { Note } from '@/lib/notes/types'
import type { FlashcardWithSubject } from '@/lib/flashcards/types'
import {
  relativeTime, atlasLabel, shortDate,
  type VaultDocument, type VaultFeedItem, type VaultItemKind,
} from '@/lib/vault/types'

interface Props {
  search:      string
  refreshKey?: number
  onOpenTab:   (kind: VaultItemKind) => void
}

const KIND_META: Record<VaultItemKind, { icon: typeof StickyNote; label: string }> = {
  note:      { icon: StickyNote, label: 'Note' },
  flashcard: { icon: Brain,      label: 'Flashcard' },
  document:  { icon: FileText,   label: 'Document' },
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
        {[0, 1, 2, 3].map(i => <div key={i} className="h-12 rounded-md skeleton-shimmer" />)}
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-text-muted py-4 border-y border-border">
        {q ? 'Vault içinde eşleşen bir şey yok.' : 'Vault henüz boş — not, kart veya PDF ekle.'}
      </p>
    )
  }

  return (
    <ul className="border-t border-border">
      {filtered.map(item => {
        const meta = KIND_META[item.kind]
        const Icon = meta.icon
        const secondary = item.atlas ?? item.subtitle
        return (
          <li key={`${item.kind}-${item.id}`} className="border-b border-border">
            <button
              onClick={() => onOpenTab(item.kind)}
              className="w-full text-left flex items-center gap-3 px-2 py-2.5 hover:bg-surface-subtle transition-colors duration-[160ms]"
            >
              <Icon className="size-4 shrink-0 text-text-muted" aria-label={meta.label} />
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-text truncate">{item.title}</p>
                {secondary && <p className="text-xs text-text-muted truncate mt-0.5">{secondary}</p>}
              </div>
              <span className="hidden sm:inline text-xs text-text-muted shrink-0">{meta.label}</span>
              <span className="tabular text-xs text-text-muted shrink-0 w-12 text-right" title={relativeTime(item.date)}>
                {shortDate(item.date)}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
