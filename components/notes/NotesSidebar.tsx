'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Pin, Heart, Archive, Clock, FolderOpen, BookOpen, Plus, FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NoteFilter } from '@/lib/notes/types'
import type { NoteFolder } from '@/lib/notes/types'

interface Subject { id: string; name: string; icon: string; color: string }

interface Props {
  filter: NoteFilter
  setFilter: (f: NoteFilter) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  activeFolderId: string | null
  setActiveFolderId: (id: string | null) => void
  activeSubjectId: string | null
  setActiveSubjectId: (id: string | null) => void
  noteCount: number
  onCreateNote: () => void
}

const FILTERS: { id: NoteFilter; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'all',       label: 'Tümü',         icon: FileText },
  { id: 'pinned',    label: 'Sabitlenmiş',   icon: Pin },
  { id: 'favorites', label: 'Favoriler',     icon: Heart },
  { id: 'archived',  label: 'Arşiv',         icon: Archive },
  { id: 'recent',    label: 'Son Eklenenler',icon: Clock },
]

export default function NotesSidebar({
  filter, setFilter, searchQuery, setSearchQuery,
  activeFolderId, setActiveFolderId,
  activeSubjectId, setActiveSubjectId,
  noteCount, onCreateNote,
}: Props) {
  const [folders, setFolders]   = useState<NoteFolder[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [localSearch, setLocalSearch] = useState(searchQuery)

  useEffect(() => {
    fetch('/api/notes/folders').then(r => r.json()).then(d => setFolders(d.folders ?? []))
    fetch('/api/subjects').then(r => r.json()).then(d => setSubjects(d.subjects ?? []))
  }, [])

  // Debounce search 300ms
  function handleSearch(v: string) {
    setLocalSearch(v)
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => setSearchQuery(v), 300)
  }

  async function createFolder() {
    const name = newFolderName.trim()
    if (!name) return
    const res = await fetch('/api/notes/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const folder = await res.json()
      setFolders(prev => [...prev, folder])
    }
    setNewFolderName('')
    setShowNewFolder(false)
  }

  function selectFilter(f: NoteFilter) {
    setFilter(f)
    setActiveFolderId(null)
    setActiveSubjectId(null)
  }

  function selectFolder(id: string) {
    setActiveFolderId(id === activeFolderId ? null : id)
    setActiveSubjectId(null)
    setFilter('all')
  }

  function selectSubject(id: string) {
    setActiveSubjectId(id === activeSubjectId ? null : id)
    setActiveFolderId(null)
    setFilter('all')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Notlar</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{noteCount}</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={localSearch}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Notlarda ara..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 placeholder:text-gray-400 text-gray-900"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-3 py-3 border-b border-gray-100">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Filtrele</p>
        <div className="flex flex-col gap-0.5">
          {FILTERS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => selectFilter(id)}
              className={cn(
                'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors text-left',
                filter === id && !activeFolderId && !activeSubjectId
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* Folders */}
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Klasörler</p>
            <button
              onClick={() => setShowNewFolder(!showNewFolder)}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {showNewFolder && (
            <div className="flex gap-1 mb-2">
              <input
                autoFocus
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') setShowNewFolder(false) }}
                placeholder="Klasör adı..."
                className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <button onClick={createFolder} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-lg">
                Ekle
              </button>
            </div>
          )}

          <div className="flex flex-col gap-0.5">
            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => selectFolder(f.id)}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors text-left',
                  activeFolderId === f.id
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <span className="text-sm">{f.icon}</span>
                <span className="truncate">{f.name}</span>
              </button>
            ))}
            {folders.length === 0 && (
              <p className="text-xs text-gray-400 px-2.5 py-1">Henüz klasör yok</p>
            )}
          </div>
        </div>

        {/* Subjects */}
        <div className="px-3 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Dersler</p>
          <div className="flex flex-col gap-0.5">
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => selectSubject(s.id)}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors text-left',
                  activeSubjectId === s.id
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <span className="text-sm">{s.icon}</span>
                <span className="truncate">{s.name}</span>
              </button>
            ))}
            {subjects.length === 0 && (
              <div className="flex items-center gap-2 px-2.5 py-1">
                <BookOpen className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-xs text-gray-400">Ders eklenmemiş</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New note button */}
      <div className="px-3 py-3 border-t border-gray-100">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCreateNote}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium shadow-md shadow-indigo-500/25 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Yeni Not
        </motion.button>
      </div>
    </div>
  )
}
