// ─────────────────────────────────────────
// Session & Timer types
// ─────────────────────────────────────────
export type SessionType   = 'focus' | 'short_break' | 'long_break'
export type SessionStatus = 'active' | 'completed' | 'interrupted'
export type TimerStatus   = 'idle' | 'running' | 'paused' | 'completed'

// Durations in seconds
export const DURATIONS: Record<SessionType, number> = {
  focus:       25 * 60,  // 1500
  short_break:  5 * 60,  //  300
  long_break:  15 * 60,  //  900
}

export const SESSION_LABELS: Record<SessionType, string> = {
  focus:       'Odak',
  short_break: 'Kısa Mola',
  long_break:  'Uzun Mola',
}

// XP awarded for completing a focus session
export const FOCUS_SESSION_XP = 25

// ─────────────────────────────────────────
// Focus page — duration / mode / ambient sound / rating
// ─────────────────────────────────────────
export type FocusDuration = 25 | 45 | 60 | 'custom'

export const FOCUS_DURATION_OPTIONS: { value: FocusDuration; label: string }[] = [
  { value: 25,       label: '25 min' },
  { value: 45,       label: '45 min' },
  { value: 60,       label: '60 min' },
  { value: 'custom', label: 'Custom' },
]

export type FocusMode = 'focus' | 'deep_focus' | 'study' | 'ambient'

export const FOCUS_MODE_LABELS: Record<FocusMode, string> = {
  focus:      'Focus',
  deep_focus: 'Deep Focus',
  study:      'Study',
  ambient:    'Ambient',
}

export type AmbientSound = 'rain' | 'white_noise' | 'library' | 'none'

export const AMBIENT_SOUND_LABELS: Record<AmbientSound, string> = {
  rain:         'Rain',
  white_noise:  'White Noise',
  library:      'Library',
  none:         'None',
}

export type SessionRating = 'poor' | 'okay' | 'good' | 'excellent'

export const SESSION_RATING_LABELS: Record<SessionRating, string> = {
  poor:      'Poor',
  okay:      'Okay',
  good:      'Good',
  excellent: 'Excellent',
}

// How far out the Recall Engine schedules the next review, per rating.
export const RATING_REVIEW_DAYS: Record<SessionRating, number> = {
  poor:      1,
  okay:      7,
  good:      14,
  excellent: 14,
}

// ─────────────────────────────────────────
// Database row shapes
// ─────────────────────────────────────────
export interface PomodoroSession {
  id:               string
  user_id:          string
  task_id:          string | null
  subject_id:       string | null
  topic_id:         string | null
  type:             SessionType
  duration_seconds: number
  elapsed_seconds:  number
  status:           SessionStatus
  xp_earned:        number
  session_rating:   SessionRating | null
  recall_text:      string | null
  started_at:       string
  completed_at:     string | null
  created_at:       string
}

export interface StudyStatistics {
  user_id:                    string
  total_focus_minutes:        number
  total_sessions_completed:   number
  total_sessions_interrupted: number
  current_session_streak:     number
  longest_streak_sessions:    number
  updated_at:                 string
}

export interface DailyFocusTime {
  id:                 string
  user_id:            string
  date:               string
  focus_minutes:      number
  sessions_completed: number
}

// ─────────────────────────────────────────
// Persisted to localStorage for page-refresh survival
// ─────────────────────────────────────────
export interface PersistedFocusState {
  timerStatus:     TimerStatus
  secondsLeft:     number
  totalSeconds:    number
  activeSessionId: string | null
  mode:            FocusMode
  duration:        FocusDuration
  customMinutes:   number
  subjectId:       string | null
  subjectName:     string | null
  topicId:         string | null
  topicName:       string | null
  linkedTaskId:    string | null
  ambientSound:    AmbientSound
  savedAt:         number          // Date.now() — to detect time passed while away
}

// ─────────────────────────────────────────
// API response shapes
// ─────────────────────────────────────────
export interface StartSessionResponse {
  sessionId: string
}

export interface CompleteSessionResponse {
  xp_earned:           number
  total_xp:            number
  level:               number
  level_up:            boolean
  focus_minutes_today: number
}

export interface StatsResponse {
  statistics:  StudyStatistics | null
  today:       DailyFocusTime  | null
  weekMinutes: number
}

export interface FinishSessionResponse {
  next_review_date: string | null
  task_completed:   boolean
}
