'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Upload, Sparkles, Trash2, Loader2, Star, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { relativeTime, formatBytes, atlasLabel, shortDate, type VaultDocument } from '@/lib/vault/types'
import PDFUploadModal from '@/components/flashcards/PDFUploadModal'

interface Props {
  search:      string
  savedOnly?:  boolean
  onAssist:    (doc: VaultDocument) => void
  /** Bumping this from the parent forces a refetch. */
  refreshKey?: number
}

export default function VaultDocumentsView({ search, savedOnly = false, onAssist, refreshKey = 0 }: Props) {
  const [docs, setDocs]       = useState<VaultDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [busyId, setBusyId]   = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents${savedOnly ? '?saved=1' : ''}`)
      if (!res.ok) return
      const data = await res.json()
      setDocs(data.documents ?? [])
    } finally { setLoading(false) }
  }, [savedOnly])

  useEffect(() => { load() }, [load, refreshKey])

  async function toggleFavorite(doc: VaultDocument) {
    setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, is_favorite: !d.is_favorite } : d))
    await fetch(`/api/documents/${doc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favorite: !doc.is_favorite }),
    })
  }

  async function handleOpen(doc: VaultDocument) {
    setBusyId(doc.id)
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.url) window.open(data.url, '_blank', 'noopener,noreferrer')
    } finally { setBusyId(null) }
  }

  async function handleDelete(id: string) {
    setBusyId(id)
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      setDocs(prev => prev.filter(d => d.id !== id))
    } finally { setBusyId(null) }
  }

  const q = search.trim().toLowerCase()
  const filtered = q ? docs.filter(d => d.name.toLowerCase().includes(q)) : docs

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map(i => <div key={i} className="h-12 rounded-md skeleton-shimmer" />)}
      </div>
    )
  }

  return (
    <div>
      {!savedOnly && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-accent transition-colors duration-[160ms]"
          >
            <Upload className="size-3.5" /> Upload PDF
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-text-muted py-4 border-y border-border">
          {q ? 'Eşleşen belge yok.' : savedOnly ? 'Kaydedilmiş belge yok.' : 'Henüz PDF yüklenmedi.'}
        </p>
      ) : (
        <ul className="border-t border-border">
          {filtered.map(doc => {
            const atlas = atlasLabel(doc.subjects, doc.topics)
            const busy  = busyId === doc.id
            return (
              <li key={doc.id} className="group flex flex-wrap items-center gap-x-3 gap-y-2 px-2 py-2.5 border-b border-border hover:bg-surface-subtle transition-colors duration-[160ms]">
                <span aria-hidden className="shrink-0">📄</span>
                <div className="flex-1 min-w-[160px]">
                  <p className="text-base font-medium text-text truncate">{doc.name}</p>
                  <p className="text-xs text-text-muted truncate mt-0.5">
                    {atlas && <>{atlas} · </>}
                    <span className="tabular-nums" title={`Uploaded ${relativeTime(doc.created_at)}`}>{shortDate(doc.created_at)}</span>
                    {' · '}<span className="tabular-nums">{formatBytes(doc.size_bytes)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleFavorite(doc)}
                    aria-label={doc.is_favorite ? 'Kaydedilenlerden çıkar' : 'Kaydet'}
                    title={doc.is_favorite ? 'Kaydedilenlerden çıkar' : 'Kaydet'}
                    className="p-1.5 rounded-md hover:bg-surface transition-colors duration-[160ms]"
                  >
                    <Star className={cn('size-3.5', doc.is_favorite ? 'fill-warning text-warning' : 'text-text-muted')} />
                  </button>
                  <button
                    onClick={() => handleOpen(doc)}
                    disabled={busy || !doc.storage_path}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-surface text-sm font-medium text-text hover:border-border-strong transition-colors duration-[160ms] disabled:opacity-40"
                  >
                    {busy ? <Loader2 className="size-3 animate-spin" /> : <ExternalLink className="size-3" />}
                    Open
                  </button>
                  <button
                    onClick={() => onAssist(doc)}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium text-accent hover:bg-accent-soft transition-colors duration-[160ms]"
                  >
                    <Sparkles className="size-3" /> Noetic Assist
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={busy}
                    aria-label={`${doc.name} belgesini sil`}
                    className="p-1.5 rounded-md text-text-muted hover:text-danger transition-[color,opacity] duration-[160ms] sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <AnimatePresence>
        {showUpload && (
          <PDFUploadModal
            onClose={() => { setShowUpload(false); load() }}
            onGenerated={() => { setShowUpload(false); load() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
