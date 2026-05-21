'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Note, NoteFilter, NoteView } from '@/lib/notes/types'
import NotesSidebar from './NotesSidebar'
import NotesList from './NotesList'
import NoteEditor from './NoteEditor'
import { Plus } from 'lucide-react'

export default function NotesClient() {
  const [notes, setNotes]               = useState<Note[]>([])
  const [loading, setLoading]           = useState(true)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [filter, setFilter]             = useState<NoteFilter>('all')
  const [searchQuery, setSearchQuery]   = useState('')
  const [view, setView]                 = useState<NoteView>('list')
  const [activeFolderId, setActiveFolderId]   = useState<string | null>(null)
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null)
  const [mobileView, setMobileView]     = useState<'list' | 'editor'>('list')

  const fetchNotes = useCallback(async (opts?: {
    search?: string
    filter?: NoteFilter
    folder_id?: string | null
    subject_id?: string | null
  }) => {
    const params = new URLSearchParams()
    if (opts?.search)    params.set('search', opts.search)
    if (opts?.filter)    params.set('filter', opts.filter)
    if (opts?.folder_id) params.set('folder_id', opts.folder_id)
    if (opts?.subject_id) params.set('subject_id', opts.subject_id)

    const res = await fetch(`/api/notes?${params.toString()}`)
    if (!res.ok) return
    const { notes: fetched } = await res.json()
    setNotes(fetched ?? [])
    return fetched as Note[]
  }, [])

  // Initial load
  useEffect(() => {
    setLoading(true)
    fetchNotes({ filter, search: searchQuery, folder_id: activeFolderId, subject_id: activeSubjectId })
      .then((fetched) => {
        if (fetched && fetched.length > 0 && !selectedNote) {
          setSelectedNote(fetched[0])
        }
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, searchQuery, activeFolderId, activeSubjectId])

  const handleSelectNote = useCallback((note: Note) => {
    setSelectedNote(note)
    setMobileView('editor')
  }, [])

  const handleCreateNote = useCallback(async () => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Yeni Not',
        content: '',
        folder_id: activeFolderId,
        subject_id: activeSubjectId,
      }),
    })
    if (!res.ok) return
    const newNote = await res.json()
    setNotes(prev => [newNote, ...prev])
    setSelectedNote(newNote)
    setMobileView('editor')
  }, [activeFolderId, activeSubjectId])

  const handleUpdateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) return
    const updated = await res.json()
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updated } : n))
    setSelectedNote(prev => prev?.id === id ? { ...prev, ...updated } : prev)
  }, [])

  const handleDeleteNote = useCallback(async (id: string) => {
    const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id)
      if (selectedNote?.id === id) {
        setSelectedNote(next[0] ?? null)
      }
      return next
    })
    setMobileView('list')
  }, [selectedNote])

  return (
    <div className="h-[calc(100vh-5rem)] flex overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* Left sidebar — filters/folders */}
      <div className="hidden lg:flex w-[280px] shrink-0 border-r border-gray-200 flex-col bg-white/70 backdrop-blur">
        <NotesSidebar
          filter={filter}
          setFilter={setFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeFolderId={activeFolderId}
          setActiveFolderId={setActiveFolderId}
          activeSubjectId={activeSubjectId}
          setActiveSubjectId={setActiveSubjectId}
          noteCount={notes.length}
          onCreateNote={handleCreateNote}
        />
      </div>

      {/* Middle — notes list */}
      <AnimatePresence mode="wait">
        <div
          className={`
            ${mobileView === 'editor' ? 'hidden lg:flex' : 'flex'}
            w-full lg:w-[340px] shrink-0 border-r border-gray-200 flex-col
          `}
        >
          {/* Mobile top bar */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">Notlar</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{notes.length}</span>
            </div>
            <button
              onClick={handleCreateNote}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Yeni Not
            </button>
          </div>

          <NotesList
            notes={notes}
            loading={loading}
            selectedNote={selectedNote}
            view={view}
            setView={setView}
            onSelect={handleSelectNote}
            onCreateNote={handleCreateNote}
          />
        </div>
      </AnimatePresence>

      {/* Right — editor */}
      <div
        className={`
          ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}
          flex-1 flex-col min-w-0
        `}
      >
        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
            onBack={() => setMobileView('list')}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none"
          >
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Notunuzu seçin</h3>
            <p className="text-sm text-gray-400 max-w-xs mb-6">
              Sol panelden bir not seçin ya da yeni bir not oluşturun.
            </p>
            <button
              onClick={handleCreateNote}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Yeni Not Oluştur
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
