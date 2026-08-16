'use client'

import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { AssistPageContext } from '@/lib/assist/types'

interface AssistState {
  isOpen:      boolean
  /** Explicit context pushed by a page (currently: Vault's open note/document). */
  override:    AssistPageContext | null
  open:        (ctx?: AssistPageContext) => void
  close:       () => void
  setOverride: (ctx: AssistPageContext | null) => void
}

const AssistContext = createContext<AssistState | null>(null)

export function useAssist(): AssistState {
  const ctx = useContext(AssistContext)
  if (!ctx) throw new Error('useAssist() must be used within <AssistProvider>')
  return ctx
}

export default function AssistProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen]     = useState(false)
  const [override, setOverride] = useState<AssistPageContext | null>(null)

  const open = useCallback((ctx?: AssistPageContext) => {
    if (ctx) setOverride(ctx)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  const value = useMemo(
    () => ({ isOpen, override, open, close, setOverride }),
    [isOpen, override, open, close]
  )

  return <AssistContext.Provider value={value}>{children}</AssistContext.Provider>
}
