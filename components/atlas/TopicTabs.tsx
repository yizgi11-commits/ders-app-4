'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Brain, History as HistoryIcon, StickyNote,
  Plus, Loader2, ThumbsUp, ThumbsDown, ExternalLink, Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Note } from '@/lib/notes/types'
import type { FlashcardWithSubject } from '@/lib/flashcards/types'
import type { PomodoroSession, SessionRating } from '@/lib/pomodoro/types'
import { SESSION_RATING_LABELS } from '@/lib/pomodoro/types'

type Tab = 'learn' | 'practice' | 'history' | 'notes'

const TABS: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: 'learn',    label: 'Learn',    icon: BookOpen },
  { id: 'practice', label: 'Practice', icon: Brain },
  { id: 'history',  label: 'History',  icon: HistoryIcon },
  { id: 'notes',    label: 'Notes',    icon: StickyNote },
]

const RATING_DOT: Record<SessionRating, string> = {
  poor: 'bg-red-400', okay: 'bg-amber-400', good: 'bg-indigo-400', excellent: 'bg-emerald-400',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtDuration(seconds: number) {
  const mins = Math.max(1, Math.round(seconds / 60))
  return `${mins} min`
}

interface Props {
  subjectId:  string
  topicId:    string
  notes:      Note[]
  flashcards: FlashcardWithSubject[]
  sessions:   PomodoroSession[]
}

export default function TopicTabs({ subjectId, topicId, notes: initialNotes, flashcards: initialFlashcards, sessions }: Props) {
  const [tab, setTab] = useState<Tab>('learn')
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [flashcards, setFlashcards] = useState<FlashcardWithSubject[]>(initialFlashcards)

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex bg-white border border-border rounded-xl p-1 gap-0.5 shadow-sm">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-lg transition-all z-10',
              tab === id ? 'text-white' : 'text-muted-foreground hover:text-gray-700'
            )}
          >
            {tab === id && (
              <motion.div
                layoutId="atlas-topic-tab"
                className="absolute inset-0 bg-indigo-600 rounded-lg"
                transition={{ type: 'spring', stiffness: 420, damping: 36 }}
              />
            )}
            <Icon className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'learn' && (
          <motion.div key="learn" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <LearnTab notes={notes} />
          </motion.div>
        )}
        {tab === 'practice' && (
          <motion.div key="practice" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <PracticeTab
              subjectId={subjectId} topicId={topicId}
              flashcards={flashcards} onFlashcardsChange={setFlashcards}
            />
          </motion.div>
        )}
        {tab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <HistoryTab sessions={sessions} />
          </motion.div>
        )}
        {tab === 'notes' && (
          <motion.div key="notes" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <NotesTab
              subjectId={subjectId} topicId={topicId}
              notes={notes} onNotesChange={setNotes}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Learn ──────────────────────────────────────────────────────
function LearnTab({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-14 bg-white border border-dashed border-border rounded-2xl">
        <p className="text-3xl mb-3">📖</p>
        <p className="text-sm text-muted-foreground">No Vault notes for this topic yet.</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Add one from the Notes tab.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {notes.map(note => (
        <div key={note.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-bold text-gray-900">{note.title}</p>
            <Link
              href="/dashboard/vault"
              className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 shrink-0"
            >
              Open <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">{note.content_preview}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            {new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Practice ───────────────────────────────────────────────────
function PracticeTab({
  subjectId, topicId, flashcards, onFlashcardsChange,
}: {
  subjectId: string; topicId: string
  flashcards: FlashcardWithSubject[]
  onFlashcardsChange: (cards: FlashcardWithSubject[]) => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [saving, setSaving] = useState(false)
  const [flippedId, setFlippedId] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  async function handleAdd() {
    if (!front.trim() || !back.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ front: front.trim(), back: back.trim(), subject_id: subjectId, topic_id: topicId }),
      })
      if (!res.ok) return
      const card = await res.json()
      onFlashcardsChange([card, ...flashcards])
      setFront(''); setBack(''); setShowAdd(false)
    } finally { setSaving(false) }
  }

  async function handleReview(id: string, result: 'know' | 'again') {
    if (reviewingId) return
    setReviewingId(id)
    try {
      const res = await fetch(`/api/flashcards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result }),
      })
      if (!res.ok) return
      const { flashcard } = await res.json()
      onFlashcardsChange(flashcards.map(c => c.id === id ? { ...c, ...flashcard } : c))
    } finally { setReviewingId(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{flashcards.length} recall card{flashcards.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Card
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white border border-border rounded-2xl p-4 shadow-sm space-y-2">
              <input
                value={front} onChange={e => setFront(e.target.value)}
                placeholder="Front (question)"
                className="w-full text-sm bg-gray-50/50 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
              />
              <input
                value={back} onChange={e => setBack(e.target.value)}
                placeholder="Back (answer)"
                className="w-full text-sm bg-gray-50/50 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={!front.trim() || !back.trim() || saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Save
                </button>
                <button onClick={() => setShowAdd(false)} className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-muted-foreground text-xs rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {flashcards.length === 0 ? (
        <div className="text-center py-14 bg-white border border-dashed border-border rounded-2xl">
          <p className="text-3xl mb-3">🧠</p>
          <p className="text-sm text-muted-foreground">No Recall cards for this topic yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {flashcards.map(card => {
            const flipped = flippedId === card.id
            const busy = reviewingId === card.id
            return (
              <div key={card.id} className="bg-white border border-border rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <button
                  onClick={() => setFlippedId(flipped ? null : card.id)}
                  className="text-left"
                >
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {flipped ? 'Back' : 'Front'}
                  </p>
                  <p className="text-sm font-medium text-gray-900 min-h-[2.5rem]">
                    {flipped ? card.back : card.front}
                  </p>
                </button>
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
                  <span className="text-[10px] text-muted-foreground">{card.review_count} review{card.review_count !== 1 ? 's' : ''}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleReview(card.id, 'again')}
                      disabled={busy}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      <ThumbsDown className="w-3 h-3" /> Again
                    </button>
                    <button
                      onClick={() => handleReview(card.id, 'know')}
                      disabled={busy}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      <ThumbsUp className="w-3 h-3" /> Know
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── History ────────────────────────────────────────────────────
function HistoryTab({ sessions }: { sessions: PomodoroSession[] }) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-14 bg-white border border-dashed border-border rounded-2xl">
        <Flame className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No Focus sessions for this topic yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Duration</th>
              <th className="px-4 py-2.5">Rating</th>
              <th className="px-4 py-2.5">Reflection</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id} className="border-t border-border/70 text-gray-700">
                <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">{fmtDate(s.started_at)}</td>
                <td className="px-4 py-2.5 tabular-nums">{fmtDuration(s.elapsed_seconds)}</td>
                <td className="px-4 py-2.5">
                  {s.session_rating ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${RATING_DOT[s.session_rating]}`} />
                      {SESSION_RATING_LABELS[s.session_rating]}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground max-w-xs truncate">{s.recall_text ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Notes (quick add) ──────────────────────────────────────────
function NotesTab({
  subjectId, topicId, notes, onNotesChange,
}: {
  subjectId: string; topicId: string
  notes: Note[]
  onNotesChange: (notes: Note[]) => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!content.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Untitled Note',
          content: content.trim(),
          subject_id: subjectId,
          topic_id: topicId,
        }),
      })
      if (!res.ok) return
      const note = await res.json()
      onNotesChange([note, ...notes])
      setTitle(''); setContent('')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-border rounded-2xl p-4 shadow-sm space-y-2">
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full text-sm bg-gray-50/50 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
        />
        <textarea
          value={content} onChange={e => setContent(e.target.value)}
          placeholder="Quick note…"
          rows={4}
          className="w-full text-sm bg-gray-50/50 border border-border rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
        />
        <button
          onClick={handleAdd}
          disabled={!content.trim() || saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Save Note
        </button>
      </div>

      {notes.length > 0 && (
        <div className="space-y-2">
          {notes.map(note => (
            <div key={note.id} className="bg-white border border-border rounded-2xl p-3.5 shadow-sm">
              <p className="text-xs font-bold text-gray-900">{note.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{note.content_preview}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
