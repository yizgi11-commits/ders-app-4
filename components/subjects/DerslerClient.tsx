'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, BookOpen, Search } from 'lucide-react'
import type { SubjectWithTopics } from '@/lib/subjects/types'
import SubjectCard from './SubjectCard'
import SubjectDetail from './SubjectDetail'
import CreateSubjectModal from './CreateSubjectModal'
import { stagger } from '@/lib/motion'

type Analytics = Record<string, { tasksCompleted: number; xpEarned: number }>

// ── Skeleton ─────────────────────────────
function SubjectSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-gray-950/60 border border-white/[0.06] rounded-2xl p-5 space-y-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/[0.05]" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-24 rounded-lg bg-white/[0.06]" />
              <div className="h-3 w-16 rounded-lg bg-white/[0.04]" />
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.05]" />
          <div className="flex gap-3">
            {[1, 2, 3].map(j => <div key={j} className="h-8 flex-1 rounded-lg bg-white/[0.04]" />)}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DerslerClient() {
  const [subjects, setSubjects]     = useState<SubjectWithTopics[]>([])
  const [analytics, setAnalytics]   = useState<Analytics>({})
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editSubject, setEditSubject] = useState<SubjectWithTopics | null>(null)

  // ── Load data ──
  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/subjects')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSubjects(data.subjects ?? [])
      setAnalytics(data.analytics ?? {})
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Selected subject ──
  const selected = subjects.find(s => s.id === selectedId) ?? null

  // ── Filter ──
  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  // ── Handlers ──
  function handleCreated(subject: SubjectWithTopics) {
    if (editSubject) {
      setSubjects(prev => prev.map(s => s.id === subject.id ? { ...subject, topics: s.topics } : s))
      setEditSubject(null)
    } else {
      setSubjects(prev => [...prev, { ...subject, topics: [] }])
    }
    setShowCreate(false)
  }

  async function handleDelete(id: string) {
    await fetch('/api/subjects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setSubjects(prev => prev.filter(s => s.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function handleUpdateSubject(updated: SubjectWithTopics) {
    setSubjects(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">Derslerim</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Derslerini, konularını ve ilerleme durumunu yönet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ders ara…"
              className="text-sm bg-white border border-border rounded-xl pl-9 pr-4 py-2 w-52 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
            />
          </div>

          <motion.button
            onClick={() => { setEditSubject(null); setShowCreate(true) }}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-200/50"
          >
            <Plus className="w-4 h-4" />
            Yeni Ders
          </motion.button>
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SubjectSkeleton />
          </motion.div>
        ) : selected ? (
          <SubjectDetail
            key={selected.id}
            subject={selected}
            onBack={() => setSelectedId(null)}
            onUpdate={handleUpdateSubject}
          />
        ) : filtered.length === 0 && subjects.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-4xl mb-5"
            >
              📚
            </motion.div>
            <h2 className="text-lg font-bold text-gray-900 mb-1.5">Henüz ders eklenmedi</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Derslerini ekleyerek konularını organize et ve ilerleme durumunu takip et.
            </p>
            <motion.button
              onClick={() => setShowCreate(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors shadow-lg shadow-indigo-200/50"
            >
              <Plus className="w-4 h-4" /> İlk Dersini Ekle
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            variants={stagger(0.05)}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((subject, i) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                analytics={analytics[subject.name] ?? null}
                index={i}
                onSelect={() => setSelectedId(subject.id)}
                onEdit={() => { setEditSubject(subject); setShowCreate(true) }}
                onDelete={() => handleDelete(subject.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateSubjectModal
            onClose={() => { setShowCreate(false); setEditSubject(null) }}
            onCreated={handleCreated}
            initial={editSubject ? {
              id:    editSubject.id,
              name:  editSubject.name,
              icon:  editSubject.icon,
              color: editSubject.color,
            } : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
