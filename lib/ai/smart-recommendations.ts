import type { UserStatsForAI, Recommendations } from './types'

// ─────────────────────────────────────────────────────────────────
// SMART RECOMMENDATIONS ENGINE — Pattern-based study coaching
// Analyzes user data patterns to produce personalized advice
// ─────────────────────────────────────────────────────────────────

export function generateSmartRecommendations(stats: UserStatsForAI): Recommendations {
  // ── Difficulty Adjustment ─────────────────────────────────────
  const { adjustment, reason } = calculateDifficulty(stats)

  // ── Optimal Session Duration ──────────────────────────────────
  const optimalMins = calculateOptimalSession(stats)

  // ── Context-Aware Tips ────────────────────────────────────────
  const breakTip = generateBreakTip(stats)
  const focusTip = generateFocusTip(stats)
  const workloadTip = generateWorkloadTip(stats)

  return {
    difficulty_adjustment: adjustment,
    difficulty_reason: reason,
    optimal_session_mins: optimalMins,
    break_tip: breakTip,
    focus_tip: focusTip,
    workload_tip: workloadTip,
    generated_at: new Date().toISOString(),
  }
}

// ── Difficulty Algorithm ────────────────────────────────────────
function calculateDifficulty(stats: UserStatsForAI): {
  adjustment: 'increase' | 'decrease' | 'maintain'
  reason: string
} {
  let score = 0

  // Task completion: high = can handle more
  if (stats.taskCompletionRate >= 85) score += 2
  else if (stats.taskCompletionRate >= 70) score += 1
  else if (stats.taskCompletionRate < 50) score -= 2
  else if (stats.taskCompletionRate < 65) score -= 1

  // Focus trend: improving = can handle more
  if (stats.focusTrend >= 15) score += 1
  else if (stats.focusTrend <= -15) score -= 1

  // Streak: consistency = readiness
  if (stats.currentStreak >= 5) score += 1
  else if (stats.currentStreak === 0) score -= 1

  // Session count: lots of sessions = handling well
  if (stats.weekSessions >= 15) score += 1
  else if (stats.weekSessions <= 3) score -= 1

  if (score >= 3) {
    return {
      adjustment: 'increase',
      reason: `Görev tamamlama oranın %${stats.taskCompletionRate} ve ${stats.currentStreak} günlük serin var — zorluk artırılabilir.`,
    }
  } else if (score <= -2) {
    return {
      adjustment: 'decrease',
      reason: `Bu hafta biraz zorlanmışsın. Daha kısa seanslarla başlayıp ritmi yakala.`,
    }
  }
  return {
    adjustment: 'maintain',
    reason: 'Mevcut temponu koruman dengeli bir ilerleme sağlıyor.',
  }
}

// ── Optimal Session Duration ────────────────────────────────────
function calculateOptimalSession(stats: UserStatsForAI): number {
  // Beginners: shorter sessions
  if (stats.level <= 3 || stats.totalXp < 300) return 25

  // High completion + high focus: can do longer
  if (stats.taskCompletionRate >= 80 && stats.avgDailyFocus >= 90) return 45

  // Good consistency
  if (stats.currentStreak >= 5 && stats.avgDailyFocus >= 60) return 35

  // Struggling: keep short
  if (stats.taskCompletionRate < 50 || stats.avgDailyFocus < 30) return 20

  return 25
}

// ── Break Tips based on patterns ────────────────────────────────
function generateBreakTip(stats: UserStatsForAI): string {
  if (stats.avgDailyFocus >= 120) {
    return 'Uzun süreli çalışıyorsun — her 90 dakikada 15 dakika mola vermen kas ve göz sağlığını korur.'
  }
  if (stats.weekSessions >= 10 && stats.avgDailyFocus >= 60) {
    return 'İyi bir ritmin var. Molalarda kısa yürüyüş yap, beyine oksijen pompalar.'
  }
  if (stats.focusTrend <= -20) {
    return 'Odağın düşmüş — Pomodoro aralarında 5 dakika derin nefes egzersizi dene.'
  }
  return 'Her 25 dakika çalışmanın ardından 5 dakika mola ver. Ekrandan uzaklaş, pencereden dışarı bak.'
}

// ── Focus Tips based on patterns ────────────────────────────────
function generateFocusTip(stats: UserStatsForAI): string {
  const hour = new Date().getHours()

  // Peak hour awareness
  if (stats.peakHours.length >= 2) {
    const peakStr = stats.peakHours.map(h => `${h}:00`).join('-')
    const isNearPeak = stats.peakHours.some(h => Math.abs(h - hour) <= 2)
    if (isNearPeak) {
      return `Zirve performans saatin yaklaşıyor (${peakStr}). En zor konuyu bu saatte çalış.`
    }
    return `En verimli saatlerin ${peakStr} arası. Zor konuları bu zaman dilimine planla.`
  }

  if (stats.todayFocusMinutes === 0) {
    return 'Telefonunu sessize al, masanı temizle ve sadece 10 dakikalık bir odak dene. Başlamak en zor kısım!'
  }

  if (stats.avgDailyFocus >= 90) {
    return 'Derin çalışma yapabiliyorsun. Aktif hatırlama (recall) tekniğiyle öğrenmeyi pekiştir.'
  }

  return 'Çalışırken telefonu başka odaya koy. Araştırmalar dikkat dağınıklığının %40 azaldığını gösteriyor.'
}

// ── Workload Tips based on patterns ─────────────────────────────
function generateWorkloadTip(stats: UserStatsForAI): string {
  if (stats.taskCompletionRate >= 90 && stats.weekTasksDone >= 15) {
    return 'Yüksek performanslısın! Görev sayısını artırabilir veya daha zorlu konulara geçebilirsin.'
  }

  if (stats.taskCompletionRate < 50) {
    return 'Günlük görev sayını 2-3 ile sınırla. Az ama tamamlanmış hedefler motivasyonu artırır.'
  }

  if (stats.subjectStats.length >= 3) {
    const weakest = stats.subjectStats[stats.subjectStats.length - 1]
    return `${weakest.subject} dersinde daha az çalışmışsın. Bu haftaki planına ekstra ${weakest.subject} bloğu ekle.`
  }

  if (stats.weekTasksDone === 0) {
    return 'Bugün tek bir görevi tamamlayarak başla. İlk adım her şeyi değiştirir!'
  }

  return `Haftada ${Math.max(stats.weekTasksDone + 2, 10)} görev hedefi koy. Kademeli artış sürdürülebilir ilerleme sağlar.`
}
