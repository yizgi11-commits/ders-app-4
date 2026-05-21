import type { Achievement } from './types'

// ─────────────────────────────────────────────────────────────────
// Achievement Definitions
// All conditions are evaluated against a UserStats snapshot.
// ─────────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  // ── Pomodoro ─────────────────────────────────────────────────
  {
    id:        'FIRST_POMODORO',
    title:     'İlk Adım',
    desc:      'İlk Pomodoro oturumunu tamamla',
    icon:      '🎯',
    xpReward:  50,
    rarity:    'common',
    category:  'pomodoro',
    condition: s => s.totalSessionsCompleted >= 1,
  },
  {
    id:        'POMODORO_10',
    title:     'Odak Makinesi',
    desc:      '10 Pomodoro oturumu tamamla',
    icon:      '⚡',
    xpReward:  150,
    rarity:    'uncommon',
    category:  'pomodoro',
    condition: s => s.totalSessionsCompleted >= 10,
  },
  {
    id:        'POMODORO_50',
    title:     'Pomodoro Ustası',
    desc:      '50 Pomodoro oturumu tamamla',
    icon:      '🏆',
    xpReward:  400,
    rarity:    'rare',
    category:  'pomodoro',
    condition: s => s.totalSessionsCompleted >= 50,
  },
  {
    id:        'POMODORO_200',
    title:     'Efsane Odak',
    desc:      '200 Pomodoro oturumu tamamla',
    icon:      '💎',
    xpReward:  1000,
    rarity:    'legendary',
    category:  'pomodoro',
    condition: s => s.totalSessionsCompleted >= 200,
  },

  // ── Streak ───────────────────────────────────────────────────
  {
    id:        'STREAK_3',
    title:     'Üç Gün Seri',
    desc:      '3 gün üst üste çalış',
    icon:      '🔥',
    xpReward:  75,
    rarity:    'common',
    category:  'streak',
    condition: s => s.currentStreak >= 3,
  },
  {
    id:        'STREAK_7',
    title:     'Haftalık Seri',
    desc:      '7 gün üst üste çalış',
    icon:      '🌟',
    xpReward:  200,
    rarity:    'uncommon',
    category:  'streak',
    condition: s => s.currentStreak >= 7,
  },
  {
    id:        'STREAK_30',
    title:     'Aylık Seri',
    desc:      '30 gün üst üste çalış',
    icon:      '👑',
    xpReward:  750,
    rarity:    'rare',
    category:  'streak',
    condition: s => s.currentStreak >= 30,
  },
  {
    id:        'STREAK_100',
    title:     'Efsane Seri',
    desc:      '100 gün üst üste çalış',
    icon:      '⚜️',
    xpReward:  2000,
    rarity:    'legendary',
    category:  'streak',
    condition: s => s.currentStreak >= 100,
  },

  // ── Tasks ────────────────────────────────────────────────────
  {
    id:        'FIRST_TASK',
    title:     'İlk Görev',
    desc:      'İlk günlük görevini tamamla',
    icon:      '✅',
    xpReward:  25,
    rarity:    'common',
    category:  'task',
    condition: s => s.totalTasksCompleted >= 1,
  },
  {
    id:        'TASK_10',
    title:     'Görev Avcısı',
    desc:      '10 görev tamamla',
    icon:      '🎖️',
    xpReward:  100,
    rarity:    'common',
    category:  'task',
    condition: s => s.totalTasksCompleted >= 10,
  },
  {
    id:        'TASK_50',
    title:     'Verimli Öğrenci',
    desc:      '50 görev tamamla',
    icon:      '📚',
    xpReward:  300,
    rarity:    'uncommon',
    category:  'task',
    condition: s => s.totalTasksCompleted >= 50,
  },
  {
    id:        'TASK_200',
    title:     'Görev Efsanesi',
    desc:      '200 görev tamamla',
    icon:      '🦾',
    xpReward:  1000,
    rarity:    'legendary',
    category:  'task',
    condition: s => s.totalTasksCompleted >= 200,
  },

  // ── XP ───────────────────────────────────────────────────────
  {
    id:        'XP_500',
    title:     'XP Toplayıcı',
    desc:      '500 XP kazan',
    icon:      '⚡',
    xpReward:  50,
    rarity:    'common',
    category:  'xp',
    condition: s => s.totalXp >= 500,
  },
  {
    id:        'XP_2000',
    title:     'XP Makinesi',
    desc:      '2000 XP kazan',
    icon:      '🔋',
    xpReward:  150,
    rarity:    'uncommon',
    category:  'xp',
    condition: s => s.totalXp >= 2000,
  },
  {
    id:        'XP_10000',
    title:     'XP Ustası',
    desc:      '10,000 XP kazan',
    icon:      '💫',
    xpReward:  500,
    rarity:    'rare',
    category:  'xp',
    condition: s => s.totalXp >= 10000,
  },

  // ── Focus Time ───────────────────────────────────────────────
  {
    id:        'FOCUS_1H',
    title:     'İlk Saat',
    desc:      '1 saat toplam odak süresi',
    icon:      '⏱️',
    xpReward:  50,
    rarity:    'common',
    category:  'focus',
    condition: s => s.totalFocusMinutes >= 60,
  },
  {
    id:        'FOCUS_5H',
    title:     'Derin Odak',
    desc:      '5 saat toplam odak süresi',
    icon:      '🧠',
    xpReward:  200,
    rarity:    'uncommon',
    category:  'focus',
    condition: s => s.totalFocusMinutes >= 300,
  },
  {
    id:        'FOCUS_25H',
    title:     'Odak Şampiyonu',
    desc:      '25 saat toplam odak süresi',
    icon:      '🎓',
    xpReward:  500,
    rarity:    'rare',
    category:  'focus',
    condition: s => s.totalFocusMinutes >= 1500,
  },
  {
    id:        'FOCUS_100H',
    title:     'Odak Efsanesi',
    desc:      '100 saat toplam odak süresi',
    icon:      '🚀',
    xpReward:  2000,
    rarity:    'legendary',
    category:  'focus',
    condition: s => s.totalFocusMinutes >= 6000,
  },

  // ── Special ──────────────────────────────────────────────────
  {
    id:        'EARLY_BIRD',
    title:     'Erken Kuş',
    desc:      'Sabah 9:00\'dan önce bir Pomodoro tamamla',
    icon:      '🌅',
    xpReward:  100,
    rarity:    'uncommon',
    category:  'special',
    condition: s => s.pomodoroHour !== null && s.pomodoroHour < 9,
  },
  {
    id:        'NIGHT_OWL',
    title:     'Gece Baykuşu',
    desc:      'Gece 22:00\'dan sonra bir Pomodoro tamamla',
    icon:      '🦉',
    xpReward:  100,
    rarity:    'uncommon',
    category:  'special',
    condition: s => s.pomodoroHour !== null && s.pomodoroHour >= 22,
  },
  {
    id:        'LEVEL_5',
    title:     'Yükselen Yıldız',
    desc:      'Seviye 5\'e ulaş',
    icon:      '⭐',
    xpReward:  200,
    rarity:    'uncommon',
    category:  'xp',
    condition: s => s.level >= 5,
  },
  {
    id:        'LEVEL_10',
    title:     'Ders Ustası',
    desc:      'Seviye 10\'a ulaş',
    icon:      '🌠',
    xpReward:  500,
    rarity:    'rare',
    category:  'xp',
    condition: s => s.level >= 10,
  },
]

