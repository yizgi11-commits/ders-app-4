// ─────────────────────────────────────────────────────────────────
// Derslerim — Types
// ─────────────────────────────────────────────────────────────────

export type TopicStatus = 'not_started' | 'in_progress' | 'needs_review' | 'completed'

export const TOPIC_STATUS_LABELS: Record<TopicStatus, string> = {
  not_started:  'Başlanmadı',
  in_progress:  'Çalışılıyor',
  needs_review: 'Tekrar Gerekli',
  completed:    'Tamamlandı',
}

export const TOPIC_STATUS_CONFIG: Record<TopicStatus, {
  label: string
  color: string
  bg:    string
  border: string
  dot:   string
}> = {
  not_started: {
    label:  'Başlanmadı',
    color:  'text-white/40',
    bg:     'bg-white/[0.05]',
    border: 'border-white/[0.08]',
    dot:    'bg-white/20',
  },
  in_progress: {
    label:  'Çalışılıyor',
    color:  'text-indigo-400',
    bg:     'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    dot:    'bg-indigo-400',
  },
  needs_review: {
    label:  'Tekrar Gerekli',
    color:  'text-amber-400',
    bg:     'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot:    'bg-amber-400',
  },
  completed: {
    label:  'Tamamlandı',
    color:  'text-emerald-400',
    bg:     'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot:    'bg-emerald-400',
  },
}

// ── Subject preset colors ──
export const SUBJECT_COLORS = [
  { id: 'indigo',  label: 'İndigo',  value: '#6366f1', ring: 'ring-indigo-500/30'  },
  { id: 'violet',  label: 'Mor',     value: '#8b5cf6', ring: 'ring-violet-500/30'  },
  { id: 'blue',    label: 'Mavi',    value: '#3b82f6', ring: 'ring-blue-500/30'    },
  { id: 'emerald', label: 'Yeşil',   value: '#10b981', ring: 'ring-emerald-500/30' },
  { id: 'amber',   label: 'Sarı',    value: '#f59e0b', ring: 'ring-amber-500/30'   },
  { id: 'rose',    label: 'Pembe',   value: '#f43f5e', ring: 'ring-rose-500/30'    },
  { id: 'orange',  label: 'Turuncu', value: '#f97316', ring: 'ring-orange-500/30'  },
  { id: 'cyan',    label: 'Camgöbeği', value: '#06b6d4', ring: 'ring-cyan-500/30'  },
] as const

export const SUBJECT_ICONS = [
  '📐', '🧪', '⚗️', '🧬', '📖', '🌍', '🎨', '💻',
  '📊', '🔬', '📝', '🎵', '🏃', '🇬🇧', '📚', '🧠',
] as const

// ── DB Row Shapes ──
export interface Subject {
  id:           string
  user_id:      string
  name:         string
  icon:         string
  color:        string   // hex
  sort_order:   number
  created_at:   string
  updated_at:   string
}

export interface Topic {
  id:           string
  subject_id:   string
  user_id:      string
  title:        string
  status:       TopicStatus
  notes:        string | null
  sort_order:   number
  created_at:   string
  updated_at:   string
}

export interface SubjectWithTopics extends Subject {
  topics: Topic[]
}

// ── Analytics ──
export interface SubjectAnalytics {
  subjectName:     string
  totalFocusMins:  number
  tasksCompleted:  number
  totalXpEarned:   number
  sessionsCount:   number
}

// ─────────────────────────────────────────────────────────────────
// Atlas — computed topic/subject progress
// ─────────────────────────────────────────────────────────────────
export interface TopicProgress extends Topic {
  progress_pct:    number         // 0-100, derived from activity signals below
  has_focus:       boolean        // at least one completed Focus session
  has_recall:      boolean        // at least one reviewed Recall card
  has_note:        boolean        // at least one Vault note
  last_studied_at: string | null  // ISO date, most recent activity
}

export interface SubjectWithProgress extends Subject {
  topics:          TopicProgress[]
  completedTopics: number
  totalTopics:     number
  subjectPct:      number         // completedTopics / totalTopics * 100
}

export const PROGRESS_WEIGHTS = {
  focus:  34,
  recall: 33,
  note:   33,
} as const
