// ─────────────────────────────────────────────────────────────────
// SPACED REPETITION ENGINE (Leitner System)
// Calculates optimal review dates for topics
// ─────────────────────────────────────────────────────────────────

// Leitner box intervals (days)
// Box 1: review every 1 day
// Box 2: review every 3 days
// Box 3: review every 7 days
// Box 4: review every 14 days
// Box 5: review every 30 days (mastered)
const BOX_INTERVALS = [1, 3, 7, 14, 30]

export interface ReviewItem {
  topicId:      string
  topicTitle:   string
  subjectName:  string
  subjectIcon:  string
  subjectColor: string
  box:          number       // 1-5 (Leitner box)
  lastReviewed: string | null  // ISO date
  nextReview:   string       // ISO date
  isOverdue:    boolean
  urgency:      'high' | 'medium' | 'low'
}

// Calculate next review date based on Leitner box
export function getNextReviewDate(lastReviewed: string | null, box: number): string {
  const base = lastReviewed ? new Date(lastReviewed) : new Date()
  const interval = BOX_INTERVALS[Math.min(box - 1, BOX_INTERVALS.length - 1)]
  const next = new Date(base)
  next.setDate(next.getDate() + interval)
  return next.toISOString().split('T')[0]
}

// Calculate review schedule from topics
export function calculateReviewSchedule(
  topics: Array<{
    id:          string
    title:       string
    status:      string
    subjectName: string
    subjectIcon: string
    subjectColor: string
    updatedAt:   string | null
  }>
): ReviewItem[] {
  const today = new Date().toISOString().split('T')[0]

  return topics
    .filter(t => t.status === 'needs_review' || t.status === 'in_progress' || t.status === 'completed')
    .map(t => {
      // Determine Leitner box based on status
      const box = statusToBox(t.status)
      const lastReviewed = t.updatedAt?.split('T')[0] ?? null
      const nextReview = getNextReviewDate(lastReviewed, box)
      const isOverdue = nextReview <= today

      // Calculate urgency
      const daysUntil = daysBetween(today, nextReview)
      const urgency: ReviewItem['urgency'] =
        daysUntil <= 0 ? 'high' :
        daysUntil <= 2 ? 'medium' : 'low'

      return {
        topicId: t.id,
        topicTitle: t.title,
        subjectName: t.subjectName,
        subjectIcon: t.subjectIcon,
        subjectColor: t.subjectColor,
        box,
        lastReviewed,
        nextReview,
        isOverdue,
        urgency,
      }
    })
    .sort((a, b) => {
      // Sort: overdue first, then by next review date
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1
      return a.nextReview.localeCompare(b.nextReview)
    })
}

// Map topic status to Leitner box
function statusToBox(status: string): number {
  switch (status) {
    case 'needs_review': return 1 // Needs immediate review
    case 'in_progress':  return 2 // Being learned
    case 'completed':    return 4 // Well known, longer intervals
    default:             return 1
  }
}

// Days between two date strings
function daysBetween(from: string, to: string): number {
  const d1 = new Date(from + 'T00:00:00')
  const d2 = new Date(to + 'T00:00:00')
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

// Get today's review items (overdue + due today)
export function getTodayReviews(items: ReviewItem[]): ReviewItem[] {
  return items.filter(item => item.isOverdue || item.nextReview === new Date().toISOString().split('T')[0])
}

// Summary stats
export function getReviewStats(items: ReviewItem[]) {
  const overdue = items.filter(i => i.isOverdue).length
  const dueToday = items.filter(i => !i.isOverdue && i.nextReview === new Date().toISOString().split('T')[0]).length
  const upcoming = items.filter(i => !i.isOverdue).length
  return { overdue, dueToday, upcoming, total: items.length }
}
