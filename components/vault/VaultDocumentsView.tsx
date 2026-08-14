'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Sparkles, Trash2, Loader2, Star, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { relativeTime, formatBytes, atlasLabel, type VaultDocument } from '@/lib/vault/types'
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[0, 1, 2].map(i => <div key={i} className="h-36 bg-white border border-border rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!savedOnly && (
        <div className="flex justify-end">
          <motion.button
            onClick={() => setShowUpload(true)}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-200/50"
          >
            <Upload className="w-4 h-4" /> PDF Yükle
          </motion.button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-border rounded-2xl">
          <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {q ? 'Eşleşen belge yok.' : savedOnly ? 'Kaydedilmiş belge yok.' : 'Henüz PDF yüklenmedi.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(doc => {
            const atlas = atlasLabel(doc.subjects, doc.topics)
            const busy  = busyId === doc.id
            return (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-lg shrink-0">📄</span>
                    <p className="text-sm font-bold text-gray-900 leading-snug break-words">{doc.name}</p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(doc)}
                    className="shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    title={doc.is_favorite ? 'Kaydedilenlerden çıkar' : 'Kaydet'}
                  >
                    <Star className={cn('w-3.5 h-3.5', doc.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300')} />
                  </button>
                </div>

                {atlas && (
                  <p className="text-[11px] text-indigo-600 font-medium mb-1 truncate">Atlas: {atlas}</p>
                )}
                <p className="text-[11px] text-muted-foreground mb-3">
                  Uploaded {relativeTime(doc.created_at)} · {formatBytes(doc.size_bytes)}
                </p>

                <div className="mt-auto flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpen(doc)}
                    disabled={busy || !doc.storage_path}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-border rounded-xl py-2 transition-colors disabled:opacity-40"
                  >
                    {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                    Open
                  </button>
                  <button
                    onClick={() => onAssist(doc)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl py-2 shadow-sm"
                  >
                    <Sparkles className="w-3 h-3" /> Noetic Assist
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={busy}
                    className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400/60 hover:text-red-500" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
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
