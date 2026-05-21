import type { GenerateInput, DaySchedule, BlockType, ScheduleBlock } from './types'
import { INTENSITY_CONFIG } from './types'

// ─────────────────────────────────────────────────────────────────
// Schedule Generator — Creates an optimal daily study plan
// ─────────────────────────────────────────────────────────────────

export function generateDaySchedule(input: GenerateInput): DaySchedule {
  const { date, dailyStudyMins, intensity, startHour, subjects } = input
  const cfg = INTENSITY_CONFIG[intensity]

  if (subjects.length === 0) {
    return { date, blocks: [] }
  }

  const blocks: DaySchedule['blocks'] = []
  let currentMinute = startHour * 60 // minutes from midnight
  let remainingMins = dailyStudyMins
  let order = 0

  // ── Build subject queue (priority + weak boost) ───────────────
  // Weak subjects get 1.5x weight, higher priority = more slots
  const subjectQueue = buildSubjectQueue(subjects, cfg.dailyBlocks)

  // ── Generate blocks ───────────────────────────────────────────
  for (const sub of subjectQueue) {
    if (remainingMins < cfg.sessionMins) break

    // Study block
    const studyEnd = currentMinute + cfg.sessionMins
    const hasReview = sub.needsReviewTopics.length > 0
    const blockType: BlockType = hasReview && blocks.length % 3 === 2 ? 'review' : 'study'

    blocks.push({
      date,
      start_time:   minutesToTime(currentMinute),
      end_time:     minutesToTime(studyEnd),
      block_type:   blockType,
      subject_id:   sub.id,
      subject_name: sub.name,
      topic_hint:   blockType === 'review'
        ? `Tekrar: ${sub.needsReviewTopics[0] ?? sub.name}`
        : null,
      status:       'pending',
      sort_order:   order++,
    })

    currentMinute = studyEnd
    remainingMins -= cfg.sessionMins

    // Break block (skip after last study block)
    if (remainingMins >= cfg.sessionMins + cfg.breakMins) {
      const breakEnd = currentMinute + cfg.breakMins
      blocks.push({
        date,
        start_time:   minutesToTime(currentMinute),
        end_time:     minutesToTime(breakEnd),
        block_type:   'break',
        subject_id:   null,
        subject_name: null,
        topic_hint:   'Kısa mola — streç veya su iç',
        status:       'pending',
        sort_order:   order++,
      })
      currentMinute = breakEnd
      remainingMins -= cfg.breakMins
    }
  }

  return { date, blocks }
}

// ── Build a priority-weighted subject queue ──────────────────────
function buildSubjectQueue(
  subjects: GenerateInput['subjects'],
  maxBlocks: number,
): GenerateInput['subjects'] {
  // Sort by priority (1=highest), weak subjects first in tie
  const sorted = [...subjects].sort((a, b) => {
    if (a.isWeak !== b.isWeak) return a.isWeak ? -1 : 1
    return a.priority - b.priority
  })

  const queue: GenerateInput['subjects'] = []
  let idx = 0

  // Fill up to maxBlocks, round-robin with priority weighting
  while (queue.length < maxBlocks && sorted.length > 0) {
    const sub = sorted[idx % sorted.length]
    queue.push(sub)
    idx++
    // After 2 rounds, stop adding low-priority subjects
    if (idx > sorted.length * 2) break
  }

  return queue
}

// ── Generate a full week schedule ────────────────────────────────
export function generateWeekSchedule(
  baseInput: Omit<GenerateInput, 'date'>,
  weekStartDate: string,
): DaySchedule[] {
  const schedules: DaySchedule[] = []
  const start = new Date(weekStartDate)

  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    schedules.push(generateDaySchedule({ ...baseInput, date: dateStr }))
  }

  return schedules
}

// ── Helpers ──────────────────────────────────────────────────────
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
