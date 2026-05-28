'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Brain, ChevronRight, Sparkles } from 'lucide-react'

export default function FlashcardWidget() {
  const [dueCount, setDueCount] = useState<number | null>(null)
  const [total,    setTotal]    = useState<number>(0)

  useEffect(() => {
    fetch('/api/flashcards')
      .then(r => r.json())
      .then(d => {
        setDueCount(d.due_count ?? 0)
        setTotal(d.flashcards?.length ?? 0)
      })
      .catch(() => { setDueCount(0) })
  }, [])

  if (dueCount === null) {
    return (
      <div className="bg-white rounded-2xl border border-border p-4 h-[72px] animate-pulse" />
    )
  }

  const hasDue  = dueCount > 0
  const hasAny  = total > 0

  if (!hasAny) {
    return (
      <Link href="/dashboard/flashcards">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Brain className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-700">Flash Kartlar</p>
            <p className="text-xs text-muted-foreground">Kartlarını oluştur</p>
          </div>
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </motion.div>
      </Link>
    )
  }

  return (
    <Link href="/dashboard/flashcards">
      <motion.div
        whileHover={{ y: -2 }}
        className={`rounded-2xl border p-4 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer ${
          hasDue
            ? 'bg-amber-50 border-amber-200'
            : 'bg-white border-border'
        }`}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
          hasDue ? 'bg-amber-100' : 'bg-emerald-50'
        }`}>
          <Brain className={`w-4 h-4 ${hasDue ? 'text-amber-700' : 'text-emerald-500'}`} />
        </div>

        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">
            {hasDue ? `${dueCount} kart bekliyor` : 'Tüm kartlar güncel!'}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasDue ? 'Bugün tekrar zamanı' : `${total} kart toplam`}
          </p>
        </div>

        {hasDue && (
          <div className="flex items-center gap-1 text-amber-700">
            <span className="text-xs font-bold">Çalış</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        )}
      </motion.div>
    </Link>
  )
}
