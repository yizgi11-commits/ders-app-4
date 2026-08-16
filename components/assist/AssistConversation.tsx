'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, RotateCcw, BookmarkPlus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AssistPageContext, AssistChatMessage } from '@/lib/assist/types'

export type QuickAction =
  | { type: 'prompt'; label: string; prompt: string }
  | { type: 'save'; label: string }

interface Props {
  pageContext:   AssistPageContext
  introText:     string
  quickActions?: QuickAction[]
  /** Only meaningful when a 'save' quick action is present (Atlas topic). */
  onSave?:       (lastAnswer: string | null) => Promise<void>
  placeholder?:  string
}

let idCounter = 0
function nextId() { idCounter += 1; return `msg-${idCounter}` }

export default function AssistConversation({
  pageContext, introText, quickActions = [], onSave, placeholder = 'Bir şey sor…',
}: Props) {
  const [messages, setMessages] = useState<AssistChatMessage[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [saved, setSaved]       = useState(false)
  const [saving, setSaving]     = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset the thread whenever the underlying context changes (new topic, etc).
  useEffect(() => {
    setMessages([])
    setError(null)
    setSaved(false)
  }, [JSON.stringify(pageContext)])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setInput('')
    setError(null)
    setMessages(prev => [...prev, { id: nextId(), role: 'user', text: trimmed }])
    setLoading(true)

    try {
      const res = await fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageContext, message: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Yanıt alınamadı')
      setMessages(prev => [...prev, { id: nextId(), role: 'assistant', text: data.text }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!onSave || saving) return
    setSaving(true)
    try {
      const lastAnswer = [...messages].reverse().find(m => m.role === 'assistant')?.text ?? null
      await onSave(lastAnswer)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const hasThread = messages.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Thread / intro */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!hasThread && (
          <p className="text-sm text-gray-600 leading-relaxed">{introText}</p>
        )}

        {messages.map(m => (
          <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
              m.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-800 rounded-bl-md',
            )}>
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span className="text-xs text-muted-foreground">düşünüyor…</span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
        )}
      </div>

      {/* Quick actions — only before the thread starts */}
      {!hasThread && quickActions.length > 0 && (
        <div className="px-4 pb-3 flex flex-col gap-2">
          {quickActions.map((qa, i) => (
            qa.type === 'prompt' ? (
              <button
                key={i}
                onClick={() => send(qa.prompt)}
                disabled={loading}
                className="w-full text-left text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl px-3.5 py-2.5 transition-colors disabled:opacity-50"
              >
                {qa.label}
              </button>
            ) : (
              <button
                key={i}
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-border rounded-xl px-3.5 py-2.5 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                {qa.label}
              </button>
            )
          ))}
        </div>
      )}

      {/* Post-thread actions: reset + save-last-answer */}
      {hasThread && (
        <div className="px-4 pb-2 flex items-center gap-2">
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-gray-700 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Yeni soru
          </button>
          {onSave && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors ml-auto disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
              {saved ? 'Kaydedildi' : 'Vault’a kaydet'}
            </button>
          )}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(input) }}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1 text-sm bg-gray-50 border border-border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 disabled:opacity-60"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="w-10 h-10 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
