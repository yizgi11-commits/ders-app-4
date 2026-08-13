// ─────────────────────────────────────────────────────────────────
// Study Planner — Types
// ─────────────────────────────────────────────────────────────────

export type StudyIntensity = 'light' | 'normal' | 'intense'
export type BlockType      = 'study' | 'pomodoro' | 'break' | 'review'
export type PlanStatus     = 'pending' | 'completed' | 'skipped'

export const INTENSITY_CONFIG: Record<StudyIntensity, {
  label:        string
  emoji:        string
  desc:         string
  sessionMins:  number
  breakMins:    number
  dailyBlocks:  number  // max study blocks per day
}> = {
  light: {
    label: 'Hafif',
    emoji: '🌿',
    desc:  'Günlük 2-3 blok, kısa seanslar',
    sessionMins: 25,
    breakMins:   10,
    dailyBlocks: 3,
  },
  normal: {
    label: 'Normal',
    emoji: '⚡',
    desc:  'Günlük 4-5 blok, dengeli program',
    sessionMins: 30,
    breakMins:   10,
    dailyBlocks: 5,
  },
  intense: {
    label: 'Yoğun',
    emoji: '🔥',
    desc:  'Günlük 6-8 blok, maraton çalışma',
    sessionMins: 35,
    breakMins:    5,
    dailyBlocks: 8,
  },
}

export const BLOCK_TYPE_CONFIG: Record<BlockType, {
  label:  string
  emoji:  string
  color:  string
  bg:     string
  border: string
}> = {
  study: {
    label:  'Çalışma',
    emoji:  '📖',
    color:  'text-indigo-400',
    bg:     'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  pomodoro: {
    label:  'Pomodoro',
    emoji:  '🎯',
    color:  'text-violet-400',
    bg:     'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  break: {
    label:  'Mola',
    emoji:  '☕',
    color:  'text-emerald-400',
    bg:     'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  review: {
    label:  'Tekrar',
    emoji:  '🔄',
    color:  'text-amber-400',
    bg:     'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
}

// ── DB Row: User preferences ──
export interface StudyPreferences {
  id:                string
  user_id:           string
  daily_study_mins:  number        // available minutes per day
  intensity:         StudyIntensity
  start_hour:        number        // e.g. 16 → 16:00
  subject_priorities: string[]     // ordered subject IDs
  weak_subjects:     string[]      // subject IDs
  created_at:        string
  updated_at:        string
}

// ── DB Row: Schedule Block ──
export interface ScheduleBlock {
  id:          string
  user_id:     string
  date:        string    // YYYY-MM-DD
  start_time:  string    // HH:MM
  end_time:    string    // HH:MM
  block_type:  BlockType
  subject_id:  string | null
  subject_name: string | null
  topic_hint:  string | null  // suggested topic or activity
  status:      PlanStatus
  sort_order:  number
  created_at:  string
}

// ── For the plan generator ──
export interface GenerateInput {
  date:             string
  dailyStudyMins:   number
  intensity:        StudyIntensity
  startHour:        number
  subjects:         Array<{
    id:   string
    name: string
    icon: string
    color: string
    priority: number      // 1=highest
    isWeak: boolean
    needsReviewTopics: string[]  // topic titles
  }>
}

export interface DaySchedule {
  date:   string
  blocks: Omit<ScheduleBlock, 'id' | 'user_id' | 'created_at'>[]
}

// ── Weekly overview ──
export interface WeekDay {
  date:       string
  dayName:    string
  isToday:    boolean
  blocks:     ScheduleBlock[]
  totalMins:  number
  completed:  number
  total:      number
}

// ─────────────────────────────────────────────────────────────────
// Planner — Tasks / Goals / Exams
// ─────────────────────────────────────────────────────────────────
export type TaskPriority = 'high' | 'medium' | 'low'

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; border: string }> = {
  high:   { label: 'High',   color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
  medium: { label: 'Medium', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  low:    { label: 'Low',    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
}

export const DURATION_OPTIONS = [15, 30, 45, 60, 90] as const

// A daily_tasks row created from the Planner (source = 'planner')
export interface PlannerTask {
  id:                string
  user_id:           string
  date:              string
  completed:         boolean
  completed_at:      string | null
  duration_minutes:  number | null
  priority:          TaskPriority | null
  subject_id:        string | null
  topic_id:          string | null
  topic_text:        string | null
  created_at:        string
  subjects?:         { id: string; name: string; icon: string; color: string } | null
  topics?:            { id: string; title: string } | null
}

export interface Goal {
  id:                   string
  user_id:              string
  title:                string
  subject_id:           string | null
  topic_id:             string | null
  deadline:             string | null
  manual_progress_pct:  number
  completed:            boolean
  created_at:           string
  updated_at:           string
  subjects?:            { id: string; name: string; icon: string; color: string } | null
  progress_pct?:        number  // computed: topic progress if linked, else manual_progress_pct
}

export interface Exam {
  id:          string
  user_id:     string
  name:        string
  exam_date:   string
  subject_id:  string | null
  created_at:  string
  subjects?:   { id: string; name: string; icon: string; color: string } | null
}
