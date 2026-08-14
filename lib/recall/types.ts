// ─────────────────────────────────────────────────────────────────
// Recall — graded spaced repetition on top of the flashcards table
// ─────────────────────────────────────────────────────────────────

export type RecallGrade = 'again' | 'hard' | 'good' | 'easy'

export const RECALL_GRADES: RecallGrade[] = ['again', 'hard', 'good', 'easy']

export const GRADE_CONFIG: Record<RecallGrade, {
  label:   string
  days:    number
  hint:    string
  color:   string
  bg:      string
  border:  string
  hover:   string
}> = {
  again: {
    label: 'Again', days: 1,  hint: 'yarın',
    color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     hover: 'hover:bg-red-100',
  },
  hard: {
    label: 'Hard',  days: 3,  hint: '3 gün',
    color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   hover: 'hover:bg-amber-100',
  },
  good: {
    label: 'Good',  days: 7,  hint: '7 gün',
    color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200',  hover: 'hover:bg-indigo-100',
  },
  easy: {
    label: 'Easy',  days: 14, hint: '14+ gün',
    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', hover: 'hover:bg-emerald-100',
  },
}

/** Grades that count as "remembered" for the success rate. */
export const SUCCESS_GRADES: RecallGrade[] = ['good', 'easy']

/**
 * Days until the next review. "Easy" stretches with maturity — a card
 * answered Easy for the 4th time waits 28 days rather than the base 14.
 */
export function intervalForGrade(grade: RecallGrade, newReviewCount: number): number {
  if (grade === 'easy') return Math.max(GRADE_CONFIG.easy.days, newReviewCount * 7)
  return GRADE_CONFIG[grade].days
}

// ── Queue ──────────────────────────────────────────────────────
export interface RecallCard {
  id:           string
  front:        string
  back:         string
  review_count: number
  topic_id:     string | null
  subject_id:   string | null
  topic_title:  string | null
  subject_name: string | null
  subject_icon: string | null
  last_reviewed_at: string | null
}

export interface RecallQueueGroup {
  topicId:       string | null
  topicTitle:    string
  subjectName:   string | null
  subjectIcon:   string | null
  cards:         RecallCard[]
  lastStudiedAt: string | null
}

export interface RecallQueueResponse {
  groups:     RecallQueueGroup[]
  totalCards: number
  totalTopics: number
}

// ── Analytics ──────────────────────────────────────────────────
export interface HardTopic {
  topicId:    string | null
  topicTitle: string
  hardCount:  number
  totalCount: number
}

export interface ScheduleDay {
  date:  string
  label: string
  count: number
}

export interface RecallStats {
  totalReviews:     number
  successRate:      number   // 0-100, (good + easy) / total
  gradeBreakdown:   Record<RecallGrade, number>
  hardestTopics:    HardTopic[]
  weeklyReviewed:   number
  weeklyOverdue:    number
  weeklyCompletion: number   // 0-100
  schedule:         ScheduleDay[]
}

// ── Helpers ────────────────────────────────────────────────────
export function daysAgoLabel(iso: string | null): string | null {
  if (!iso) return null
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return 'bugün'
  if (days === 1) return 'dün'
  return `${days} gün önce`
}
