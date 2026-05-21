import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserAchievement } from '@/lib/gamification/types'
import AchievementsGrid from '@/components/gamification/AchievementsGrid'
import DailyGoals from '@/components/gamification/DailyGoals'
import { ACHIEVEMENT_MAP, RARITY_CONFIG } from '@/lib/gamification/achievements'
import type { UserXP } from '@/lib/tasks/types'
import { xpProgress } from '@/lib/tasks/xp'
import { Trophy, Zap } from 'lucide-react'
import BasarimlarHeader from '@/components/gamification/BasarimlarHeader'

export const revalidate = 60

export default async function BasarimlarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const today = new Date().toISOString().split('T')[0]

  const [
    achievementsRes,
    xpRes,
    focusRes,
    pomodoroRes,
    tasksRes,
    goalsRes,
  ] = await Promise.all([
    supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false }),
    supabase.from('user_xp').select('*').eq('user_id', user.id).maybeSingle<UserXP>(),
    supabase.from('daily_focus_time').select('focus_minutes').eq('user_id', user.id).eq('date', today).maybeSingle(),
    supabase.from('pomodoro_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('date', today).eq('type', 'focus').eq('status', 'completed'),
    supabase.from('daily_tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('date', today).eq('completed', true),
    supabase.from('daily_goals').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
  ])

  const userAchievements = (achievementsRes.data ?? []) as UserAchievement[]
  const xpData = xpRes.data

  const goals = {
    focus_minutes_goal: goalsRes.data?.focus_minutes_goal ?? 60,
    pomodoro_goal:       goalsRes.data?.pomodoro_goal      ?? 4,
    tasks_goal:          goalsRes.data?.tasks_goal         ?? 3,
  }
  const progress = {
    focusMinutes:  focusRes.data?.focus_minutes ?? 0,
    pomodorosDone: pomodoroRes.count ?? 0,
    tasksDone:     tasksRes.count ?? 0,
  }

  const { current, required } = xpData ? xpProgress(xpData.total_xp) : { current: 0, required: 500 }
  const pct = Math.round((current / required) * 100)

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Page header */}
      <BasarimlarHeader
        level={xpData?.level ?? 1}
        totalXp={xpData?.total_xp ?? 0}
        current={current}
        required={required}
        pct={pct}
        unlockedCount={userAchievements.length}
      />

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Achievements grid */}
        <div className="lg:col-span-2">
          <AchievementsGrid userAchievements={userAchievements} />
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          <DailyGoals initialGoals={goals} progress={progress} />

          {/* Recent achievements */}
          {userAchievements.length > 0 && (
            <div className="bg-gradient-to-br from-gray-950 to-gray-900 border border-white/[0.07] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-bold text-white">Son Başarımlar</h3>
              </div>
              <div className="flex flex-col gap-3">
                {userAchievements.slice(0, 5).map(ua => {
                  const def  = ACHIEVEMENT_MAP.get(ua.achievement_id)
                  if (!def) return null
                  const cfg  = RARITY_CONFIG[def.rarity]
                  const date = new Date(ua.unlocked_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
                  return (
                    <div key={ua.id} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border ${cfg.bg} ${cfg.border} shrink-0`}>
                        {def.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white/80 truncate">{def.title}</p>
                        <p className="text-[10px] text-white/30">{date}</p>
                      </div>
                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${cfg.color}`}>
                        <Zap className="w-2.5 h-2.5" />+{def.xpReward}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
