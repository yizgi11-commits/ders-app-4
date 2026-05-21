import { Zap, TrendingUp, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { xpProgress } from '@/lib/tasks/xp'
import { DIFFICULTY_LABEL, type Difficulty, type UserXP } from '@/lib/tasks/types'
import { XPProgressBar } from './XPProgressBar'

function levelTitle(level: number): string {
  if (level < 3)  return 'Yeni Başlayan'
  if (level < 6)  return 'Çalışkan Öğrenci'
  if (level < 10) return 'Azimli Öğrenci'
  if (level < 15) return 'Ders Ustası'
  return 'Efsane Öğrenci'
}

export default async function XPCard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let xpData: UserXP = {
    user_id: '',
    total_xp: 0,
    level: 1,
    current_difficulty: 1,
    last_active_date: null,
    updated_at: new Date().toISOString(),
  }
  let todayXp = 0

  if (user) {
    const { data } = await supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle<UserXP>()

    if (data) xpData = data

    const today = new Date().toISOString().split('T')[0]
    const { data: todayTasks } = await supabase
      .from('daily_tasks')
      .select('xp_earned')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('completed', true)

    todayXp = (todayTasks ?? []).reduce(
      (sum: number, t: { xp_earned: number }) => sum + t.xp_earned, 0
    )
  }

  const { current, required } = xpProgress(xpData.total_xp)
  const yuzde   = Math.round((current / required) * 100)
  const kalanXP = required - current

  return (
    <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 rounded-2xl p-5 text-white flex flex-col gap-4 shadow-lg shadow-indigo-200/50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-yellow-300" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-white/60 uppercase tracking-wide">Deneyim Puanı</p>
            <p className="text-sm font-bold leading-tight">XP Seviyesi</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tabular-nums">{xpData.total_xp.toLocaleString('tr')}</p>
          <p className="text-[11px] text-white/50">toplam XP</p>
        </div>
      </div>

      {/* Level badge */}
      <div className="flex items-center gap-3 bg-white/[0.12] backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
        <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-yellow-900/30">
          <Star className="w-5 h-5 text-yellow-900" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">Seviye {xpData.level}</p>
          <p className="text-xs text-white/55">{levelTitle(xpData.level)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/50">Sonraki seviye</p>
          <p className="text-sm font-bold text-yellow-300">+{kalanXP.toLocaleString('tr')} XP</p>
        </div>
      </div>

      {/* Animated progress bar (client) */}
      <XPProgressBar
        pct={yuzde}
        current={current}
        required={required}
        level={xpData.level}
      />

      {/* Today XP + difficulty */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 text-xs text-white/70 bg-white/[0.1] rounded-xl px-3 py-2.5 border border-white/10">
          <TrendingUp className="w-3.5 h-3.5 text-green-300 shrink-0" />
          {todayXp > 0 ? (
            <span>Bugün <strong className="text-green-300">+{todayXp} XP</strong> 🎉</span>
          ) : (
            <span className="text-white/40">Bugün henüz XP yok</span>
          )}
        </div>
        <div className="flex items-center justify-center bg-white/[0.1] rounded-xl px-3 py-2 text-xs font-semibold border border-white/10">
          {DIFFICULTY_LABEL[xpData.current_difficulty as Difficulty]}
        </div>
      </div>
    </div>
  )
}
