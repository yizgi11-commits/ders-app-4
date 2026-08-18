'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { X, Loader2, Sparkles, Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ASSIST_ACTIONS,
  type AssistAction, type AssistSource, type AssistResult, type AssistQuizQuestion,
} from '@/lib/vault/types'
import type { SubscriptionTier } from '@/lib/subscription'

interface Props {
  source:   AssistSource
  id:       string
  title:    string
  onClose:  () => void
  /** Called after cards are generated so the Flashcards tab can refresh. */
  onFlashcardsSaved?: () => void
  /** Renders without its own card chrome/header — for hosting inside the
   *  global Noetic Assist drawer, which already provides both. */
  embedded?: boolean
  tier:      SubscriptionTier
}

export default function NoeticAssist({ source, id, title, onClose, onFlashcardsSaved, embedded = false, tier }: Props) {
  const [loading, setLoading] = useState<AssistAction | null>(null)
  const [results, setResults] = useState<AssistResult>({})
  const [error, setError]     = useState<string | null>(null)

  async function run(action: AssistAction) {
    if (loading) return
    setLoading(action)
    setError(null)
    try {
      const res = await fetch('/api/vault/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, id, action }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Bir hata oluştu.'); return }

      setResults(prev => ({ ...prev, [action]: data.result }))
      if (action === 'flashcards') onFlashcardsSaved?.()
    } catch {
      setError('Bağlantı hatası. Tekrar deneyin.')
    } finally {
      setLoading(null)
    }
  }

  const Wrapper = embedded ? 'div' : motion.aside
  const wrapperProps = embedded
    ? { className: 'flex-1 min-h-0 flex flex-col' }
    : {
        initial: { x: 40, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 40, opacity: 0 },
        transition: { type: 'spring' as const, stiffness: 380, damping: 34 },
        className: 'w-full lg:w-80 shrink-0 bg-white border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden max-h-[calc(100vh-9rem)]',
      }

  return (
    <Wrapper {...wrapperProps}>
      {/* Header — only for the standalone card; embedded mode reuses the drawer's own header. */}
      {!embedded && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight">Noetic Assist</p>
              <p className="text-[10px] text-muted-foreground truncate">{title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {embedded && (
        <div className="px-4 pt-3.5 pb-1 shrink-0">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
        </div>
      )}

      {/* Actions */}
      {tier === 'free' ? (
        <Link
          href="/dashboard/upgrade"
          className="flex items-center gap-3 p-4 border-b border-border shrink-0 hover:bg-gray-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900">Özetle · Açıkla · Flashcard · Quiz</p>
            <p className="text-[11px] text-indigo-500 font-semibold">Pro’da açılır — yükseltmek için dokun</p>
          </div>
        </Link>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-3 border-b border-border shrink-0">
          {ASSIST_ACTIONS.map(a => (
            <button
              key={a.id}
              onClick={() => run(a.id)}
              disabled={loading !== null}
              className={cn(
                'flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl border transition-colors disabled:opacity-50',
                results[a.id]
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-gray-50/50 border-border text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/40',
              )}
            >
              {loading === a.id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <span>{a.emoji}</span>}
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
        )}

        {!error && !loading && Object.keys(results).length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Bir işlem seç — Noetic bu içerik üzerinde çalışsın.
          </p>
        )}

        {results.summarize && (
          <Section title="Özet">
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{results.summarize.text}</p>
          </Section>
        )}

        {results.explain && (
          <Section title="Açıklama">
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{results.explain.text}</p>
          </Section>
        )}

        {results.flashcards && (
          <Section title="Flashcardlar">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 mb-2">
              <Check className="w-3 h-3" />
              {results.flashcards.saved} kart Vault&apos;a kaydedildi
            </p>
            <div className="space-y-1.5">
              {results.flashcards.cards.map((c, i) => (
                <div key={i} className="rounded-lg border border-border bg-gray-50/60 px-2.5 py-2">
                  <p className="text-[11px] font-semibold text-gray-800">{c.front}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{c.back}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {results.quiz && (
          <Section title="Quiz">
            <div className="space-y-4">
              {results.quiz.questions.map((q, i) => <QuizItem key={i} q={q} index={i} />)}
            </div>
          </Section>
        )}
      </div>
    </Wrapper>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{title}</p>
      {children}
    </div>
  )
}

function QuizItem({ q, index }: { q: AssistQuizQuestion; index: number }) {
  const [picked, setPicked]   = useState<number | null>(null)
  const [checked, setChecked] = useState(false)

  return (
    <div>
      <p className="text-xs font-medium text-gray-800 mb-2">{index + 1}. {q.question}</p>
      <div className="space-y-1">
        {q.options.map((opt, oi) => {
          const isCorrect = oi === q.correct
          return (
            <button
              key={oi}
              onClick={() => !checked && setPicked(oi)}
              className={cn(
                'w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors',
                checked && isCorrect       ? 'bg-emerald-50 border-emerald-300 text-emerald-700' :
                checked && picked === oi   ? 'bg-red-50 border-red-300 text-red-700' :
                picked === oi              ? 'bg-indigo-50 border-indigo-300 text-indigo-700' :
                'border-border text-gray-600 hover:bg-gray-50',
              )}
            >
              {String.fromCharCode(65 + oi)}) {opt}
            </button>
          )
        })}
      </div>
      {!checked && picked !== null && (
        <button onClick={() => setChecked(true)} className="mt-1.5 text-[10px] text-indigo-600 font-medium hover:underline">
          Cevabı kontrol et
        </button>
      )}
      {checked && (
        <p className={cn('mt-1.5 text-[10px] font-medium', picked === q.correct ? 'text-emerald-600' : 'text-red-500')}>
          {picked === q.correct ? '✓ Doğru!' : `✗ Yanlış. Doğru cevap: ${String.fromCharCode(65 + q.correct)}`}
        </p>
      )}
    </div>
  )
}
