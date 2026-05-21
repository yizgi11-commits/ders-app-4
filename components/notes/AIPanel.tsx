'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type AIType = 'summary' | 'keypoints' | 'flashcards' | 'quiz'

interface Tool {
  id: AIType
  icon: string
  label: string
  desc: string
}

const TOOLS: Tool[] = [
  { id: 'summary',    icon: '📝', label: 'Özetle',              desc: 'Notun ana fikirlerini özetler' },
  { id: 'keypoints',  icon: '🎯', label: 'Anahtar Noktalar',    desc: 'Önemli noktaları çıkarır' },
  { id: 'flashcards', icon: '🃏', label: 'Flashcard Oluştur',   desc: 'Soru-cevap kartları üretir' },
  { id: 'quiz',       icon: '❓', label: 'Quiz Oluştur',         desc: 'Çoktan seçmeli sorular üretir' },
]

interface FlashCard { question: string; answer: string }
interface QuizQuestion { question: string; options: string[]; correct: number }

interface AIResults {
  summary?: string
  keypoints?: string[]
  flashcards?: FlashCard[]
  quiz?: QuizQuestion[]
}

interface Props {
  noteId: string
  noteContent: string
  onClose: () => void
}

export default function AIPanel({ noteId, noteContent: _noteContent, onClose }: Props) {
  const [loading, setLoading]   = useState<AIType | null>(null)
  const [results, setResults]   = useState<AIResults>({})
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizChecked, setQuizChecked] = useState<Record<number, boolean>>({})

  async function generate(type: AIType) {
    setLoading(type)
    try {
      const res = await fetch('/api/notes/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId, type }),
      })
      if (!res.ok) throw new Error('Hata oluştu')
      const { result } = await res.json()

      setResults(prev => ({
        ...prev,
        summary:    type === 'summary'    ? (result as { text: string }).text        : prev.summary,
        keypoints:  type === 'keypoints'  ? (result as { points: string[] }).points  : prev.keypoints,
        flashcards: type === 'flashcards' ? (result as { cards: FlashCard[] }).cards  : prev.flashcards,
        quiz:       type === 'quiz'       ? (result as { questions: QuizQuestion[] }).questions : prev.quiz,
      }))
    } catch {
      // silently fail
    } finally {
      setLoading(null)
    }
  }

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      className="border-l border-gray-200 bg-white flex flex-col shrink-0 overflow-hidden"
    >
      <div className="flex flex-col h-full w-80 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-xs">✨</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">AI Araçları</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tools */}
        <div className="flex flex-col gap-3 p-4">
          {TOOLS.map(tool => (
            <div key={tool.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {/* Tool header */}
              <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-base">{tool.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{tool.label}</p>
                    <p className="text-[10px] text-gray-400">{tool.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => generate(tool.id)}
                  disabled={loading === tool.id}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                    loading === tool.id
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90'
                  )}
                >
                  {loading === tool.id ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      ...
                    </span>
                  ) : 'Oluştur'}
                </button>
              </div>

              {/* Loading */}
              {loading === tool.id && (
                <div className="px-3 py-3 flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  AI analiz ediyor...
                </div>
              )}

              {/* Results */}
              {tool.id === 'summary' && results.summary && loading !== 'summary' && (
                <div className="px-3 py-3">
                  <p className="text-xs text-gray-700 leading-relaxed">{results.summary}</p>
                </div>
              )}

              {tool.id === 'keypoints' && results.keypoints && loading !== 'keypoints' && (
                <div className="px-3 py-3">
                  <ul className="space-y-1.5">
                    {results.keypoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="mt-0.5 w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {i + 1}
                        </span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tool.id === 'flashcards' && results.flashcards && loading !== 'flashcards' && (
                <div className="px-3 py-3 space-y-2">
                  {results.flashcards.map((card, i) => (
                    <FlashCardItem key={i} card={card} index={i} />
                  ))}
                </div>
              )}

              {tool.id === 'quiz' && results.quiz && loading !== 'quiz' && (
                <div className="px-3 py-3 space-y-4">
                  {results.quiz.map((q, qi) => (
                    <div key={qi}>
                      <p className="text-xs font-medium text-gray-800 mb-2">{qi + 1}. {q.question}</p>
                      <div className="space-y-1">
                        {q.options.map((opt, oi) => {
                          const selected = quizAnswers[qi] === oi
                          const checked  = quizChecked[qi]
                          const isCorrect = oi === q.correct
                          return (
                            <button
                              key={oi}
                              onClick={() => !checked && setQuizAnswers(p => ({ ...p, [qi]: oi }))}
                              className={cn(
                                'w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition-colors',
                                checked && isCorrect    ? 'bg-emerald-50 border-emerald-300 text-emerald-700' :
                                checked && selected     ? 'bg-red-50 border-red-300 text-red-700' :
                                selected                ? 'bg-indigo-50 border-indigo-300 text-indigo-700' :
                                'border-gray-200 text-gray-600 hover:bg-gray-50'
                              )}
                            >
                              {String.fromCharCode(65 + oi)}) {opt}
                            </button>
                          )
                        })}
                      </div>
                      {!quizChecked[qi] && quizAnswers[qi] !== undefined && (
                        <button
                          onClick={() => setQuizChecked(p => ({ ...p, [qi]: true }))}
                          className="mt-2 text-[10px] text-indigo-600 font-medium hover:underline"
                        >
                          Cevabı kontrol et
                        </button>
                      )}
                      {quizChecked[qi] && (
                        <p className={cn('mt-1.5 text-[10px] font-medium', quizAnswers[qi] === q.correct ? 'text-emerald-600' : 'text-red-500')}>
                          {quizAnswers[qi] === q.correct ? '✓ Doğru!' : `✗ Yanlış. Doğru cevap: ${String.fromCharCode(65 + q.correct)}`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="px-4 pb-4">
          <p className="text-[10px] text-gray-400 text-center">
            AI sonuçları içerik analizine dayalıdır. Harici API kullanılmaz.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function FlashCardItem({ card, index }: { card: FlashCard; index: number }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <motion.div
      onClick={() => setFlipped(!flipped)}
      className="relative cursor-pointer select-none"
      style={{ perspective: 600 }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.35, type: 'spring', stiffness: 260, damping: 22 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative"
      >
        {/* Front */}
        <div
          className="backface-hidden px-3 py-2.5 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mb-1">Soru {index + 1}</p>
          <p className="text-xs text-gray-800">{card.question}</p>
          <p className="text-[9px] text-gray-400 mt-1.5">Cevabı görmek için tıklayın</p>
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 px-3 py-2.5 rounded-lg bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider mb-1">Cevap</p>
          <p className="text-xs text-gray-800">{card.answer}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
