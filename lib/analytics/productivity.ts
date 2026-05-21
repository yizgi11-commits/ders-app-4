import type { ProductivityScore, DailyTaskStat, DailyFocusStat } from './types'

const DAILY_FOCUS_TARGET = 120  // 2 hours/day target
const WEEKLY_XP_TARGET   = 500  // 500 XP/week target

interface ScoreInput {
  currentStreak:  number
  dailyTasks:     DailyTaskStat[]   // last 7 days
  dailyFocus:     DailyFocusStat[]  // last 7 days
  thisWeekXP:     number
  level:          number
}

function clamp(v: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, v))
}

export function computeProductivityScore(input: ScoreInput): ProductivityScore {
  const { currentStreak, dailyTasks, dailyFocus, thisWeekXP } = input

  // 1. Consistency (30%): streak score — 7 days = 100
  const consistency = clamp(Math.round((Math.min(currentStreak, 7) / 7) * 100))

  // 2. Task completion (30%): avg completion rate last 7 days (only days with tasks)
  const daysWithTasks = dailyTasks.filter(d => d.total > 0)
  const task_completion = daysWithTasks.length > 0
    ? clamp(Math.round(
        daysWithTasks.reduce((s, d) => s + d.completion_rate, 0) / daysWithTasks.length
      ))
    : 0

  // 3. Focus time (20%): avg focus minutes vs daily target
  const avgFocus = dailyFocus.reduce((s, d) => s + d.focus_minutes, 0) / 7
  const focus_time = clamp(Math.round((avgFocus / DAILY_FOCUS_TARGET) * 100))

  // 4. XP growth (20%): this week's XP vs weekly target
  const xp_growth = clamp(Math.round((thisWeekXP / WEEKLY_XP_TARGET) * 100))

  // Weighted total
  const total = clamp(Math.round(
    consistency     * 0.30 +
    task_completion * 0.30 +
    focus_time      * 0.20 +
    xp_growth       * 0.20
  ))

  return { total, consistency, task_completion, focus_time, xp_growth }
}

export function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Mükemmel',   color: 'text-green-500'  }
  if (score >= 70) return { label: 'Çok İyi',    color: 'text-indigo-500' }
  if (score >= 55) return { label: 'İyi',         color: 'text-blue-500'   }
  if (score >= 35) return { label: 'Gelişiyor',  color: 'text-amber-500'  }
  return               { label: 'Başlangıç',  color: 'text-gray-400'   }
}
