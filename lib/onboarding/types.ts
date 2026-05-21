// ─────────────────────────────────────────────────────────────────
// Onboarding — Types & Constants
// ─────────────────────────────────────────────────────────────────

export type StudyGoal       = 'universite_sinavi' | 'lise_sinavi' | 'genel_basari' | 'sertifika'
export type ExamType        = 'YKS' | 'LGS' | 'KPSS' | 'DGS' | 'ALES' | 'diger'
export type PreferredHours  = 'morning' | 'afternoon' | 'evening' | 'night'
export type FocusIntensity  = 'light' | 'normal' | 'intense'
export type ConsistencyLevel = 'never' | 'rarely' | 'sometimes' | 'often' | 'daily'

export interface OnboardingData {
  displayName:      string
  studyGoal:        StudyGoal
  examType:         ExamType | null
  dailyAvailMins:   number
  weakSubjects:     string[]        // free text subjects
  preferredHours:   PreferredHours
  focusIntensity:   FocusIntensity
  consistencyLevel: ConsistencyLevel
}

export interface UserProfile {
  id:                    string
  user_id:               string
  display_name:          string | null
  study_goal:            string | null
  exam_type:             string | null
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
  { key: 'welcome',     title: 'Hoş Geldin' },
  { key: 'goal',        title: 'Hedefin' },
  { key: 'time',        title: 'Zaman' },
  { key: 'subjects',    title: 'Dersler' },
  { key: 'habits',      title: 'Alışkanlıklar' },
  { key: 'ready',       title: 'Hazır!' },
] as const

// ── Goal options ──
export const STUDY_GOALS: { value: StudyGoal; label: string; emoji: string; desc: string }[] = [
  { value: 'universite_sinavi', label: 'Üniversite Sınavı',  emoji: '🎓', desc: 'YKS, TYT, AYT hazırlık' },
  { value: 'lise_sinavi',       label: 'Lise Sınavı',        emoji: '📚', desc: 'LGS veya lise sınavları' },
  { value: 'genel_basari',      label: 'Genel Başarı',       emoji: '⭐', desc: 'Notlarımı yükseltmek istiyorum' },
  { value: 'sertifika',         label: 'Sertifika/Kariyer',  emoji: '💼', desc: 'KPSS, DGS, ALES veya sertifika' },
]

// ── Exam options (shown conditionally) ──
export const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: 'YKS',   label: 'YKS (TYT/AYT)' },
  { value: 'LGS',   label: 'LGS' },
  { value: 'KPSS',  label: 'KPSS' },
  { value: 'DGS',   label: 'DGS' },
  { value: 'ALES',  label: 'ALES' },
  { value: 'diger', label: 'Diğer' },
]

// ── Preferred hours ──
export const PREFERRED_HOURS: { value: PreferredHours; label: string; emoji: string; range: string }[] = [
  { value: 'morning',   label: 'Sabah',    emoji: '🌅', range: '06:00 – 12:00' },
  { value: 'afternoon', label: 'Öğlen',    emoji: '☀️', range: '12:00 – 17:00' },
  { value: 'evening',   label: 'Akşam',    emoji: '🌆', range: '17:00 – 21:00' },
  { value: 'night',     label: 'Gece',     emoji: '🌙', range: '21:00 – 02:00' },
]

// ── Intensity ──
export const FOCUS_OPTIONS: { value: FocusIntensity; label: string; emoji: string; desc: string }[] = [
  { value: 'light',   label: 'Hafif',  emoji: '🌿', desc: 'Kısa seanslar, bol mola' },
  { value: 'normal',  label: 'Normal', emoji: '⚡', desc: 'Dengeli tempo, verimli çalışma' },
  { value: 'intense', label: 'Yoğun',  emoji: '🔥', desc: 'Uzun seanslar, maraton çalışma' },
]

// ── Consistency ──
export const CONSISTENCY_OPTIONS: { value: ConsistencyLevel; label: string; emoji: string }[] = [
  { value: 'never',     label: 'Hiç düzenli değilim',       emoji: '😅' },
  { value: 'rarely',    label: 'Nadiren çalışıyorum',       emoji: '🤔' },
  { value: 'sometimes', label: 'Bazen düzenli oluyor',      emoji: '📖' },
  { value: 'often',     label: 'Çoğunlukla düzenliyim',     emoji: '💪' },
  { value: 'daily',     label: 'Her gün çalışıyorum',       emoji: '🔥' },
]

// ── Default subjects by goal ──
export const DEFAULT_SUBJECTS: Record<StudyGoal, { name: string; icon: string; color: string }[]> = {
  universite_sinavi: [
    { name: 'Matematik',  icon: '📐', color: '#6366f1' },
    { name: 'Türkçe',     icon: '📝', color: '#8b5cf6' },
    { name: 'Fizik',      icon: '⚛️', color: '#3b82f6' },
    { name: 'Kimya',      icon: '🧪', color: '#10b981' },
    { name: 'Biyoloji',   icon: '🧬', color: '#f59e0b' },
    { name: 'Tarih',      icon: '🏛️', color: '#ef4444' },
  ],
  lise_sinavi: [
    { name: 'Matematik',  icon: '📐', color: '#6366f1' },
    { name: 'Türkçe',     icon: '📝', color: '#8b5cf6' },
    { name: 'Fen Bilimleri', icon: '🔬', color: '#10b981' },
    { name: 'Sosyal Bilgiler', icon: '🌍', color: '#f59e0b' },
    { name: 'İngilizce',  icon: '🇬🇧', color: '#3b82f6' },
    { name: 'Din Kültürü', icon: '📖', color: '#ef4444' },
  ],
  genel_basari: [
    { name: 'Matematik',  icon: '📐', color: '#6366f1' },
    { name: 'Türkçe',     icon: '📝', color: '#8b5cf6' },
    { name: 'İngilizce',  icon: '🇬🇧', color: '#3b82f6' },
  ],
  sertifika: [
    { name: 'Ana Alan',   icon: '📚', color: '#6366f1' },
    { name: 'Genel Kültür', icon: '🌍', color: '#f59e0b' },
    { name: 'Matematik',  icon: '📐', color: '#8b5cf6' },
  ],
}

// ── Map preferred hours to start_hour ──
export const HOURS_TO_START: Record<PreferredHours, number> = {
  morning:   8,
  afternoon: 14,
  evening:   17,
  night:     21,
}
