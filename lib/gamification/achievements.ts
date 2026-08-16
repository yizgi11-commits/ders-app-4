import type { Achievement } from './types'

// ─────────────────────────────────────────────────────────────────
// Milestone definitions — surfaced on the Journey page.
//
// The `id` values are the primary key in user_achievements, so they
// are deliberately unchanged from the pre-Noetic naming: renaming a
// title is cosmetic, renaming an id would orphan everything already
// unlocked. The old "Pomodoro" category folded into "focus".
// ─────────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  // ── Focus sessions ───────────────────────────────────────────
  {
    id:        'FIRST_POMODORO',
    title:     'First Focus',
    desc:      'İlk Focus oturumunu tamamla',
    icon:      '🎯',
    xpReward:  50,
    rarity:    'common',
    category:  'focus',
    condition: s => s.totalSessionsCompleted >= 1,
  },
  {
    id:        'POMODORO_10',
    title:     '10 Focus Sessions',
    desc:      '10 Focus oturumu tamamla',
    icon:      '⚡',
    xpReward:  150,
    rarity:    'uncommon',
    category:  'focus',
    condition: s => s.totalSessionsCompleted >= 10,
  },
  {
    id:        'POMODORO_50',
    title:     '50 Focus Sessions',
    desc:      '50 Focus oturumu tamamla',
    icon:      '🏆',
    xpReward:  400,
    rarity:    'rare',
    category:  'focus',
    condition: s => s.totalSessionsCompleted >= 50,
  },
  {
    id:        'POMODORO_200',
    title:     '200 Focus Sessions',
    desc:      '200 Focus oturumu tamamla',
    icon:      '💎',
    xpReward:  1000,
    rarity:    'legendary',
    category:  'focus',
    condition: s => s.totalSessionsCompleted >= 200,
  },
  {
    id:        'DEEP_FOCUS_60',
    title:     '60 Min Single Session',
    desc:      'Tek oturumda 60 dakika odaklan',
    icon:      '🧘',
    xpReward:  250,
    rarity:    'rare',
    category:  'focus',
    condition: s => s.longestSessionMinutes >= 60,
  },

  // ── Total focus time ─────────────────────────────────────────
  {
    id:        'FOCUS_1H',
    title:     '1 Hour Focus',
    desc:      'Toplam 1 saat odak süresi',
    icon:      '⏱️',
    xpReward:  50,
    rarity:    'common',
    category:  'focus',
    condition: s => s.totalFocusMinutes >= 60,
  },
  {
    id:        'FOCUS_5H',
    title:     '5 Hours Focus',
    desc:      'Toplam 5 saat odak süresi',
    icon:      '🧠',
    xpReward:  200,
    rarity:    'uncommon',
    category:  'focus',
    condition: s => s.totalFocusMinutes >= 300,
  },
  {
    id:        'FOCUS_25H',
    title:     '25 Hours Focus',
    desc:      'Toplam 25 saat odak süresi',
    icon:      '🎓',
    xpReward:  500,
    rarity:    'rare',
    category:  'focus',
    condition: s => s.totalFocusMinutes >= 1500,
  },
  {
    id:        'FOCUS_100H',
    title:     '100 Hours Focus',
    desc:      'Toplam 100 saat odak süresi',
    icon:      '🚀',
    xpReward:  2000,
    rarity:    'legendary',
    category:  'focus',
    condition: s => s.totalFocusMinutes >= 6000,
  },

  // ── Streak ───────────────────────────────────────────────────
  {
    id:        'STREAK_3',
    title:     '3 Day Streak',
    desc:      '3 gün üst üste çalış',
    icon:      '🔥',
    xpReward:  75,
    rarity:    'common',
    category:  'streak',
    condition: s => s.currentStreak >= 3,
  },
  {
    id:        'STREAK_7',
    title:     '7 Day Streak',
    desc:      '7 gün üst üste çalış',
    icon:      '🌟',
    xpReward:  200,
    rarity:    'uncommon',
    category:  'streak',
    condition: s => s.currentStreak >= 7,
  },
  {
    id:        'STREAK_30',
    title:     '30 Day Streak',
    desc:      '30 gün üst üste çalış',
    icon:      '👑',
    xpReward:  750,
    rarity:    'rare',
    category:  'streak',
    condition: s => s.currentStreak >= 30,
  },
  {
    id:        'STREAK_100',
    title:     '100 Day Streak',
    desc:      '100 gün üst üste çalış',
    icon:      '⚜️',
    xpReward:  2000,
    rarity:    'legendary',
    category:  'streak',
    condition: s => s.currentStreak >= 100,
  },

  // ── Recall ───────────────────────────────────────────────────
  {
    id:        'FIRST_RECALL',
    title:     'First Recall',
    desc:      'İlk tekrar kartını değerlendir',
    icon:      '🔁',
    xpReward:  50,
    rarity:    'common',
    category:  'recall',
    condition: s => s.totalRecalls >= 1,
  },
  {
    id:        'RECALL_10',
    title:     '10 Recalls',
    desc:      '10 tekrar kartı değerlendir',
    icon:      '🧩',
    xpReward:  150,
    rarity:    'uncommon',
    category:  'recall',
    condition: s => s.totalRecalls >= 10,
  },
  {
    id:        'RECALL_100',
    title:     '100 Recalls',
    desc:      '100 tekrar kartı değerlendir',
    icon:      '🎴',
    xpReward:  500,
    rarity:    'rare',
    category:  'recall',
    condition: s => s.totalRecalls >= 100,
  },

  // ── Planner ──────────────────────────────────────────────────
  {
    id:        'PLANNER_5_DAYS',
    title:     '5 Day Planner',
    desc:      '5 farklı günde Planner görevi oluştur',
    icon:      '🗓️',
    xpReward:  150,
    rarity:    'uncommon',
    category:  'planner',
    condition: s => s.plannerDaysUsed >= 5,
  },

  // ── Tasks ────────────────────────────────────────────────────
  {
    id:        'FIRST_TASK',
    title:     'First Task',
    desc:      'İlk günlük görevini tamamla',
    icon:      '✅',
    xpReward:  25,
    rarity:    'common',
    category:  'task',
    condition: s => s.totalTasksCompleted >= 1,
  },
  {
    id:        'TASK_10',
    title:     '10 Tasks Completed',
    desc:      '10 görev tamamla',
    icon:      '🎖️',
    xpReward:  100,
    rarity:    'common',
    category:  'task',
    condition: s => s.totalTasksCompleted >= 10,
  },
  {
    id:        'TASK_50',
    title:     '50 Tasks Completed',
    desc:      '50 görev tamamla',
    icon:      '📚',
    xpReward:  300,
    rarity:    'uncommon',
    category:  'task',
    condition: s => s.totalTasksCompleted >= 50,
  },
  {
    id:        'TASK_200',
    title:     '200 Tasks Completed',
    desc:      '200 görev tamamla',
    icon:      '🦾',
    xpReward:  1000,
    rarity:    'legendary',
    category:  'task',
    condition: s => s.totalTasksCompleted >= 200,
  },

  // ── XP & level ───────────────────────────────────────────────
  {
    id:        'XP_500',
    title:     '500 XP',
    desc:      '500 XP kazan',
    icon:      '⚡',
    xpReward:  50,
    rarity:    'common',
    category:  'xp',
    condition: s => s.totalXp >= 500,
  },
  {
    id:        'XP_2000',
    title:     '2,000 XP',
    desc:      '2000 XP kazan',
    icon:      '🔋',
    xpReward:  150,
    rarity:    'uncommon',
    category:  'xp',
    condition: s => s.totalXp >= 2000,
  },
  {
    id:        'XP_10000',
    title:     '10,000 XP',
    desc:      '10,000 XP kazan',
    icon:      '💫',
    xpReward:  500,
    rarity:    'rare',
    category:  'xp',
    condition: s => s.totalXp >= 10000,
  },
  {
    id:        'LEVEL_5',
    title:     'Level 5',
    desc:      'Seviye 5\'e ulaş',
    icon:      '⭐',
    xpReward:  200,
    rarity:    'uncommon',
    category:  'xp',
    condition: s => s.level >= 5,
  },
  {
    id:        'LEVEL_10',
    title:     'Level 10',
    desc:      'Seviye 10\'a ulaş',
    icon:      '🌠',
    xpReward:  500,
    rarity:    'rare',
    category:  'xp',
    condition: s => s.level >= 10,
  },

  // ── Special ──────────────────────────────────────────────────
  {
    id:        'EARLY_BIRD',
    title:     'Early Bird',
    desc:      'Sabah 9:00\'dan önce bir Focus oturumu tamamla',
    icon:      '🌅',
    xpReward:  100,
    rarity:    'uncommon',
    category:  'special',
    condition: s => s.pomodoroHour !== null && s.pomodoroHour < 9,
  },
  {
    id:        'NIGHT_OWL',
    title:     'Night Owl',
    desc:      'Gece 22:00\'dan sonra bir Focus oturumu tamamla',
    icon:      '🦉',
    xpReward:  100,
    rarity:    'uncommon',
    category:  'special',
    condition: s => s.pomodoroHour !== null && s.pomodoroHour >= 22,
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
    label:  'Common',
    color:  'text-gray-400',
    glow:   'rgba(156,163,175,0.3)',
    bg:     'bg-gray-500/10',
    border: 'border-gray-500/20',
  },
  uncommon: {
    label:  'Uncommon',
    color:  'text-emerald-400',
    glow:   'rgba(52,211,153,0.4)',
    bg:     'bg-emerald-500/10',
    border: 'border-emerald-500/25',
  },
  rare: {
    label:  'Rare',
    color:  'text-indigo-400',
    glow:   'rgba(99,102,241,0.5)',
    bg:     'bg-indigo-500/10',
    border: 'border-indigo-500/30',
  },
  legendary: {
    label:  'Legendary',
    color:  'text-amber-400',
    glow:   'rgba(251,191,36,0.6)',
    bg:     'bg-amber-500/10',
    border: 'border-amber-500/35',
  },
}
