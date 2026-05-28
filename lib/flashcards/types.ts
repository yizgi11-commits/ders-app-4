// ─────────────────────────────────────────────────────────────────
// Flashcard Types
// ─────────────────────────────────────────────────────────────────

export interface Flashcard {
  id:               string
  user_id:          string
  subject_id:       string | null
  front:            string
  back:             string
  source_pdf:       string | null
  source_pdf_name:  string | null
  next_review_date: string   // 'YYYY-MM-DD'
  review_count:     number
  created_at:       string
}

export interface FlashcardWithSubject extends Flashcard {
  subjects?: {
    id:    string
    name:  string
    icon:  string
    color: string
  } | null
}

export type ReviewResult = 'know' | 'again'
