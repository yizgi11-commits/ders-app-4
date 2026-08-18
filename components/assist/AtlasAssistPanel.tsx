'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import AssistConversation, { type QuickAction } from './AssistConversation'
import type { SubjectWithTopics } from '@/lib/subjects/types'
import type { SubscriptionTier } from '@/lib/subscription'

interface Props {
  subjectId: string
  topicId?:  string
  tier:      SubscriptionTier
}

export default function AtlasAssistPanel({ subjectId, topicId, tier }: Props) {
  const [names, setNames] = useState<{ subjectName: string; topicTitle: string | null } | null>(null)

  useEffect(() => {
    let cancelled = false
    setNames(null)
    fetch('/api/subjects')
      .then(r => r.json())
      .then((d: { subjects: SubjectWithTopics[] }) => {
        if (cancelled) return
        const subject = d.subjects.find(s => s.id === subjectId)
        const topic = topicId ? subject?.topics?.find(t => t.id === topicId) : null
        setNames({
          subjectName: subject?.name ?? 'Ders',
          topicTitle:  topic?.title ?? null,
        })
      })
      .catch(() => { if (!cancelled) setNames({ subjectName: 'Ders', topicTitle: null }) })
    return () => { cancelled = true }
  }, [subjectId, topicId])

  if (!names) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
      </div>
    )
  }

  // No topic selected — Atlas tree or subject page. General chat, Atlas-flavored.
  if (!topicId || !names.topicTitle) {
    return (
      <AssistConversation
        pageContext={{ kind: 'atlas-subject', subjectId }}
        introText={`${names.subjectName} dersinin konu haritasına bakıyorsun. Bir konu seçersen o konu hakkında birlikte çalışabiliriz — yine de şimdiden bir şey sorabilirsin.`}
        tier={tier}
      />
    )
  }

  const topicTitle = names.topicTitle

  async function saveToVault(lastAnswer: string | null) {
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:      topicTitle,
        content:    lastAnswer ?? '',
        subject_id: subjectId,
        topic_id:   topicId,
      }),
    })
  }

  const quickActions: QuickAction[] = [
    { type: 'prompt', label: 'Bu konuyu açıkla', prompt: `${topicTitle} konusunu bana açıkla.` },
    { type: 'prompt', label: 'Çalışma soruları oluştur', prompt: `${topicTitle} konusuyla ilgili birkaç çalışma sorusu hazırla.` },
    { type: 'save',   label: 'Vault’a not kaydet' },
  ]

  return (
    <AssistConversation
      pageContext={{ kind: 'atlas-topic', subjectId, topicId }}
      introText={`${topicTitle} hakkında ne öğrenmek istiyorsun?`}
      quickActions={quickActions}
      onSave={saveToVault}
      tier={tier}
    />
  )
}
