// ─────────────────────────────────────────────────────────────────
// Onboarding — Types & Constants
// ─────────────────────────────────────────────────────────────────

export type StudyGoal       = 'sinav_hazirligi' | 'ders_basarisi' | 'duzenli_aliskanlik' | 'genel_gelisim'
export type GradeLevel      = '9' | '10' | '11' | '12' | 'universite' | 'diger'
export type DailyGoalHours  = 1 | 2 | 3 | 4   // 4 = "4+ saat"
export type StudyDifficulty =
  | 'ne_calisacagimi_bilmiyorum'
  | 'odaklanamiyorum'
  | 'unutuyorum'
  | 'tekrar_yapamiyorum'
  | 'gelisim_goremiyorum'

// ── Still used by the Settings page (unrelated to the onboarding wizard) ──
export type PreferredHours  = 'morning' | 'afternoon' | 'evening' | 'night'
export type FocusIntensity  = 'light' | 'normal' | 'intense'

export interface OnboardingData {
  displayName:    string
  studyGoal:      StudyGoal
  gradeLevel:     GradeLevel | null
  subjects:       string[]          // selected subject names (multi-select)
  dailyGoalHours: DailyGoalHours
  difficulties:   StudyDifficulty[] // multi-select
}

export interface UserProfile {
  id:                    string
  user_id:               string
  display_name:          string | null
  study_goal:            string | null
  exam_type:             string | null
  grade_level:           string | null
  daily_available_mins:  number
  preferred_hours:       string
  focus_intensity:       string
  consistency_level:     string
  onboarding_completed:  boolean
  onboarding_step:       number
  created_at:            string
  updated_at:            string
}

// ── Step definitions ──
export const ONBOARDING_STEPS = [
  { key: 'goal',       title: 'Hedefin' },
  { key: 'grade',      title: 'Sınıfın' },
  { key: 'subjects',   title: 'Derslerin' },
  { key: 'daily-goal', title: 'Günlük Hedef' },
  { key: 'difficulty', title: 'Zorluk Analizi' },
  { key: 'ready',      title: 'Hazır!' },
] as const

// ── Goal options ──
export const STUDY_GOALS: { value: StudyGoal; label: string; emoji: string; desc: string }[] = [
  { value: 'sinav_hazirligi',    label: 'Sınav hazırlığı (YKS/LGS)',      emoji: '🎯', desc: 'Sınava yönelik yoğun hazırlık' },
  { value: 'ders_basarisi',      label: 'Ders başarısını artırmak',       emoji: '📈', desc: 'Notlarımı yükseltmek istiyorum' },
  { value: 'duzenli_aliskanlik', label: 'Düzenli çalışma alışkanlığı',    emoji: '🗓️', desc: 'İstikrarlı bir rutin kurmak istiyorum' },
  { value: 'genel_gelisim',      label: 'Genel öğrenme ve gelişim',       emoji: '🌱', desc: 'Merak ettiğim konularda kendimi geliştirmek' },
]

// ── Grade / class level options ──
export const GRADE_LEVELS: { value: GradeLevel; label: string }[] = [
  { value: '9',          label: '9. Sınıf' },
  { value: '10',         label: '10. Sınıf' },
  { value: '11',         label: '11. Sınıf' },
  { value: '12',         label: '12. Sınıf' },
  { value: 'universite',  label: 'Üniversite' },
  { value: 'diger',       label: 'Diğer' },
]

// ── Daily goal (hours) options ──
export const DAILY_GOAL_OPTIONS: { value: DailyGoalHours; label: string }[] = [
  { value: 1, label: '1 saat' },
  { value: 2, label: '2 saat' },
  { value: 3, label: '3 saat' },
  { value: 4, label: '4+ saat' },
]

// ── Difficulty options ──
export const DIFFICULTY_OPTIONS: { value: StudyDifficulty; label: string; emoji: string }[] = [
  { value: 'ne_calisacagimi_bilmiyorum', label: 'Ne çalışacağımı bilmiyorum',       emoji: '🧭' },
  { value: 'odaklanamiyorum',            label: 'Odaklanamıyorum',                  emoji: '💭' },
  { value: 'unutuyorum',                 label: 'Öğrendiklerimi unutuyorum',        emoji: '🌫️' },
  { value: 'tekrar_yapamiyorum',         label: 'Düzenli tekrar yapamıyorum',       emoji: '🔁' },
  { value: 'gelisim_goremiyorum',        label: 'Gelişimimi göremiyorum',           emoji: '📉' },
]

// ── Preferred hours (Settings page) ──
export const PREFERRED_HOURS: { value: PreferredHours; label: string; emoji: string; range: string }[] = [
  { value: 'morning',   label: 'Sabah',    emoji: '🌅', range: '06:00 – 12:00' },
  { value: 'afternoon', label: 'Öğlen',    emoji: '☀️', range: '12:00 – 17:00' },
  { value: 'evening',   label: 'Akşam',    emoji: '🌆', range: '17:00 – 21:00' },
  { value: 'night',     label: 'Gece',     emoji: '🌙', range: '21:00 – 02:00' },
]

// ── Focus intensity (Settings page) ──
export const FOCUS_OPTIONS: { value: FocusIntensity; label: string; emoji: string; desc: string }[] = [
  { value: 'light',   label: 'Hafif',  emoji: '🌿', desc: 'Kısa seanslar, bol mola' },
  { value: 'normal',  label: 'Normal', emoji: '⚡', desc: 'Dengeli tempo, verimli çalışma' },
  { value: 'intense', label: 'Yoğun',  emoji: '🔥', desc: 'Uzun seanslar, maraton çalışma' },
]

// ── Default subjects by goal (reuses the existing subject/icon/color system) ──
const EXAM_SUBJECTS = [
  { name: 'Matematik',  icon: '📐', color: '#6366f1' },
  { name: 'Türkçe',     icon: '📝', color: '#8b5cf6' },
  { name: 'Fizik',      icon: '⚛️', color: '#3b82f6' },
  { name: 'Kimya',      icon: '🧪', color: '#10b981' },
  { name: 'Biyoloji',   icon: '🧬', color: '#f59e0b' },
  { name: 'Tarih',      icon: '🏛️', color: '#ef4444' },
]

const GENERAL_SUBJECTS = [
  { name: 'Matematik',  icon: '📐', color: '#6366f1' },
  { name: 'Türkçe',     icon: '📝', color: '#8b5cf6' },
  { name: 'İngilizce',  icon: '🇬🇧', color: '#3b82f6' },
]

export const DEFAULT_SUBJECTS: Record<StudyGoal, { name: string; icon: string; color: string }[]> = {
  sinav_hazirligi:    EXAM_SUBJECTS,
  ders_basarisi:      GENERAL_SUBJECTS,
  duzenli_aliskanlik: GENERAL_SUBJECTS,
  genel_gelisim:      GENERAL_SUBJECTS,
}
