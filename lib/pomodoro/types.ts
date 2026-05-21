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
// Database row shapes
// ─────────────────────────────────────────
export interface PomodoroSession {
  id:               string
  user_id:          string
  task_id:          string | null
  type:             SessionType
  duration_seconds: number
  elapsed_seconds:  number
  status:           SessionStatus
  xp_earned:        number
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
export interface PersistedTimerState {
  timerStatus:       TimerStatus
  sessionType:       SessionType
  secondsLeft:       number
  totalSeconds:      number
  sessionCount:      number          // focus sessions completed this cycle (0–4)
  activeSessionId:   string | null
  linkedTaskId:      string | null
  savedAt:           number          // Date.now() — to detect time passed while away
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
