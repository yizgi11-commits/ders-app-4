'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { useAssist } from './AssistProvider'
import { contextFromPathname, sectionOf, type AssistSection } from '@/lib/assist/types'
import { pageTitle } from '@/components/dashboard/nav'
import type { SubscriptionTier } from '@/lib/subscription'
import AssistConversation from './AssistConversation'
import AtlasAssistPanel from './AtlasAssistPanel'
import NoeticAssist from '@/components/vault/NoeticAssist'

export default function FloatingAssist({ tier }: { tier: SubscriptionTier }) {
  const pathname = usePathname()
  const { isOpen, override, open, close, setOverride } = useAssist()
  const prevSection = useRef<AssistSection>(sectionOf(pathname))
  // "Subject / Topic" reported by AtlasAssistPanel once it has loaded the names.
  const [atlasLabel, setAtlasLabel] = useState<string | null>(null)
  useEffect(() => { setAtlasLabel(null) }, [pathname])

  // Drop a stale Vault override (open note/document) once the user leaves Vault.
  useEffect(() => {
    const section = sectionOf(pathname)
    if (section !== prevSection.current) {
      prevSection.current = section
      if (override) setOverride(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const section = sectionOf(pathname)
  // The override is only ever pushed by Vault (open note/document), so it's
  // only honored while the user is still somewhere under /dashboard/vault.
  const context = (override && section === 'vault') ? override : contextFromPathname(pathname)

  function contextLabel(): string {
    switch (context.kind) {
      case 'atlas-topic':
      case 'atlas-subject':  return atlasLabel ?? 'Atlas'
      case 'vault-note':
      case 'vault-document': return `Vault / ${context.title}`
      default:               return pageTitle(pathname)
    }
  }

  function renderBody() {
    switch (context.kind) {
      case 'atlas-topic':
        return <AtlasAssistPanel subjectId={context.subjectId} topicId={context.topicId} tier={tier} onContextLabel={setAtlasLabel} />
      case 'atlas-subject':
        return <AtlasAssistPanel subjectId={context.subjectId} tier={tier} onContextLabel={setAtlasLabel} />
      case 'atlas':
        return (
          <AssistConversation
            pageContext={context}
            introText="Derslerinin ve konularının haritasına bakıyorsun. Bir şey sorabilirsin."
            tier={tier}
          />
        )
      case 'planner':
        return (
          <AssistConversation
            pageContext={context}
            introText="Bu haftanı düzenlememe yardımcı olmamı ister misin?"
            quickActions={[
              { type: 'prompt', label: 'Plan öner', prompt: 'Önümüzdeki 7 gün için bir çalışma planı öner.' },
              { type: 'prompt', label: 'Sınava göre düzenle', prompt: 'Yaklaşan sınavlarıma göre önceliklerimi nasıl düzenlemeliyim?' },
            ]}
            tier={tier}
          />
        )
      case 'vault-note':
        return (
          <NoeticAssist
            source="note"
            id={context.noteId}
            title={context.title}
            onClose={() => setOverride(null)}
            onFlashcardsSaved={() => window.dispatchEvent(new Event('noetic:flashcards-saved'))}
            embedded
            tier={tier}
          />
        )
      case 'vault-document':
        return (
          <NoeticAssist
            source="document"
            id={context.documentId}
            title={context.title}
            onClose={() => setOverride(null)}
            onFlashcardsSaved={() => window.dispatchEvent(new Event('noetic:flashcards-saved'))}
            embedded
            tier={tier}
          />
        )
      case 'vault':
        return (
          <AssistConversation
            pageContext={context}
            introText="Bir not veya belge aç, üzerinde birlikte çalışalım — ya da bana bir şey sor."
            tier={tier}
          />
        )
      case 'insights':
        return (
          <AssistConversation
            pageContext={context}
            introText="Bu veri hakkında ne öğrenmek istiyorsun?"
            quickActions={[
              { type: 'prompt', label: 'Bu veriyi açıkla', prompt: 'Bu haftaki verilerimi yorumla.' },
              { type: 'prompt', label: 'Ne yapmalıyım?', prompt: 'Bu verilere göre önümüzdeki hafta ne yapmalıyım?' },
            ]}
            tier={tier}
          />
        )
      default:
        return (
          <AssistConversation
            pageContext={context}
            introText="Assist bulunduğun sayfaya göre çalışır: Atlas'ta konuyu açıklar, Planner'da plan önerir, Vault'ta notlarını özetler."
            tier={tier}
          />
        )
    }
  }

  return (
    <>
      {/* Floating trigger — sits above the mobile tab bar below lg */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => open()}
            aria-label="Noetic Assist'i aç"
            title="Noetic Assist"
            className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 size-10 rounded-full bg-dark-base text-white shadow-md ring-1 ring-white/10 flex items-center justify-center transition-transform duration-[160ms] hover:scale-105"
          >
            <Sparkles className="size-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[360px] bg-surface border-l border-border shadow-lg flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 px-4 py-3.5 border-b border-border shrink-0">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium tracking-[0.08em] text-text">NOETIC ASSIST</p>
                  <p className="text-sm text-text-muted truncate mt-0.5">Bağlam: {contextLabel()}</p>
                </div>
                <button
                  onClick={close}
                  aria-label="Kapat"
                  className="p-1.5 -mr-1.5 rounded-md text-text-secondary hover:text-text hover:bg-surface-subtle transition-colors duration-[160ms] shrink-0"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 min-h-0 flex flex-col">
                {renderBody()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
