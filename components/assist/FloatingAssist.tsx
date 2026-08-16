'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { useAssist } from './AssistProvider'
import { contextFromPathname, sectionOf, type AssistSection } from '@/lib/assist/types'
import AssistConversation from './AssistConversation'
import AtlasAssistPanel from './AtlasAssistPanel'
import NoeticAssist from '@/components/vault/NoeticAssist'

const SECTION_LABEL: Record<AssistSection, string> = {
  atlas:    'Atlas',
  planner:  'Planner',
  vault:    'Vault',
  insights: 'Insights',
  other:    'Noetic',
}

export default function FloatingAssist() {
  const pathname = usePathname()
  const { isOpen, override, open, close, setOverride } = useAssist()
  const prevSection = useRef<AssistSection>(sectionOf(pathname))

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

  function renderBody() {
    switch (context.kind) {
      case 'atlas-topic':
        return <AtlasAssistPanel subjectId={context.subjectId} topicId={context.topicId} />
      case 'atlas-subject':
        return <AtlasAssistPanel subjectId={context.subjectId} />
      case 'atlas':
        return (
          <AssistConversation
            pageContext={context}
            introText="Derslerinin ve konularının haritasına bakıyorsun. Bir şey sorabilirsin."
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
          />
        )
      case 'vault':
        return (
          <AssistConversation
            pageContext={context}
            introText="Bir not veya belge aç, üzerinde birlikte çalışalım — ya da bana bir şey sor."
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
          />
        )
      default:
        return (
          <AssistConversation
            pageContext={context}
            introText="Bir sorun mu var? Sorabilirsin."
          />
        )
    }
  }

  return (
    <>
      {/* Floating trigger */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 12 }}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => open()}
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm pl-3.5 pr-4 py-3 rounded-full shadow-xl shadow-black/20"
          >
            <Sparkles className="w-4 h-4 text-indigo-300" />
            Assist
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
              className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[380px] bg-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-tight">Noetic Assist</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{SECTION_LABEL[section]}</p>
                  </div>
                </div>
                <button onClick={close} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
                  <X className="w-4 h-4 text-gray-400" />
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
