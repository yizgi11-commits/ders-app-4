// ─────────────────────────────────────────────────────────────────
// Vault — unified knowledge store (notes + flashcards + documents)
// ─────────────────────────────────────────────────────────────────

export type VaultTab = 'all' | 'notes' | 'flashcards' | 'documents' | 'saved'

export const VAULT_TABS: { id: VaultTab; label: string }[] = [
  { id: 'all',        label: 'All' },
  { id: 'notes',      label: 'Notes' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'documents',  label: 'Documents' },
  { id: 'saved',      label: 'Saved' },
]

export interface VaultDocument {
  id:             string
  user_id:        string
  name:           string
  storage_path:   string | null
  size_bytes:     number
  extracted_text: string
  subject_id:     string | null
  topic_id:       string | null
  is_favorite:    boolean
  created_at:     string
  subjects?:      { id: string; name: string; icon: string; color: string } | null
  topics?:        { id: string; title: string } | null
}

// ── Noetic Assist ──────────────────────────────────────────────
export type AssistAction = 'summarize' | 'flashcards' | 'explain' | 'quiz'
export type AssistSource = 'note' | 'document'

export const ASSIST_ACTIONS: { id: AssistAction; label: string; emoji: string }[] = [
  { id: 'summarize',  label: 'Özetle',            emoji: '📝' },
  { id: 'flashcards', label: 'Flashcard Oluştur', emoji: '🃏' },
  { id: 'explain',    label: 'Açıkla',            emoji: '💡' },
  { id: 'quiz',       label: 'Quiz Oluştur',      emoji: '❓' },
]

export interface AssistQuizQuestion {
  question: string
  options:  string[]
  correct:  number
}

export interface AssistResult {
  summarize?:  { text: string }
  explain?:    { text: string }
  flashcards?: { saved: number; cards: { front: string; back: string }[] }
  quiz?:       { questions: AssistQuizQuestion[] }
}

// ── "All" feed ─────────────────────────────────────────────────
export type VaultItemKind = 'note' | 'flashcard' | 'document'

export interface VaultFeedItem {
  kind:     VaultItemKind
  id:       string
  title:    string
  subtitle: string | null
  /** Atlas breadcrumb, e.g. "Math > Functions" */
  atlas:    string | null
  date:     string
}

export function atlasLabel(
  subject?: { name: string } | null,
  topic?:   { title: string } | null,
): string | null {
  if (!subject && !topic) return null
  if (subject && topic)   return `${subject.name} > ${topic.title}`
  return subject?.name ?? topic?.title ?? null
}

export function relativeTime(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins} minute${mins === 1 ? '' : 's'} ago`
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  if (days < 30)  return `${days} day${days === 1 ? '' : 's'} ago`
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '—'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
