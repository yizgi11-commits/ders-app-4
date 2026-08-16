// ─────────────────────────────────────────────────────────────────
// Noetic Assist — the system-wide contextual helper.
//
// Not a page: a floating button + drawer mounted once at the
// dashboard layout, whose content branches on where the user
// currently is (and, for Vault, on what they have open).
// ─────────────────────────────────────────────────────────────────

/**
 * What the drawer is currently "about". Most kinds are derived purely
 * from the pathname (see contextFromPathname); the vault-note and
 * vault-document kinds are pushed explicitly by Vault via useAssist()
 * because "what note is open" isn't part of the URL.
 */
export type AssistPageContext =
  | { kind: 'atlas-topic'; subjectId: string; topicId: string }
  | { kind: 'atlas-subject'; subjectId: string }
  | { kind: 'atlas' }
  | { kind: 'planner' }
  | { kind: 'vault-note'; noteId: string; title: string }
  | { kind: 'vault-document'; documentId: string; title: string }
  | { kind: 'vault' }
  | { kind: 'insights' }
  | { kind: 'general' }

/** Coarse page section — used to know when to drop a stale override. */
export type AssistSection = 'atlas' | 'planner' | 'vault' | 'insights' | 'other'

export function sectionOf(pathname: string): AssistSection {
  if (pathname.startsWith('/dashboard/atlas'))    return 'atlas'
  if (pathname.startsWith('/dashboard/planner'))  return 'planner'
  if (pathname.startsWith('/dashboard/vault'))    return 'vault'
  if (pathname.startsWith('/dashboard/insights')) return 'insights'
  return 'other'
}

/** Pathname-only context — the baseline before Vault's override (if any) applies. */
export function contextFromPathname(pathname: string): AssistPageContext {
  if (pathname.startsWith('/dashboard/atlas')) {
    const parts = pathname.split('/').filter(Boolean) // ['dashboard','atlas',subjectId?,topicId?]
    const subjectId = parts[2]
    const topicId   = parts[3]
    if (subjectId && topicId) return { kind: 'atlas-topic', subjectId, topicId }
    if (subjectId)            return { kind: 'atlas-subject', subjectId }
    return { kind: 'atlas' }
  }
  if (pathname.startsWith('/dashboard/planner'))  return { kind: 'planner' }
  if (pathname.startsWith('/dashboard/vault'))    return { kind: 'vault' }
  if (pathname.startsWith('/dashboard/insights')) return { kind: 'insights' }
  return { kind: 'general' }
}

export interface AssistChatMessage {
  id:   string
  role: 'user' | 'assistant'
  text: string
}
