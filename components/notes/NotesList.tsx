'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Pin, Heart, LayoutGrid, LayoutList, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note, NoteView } from '@/lib/notes/types'

interface Props {
  notes: Note[]
  loading: boolean
  selectedNote: Note | null
  view: NoteView
  setView: (v: NoteView) => void
  onSelect: (n: Note) => void
  onCreateNote: () => void
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (mins < 1)   return 'Az önce'
  if (mins < 60)  return `${mins} dakika önce`
  if (hours < 24) return `${hours} saat önce`
  if (days < 7)   return `${days} gün önce`
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function NoteCard({ note, selected, onSelect }: { note: Note; selected: boolean; onSelect: () => void }) {
  const preview = note.content_preview
    ? note.content_preview.replace(/[#*`>_\[\]]/g, '').substring(0, 80).trim()
    : ''

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      onClick={onSelect}
      className={cn(
        'px-3 py-3 mx-2 mb-1 rounded-xl cursor-pointer border transition-all duration-150',
        selected
          ? 'bg-indigo-50 border-indigo-200 shadow-sm'
          : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50'
      )}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className={cn(
          'text-sm font-medium truncate leading-tight',
          selected ? 'text-indigo-800' : 'text-gray-900'
        )}>
          {note.title || 'Başlıksız Not'}
        </h3>
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          {note.is_pinned && (
            <Pin className="w-3 h-3 text-indigo-400 fill-indigo-400" />
          )}
          {note.is_favorite && (
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
          )}
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <p className={cn(
          'text-xs leading-relaxed line-clamp-2 mb-2',
          selected ? 'text-indigo-600/70' : 'text-gray-500'
        )}>
          {preview}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          {note.subject_name && (
            <span className="text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-full">
              {note.subject_name}
            </span>
          )}
          {note.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-gray-400 shrink-0">{relativeTime(note.updated_at)}</span>
      </div>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="px-3 py-3 mx-2 mb-1 rounded-xl border border-gray-100 bg-white animate-pulse">
      <div className="h-3.5 bg-gray-200 rounded w-2/3 mb-2" />
      <div className="h-2.5 bg-gray-100 rounded w-full mb-1" />
      <div className="h-2.5 bg-gray-100 rounded w-4/5 mb-3" />
      <div className="flex gap-2">
        <div className="h-4 bg-gray-100 rounded-full w-14" />
        <div className="h-4 bg-gray-100 rounded-full w-10" />
      </div>
    </div>
  )
}

export default function NotesList({ notes, loading, selectedNote, view, setView, onSelect, onCreateNote }: Props) {
  // Sorted: pinned first then by updated_at desc (API already does this, but ensure)
  const sorted = [...notes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <span className="text-xs text-gray-500 font-medium">
          {loading ? '...' : `${notes.length} not`}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView('list')}
            className={cn('p-1.5 rounded-lg transition-colors', view === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-100')}
          >
            <LayoutList className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setView('grid')}
            className={cn('p-1.5 rounded-lg transition-colors', view === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-100')}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : sorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center p-6 select-none"
          >
            <div className="text-4xl mb-3">📄</div>
            <p className="text-sm font-medium text-gray-700 mb-1">Not bulunamadı</p>
            <p className="text-xs text-gray-400 mb-4">Yeni bir not oluşturmak için aşağıdaki butona tıklayın.</p>
            <button
              onClick={onCreateNote}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Yeni Not
            </button>
          </motion.div>
        ) : (
          <div className={view === 'grid' ? 'grid grid-cols-2 gap-1 px-2' : ''}>
            <AnimatePresence mode="popLayout">
              {sorted.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  selected={selectedNote?.id === note.id}
                  onSelect={() => onSelect(note)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
