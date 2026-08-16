import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import { xpProgress } from '@/lib/tasks/xp'
import { levelTitle } from '@/lib/gamification/level-titles'
import { STUDY_GOALS, GRADE_LEVELS } from '@/lib/onboarding/types'

export interface ProfileData {
  displayName: string
  email:       string
  gradeLabel:  string | null
  goal:        { emoji: string; label: string } | null

  level:      number
  levelTitle: string
  totalXp:    number
  xpCurrent:  number
  xpRequired: number
  xpPct:      number

  currentStreak:     number
  longestStreak:     number
  totalFocusMinutes: number

  totalTopicsStudied:  number
  totalRecallCards:    number
  totalTasksCompleted: number
  memberSince:         string

  unlockedAchievementIds: string[]
}

export async function getProfileData(supabase: SupabaseClient, user: User): Promise<ProfileData> {
  const [
    profileRes, xpRes, streakRes, statsRes,
    topicSessionsRes, recallCountRes, tasksCountRes, achievementsRes,
  ] = await Promise.all([
    supabase.from('user_profiles').select('display_name, study_goal, grade_level').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_xp').select('total_xp, level').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_streaks').select('current_streak, longest_streak').eq('user_id', user.id).maybeSingle(),
    supabase.from('study_statistics').select('total_focus_minutes').eq('user_id', user.id).maybeSingle(),
    supabase.from('pomodoro_sessions').select('topic_id').eq('user_id', user.id).eq('status', 'completed').not('topic_id', 'is', null),
    supabase.from('recall_reviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('daily_tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true),
    supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id),
  ])

  const profile = profileRes.data
  const totalXp = xpRes.data?.total_xp ?? 0
  const level   = xpRes.data?.level ?? 1
  const { current: xpCurrent, required: xpRequired } = xpProgress(totalXp)

  const displayName = profile?.display_name || user.user_metadata?.ad || user.email?.split('@')[0] || 'Öğrenci'
  const gradeLabel  = profile?.grade_level
    ? GRADE_LEVELS.find(g => g.value === profile.grade_level)?.label ?? profile.grade_level
    : null
  const goalMatch = profile?.study_goal ? STUDY_GOALS.find(g => g.value === profile.study_goal) : null
  const goal = goalMatch ? { emoji: goalMatch.emoji, label: goalMatch.label } : null

  const topicIds = new Set(
    ((topicSessionsRes.data ?? []) as { topic_id: string }[]).map(r => r.topic_id)
  )

  return {
    displayName,
    email: user.email ?? '',
    gradeLabel,
    goal,

    level,
    levelTitle: levelTitle(level),
    totalXp,
    xpCurrent,
    xpRequired,
    xpPct: xpRequired > 0 ? Math.round((xpCurrent / xpRequired) * 100) : 0,

    currentStreak:     streakRes.data?.current_streak ?? 0,
    longestStreak:      streakRes.data?.longest_streak ?? 0,
    totalFocusMinutes: statsRes.data?.total_focus_minutes ?? 0,

    totalTopicsStudied:  topicIds.size,
    totalRecallCards:    recallCountRes.count ?? 0,
    totalTasksCompleted: tasksCountRes.count ?? 0,
    memberSince:         user.created_at,

    unlockedAchievementIds: ((achievementsRes.data ?? []) as { achievement_id: string }[]).map(a => a.achievement_id),
  }
}