// ── Quick lookup by ID ─────────────────────────────────────────
export const ACHIEVEMENT_MAP = new Map(
  ACHIEVEMENTS.map(a => [a.id, a])
)

// ── Rarity config ──────────────────────────────────────────────
export const RARITY_CONFIG: Record<string, {
  label: string
  color: string
  glow:  string
  bg:    string
  border: string
}> = {
  common: {
    label:  'Yaygın',
    color:  'text-gray-400',
    glow:   'rgba(156,163,175,0.3)',
    bg:     'bg-gray-500/10',
    border: 'border-gray-500/20',
  },
  uncommon: {
    label:  'Nadir',
    color:  'text-emerald-400',
    glow:   'rgba(52,211,153,0.4)',
    bg:     'bg-emerald-500/10',
    border: 'border-emerald-500/25',
  },
  rare: {
    label:  'Efsanevi Nadir',
    color:  'text-indigo-400',
    glow:   'rgba(99,102,241,0.5)',
    bg:     'bg-indigo-500/10',
    border: 'border-indigo-500/30',
  },
  legendary: {
    label:  'Efsane',
    color:  'text-amber-400',
    glow:   'rgba(251,191,36,0.6)',
    bg:     'bg-amber-500/10',
    border: 'border-amber-500/35',
  },
}
