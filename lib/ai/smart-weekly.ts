import type { UserStatsForAI, WeeklyReport } from './types'

// ─────────────────────────────────────────────────────────────────
// SMART WEEKLY REPORT — Template + data-driven weekly analysis
// Combines pre-written patterns with actual user metrics
// ─────────────────────────────────────────────────────────────────

export function generateSmartWeeklyReport(stats: UserStatsForAI): WeeklyReport {
  const trend = detectTrend(stats)
  const summary = buildSummary(stats, trend)
  const highlights = buildHighlights(stats)
  const concerns = buildConcerns(stats)
  const streakAnalysis = buildStreakAnalysis(stats)
  const nextWeekFocus = buildNextWeekFocus(stats, trend)
  const recommendations = buildRecommendations(stats, trend)

  // Subject analysis
  const strongest = stats.subjectStats.length > 0
    ? stats.subjectStats[0].subject
    : null
  const weakest = stats.subjectStats.length >= 2
    ? stats.subjectStats[stats.subjectStats.length - 1].subject
    : null

  return {
    summary,
    productivity_trend: trend,
    highlights,
    concerns,
    strongest_subject: strongest,
    weakest_subject: weakest,
    streak_analysis: streakAnalysis,
    next_week_focus: nextWeekFocus,
    recommendations,
    generated_at: new Date().toISOString(),
  }
}

// ── Trend Detection ─────────────────────────────────────────────
function detectTrend(stats: UserStatsForAI): 'improving' | 'stable' | 'declining' {
  let score = 0

  // Focus change
  if (stats.focusTrend >= 15) score += 2
  else if (stats.focusTrend >= 5) score += 1
  else if (stats.focusTrend <= -15) score -= 2
  else if (stats.focusTrend <= -5) score -= 1

  // Session change
  if (stats.prevWeekSessions > 0) {
    const sessionChange = ((stats.weekSessions - stats.prevWeekSessions) / stats.prevWeekSessions) * 100
    if (sessionChange >= 20) score += 1
    else if (sessionChange <= -20) score -= 1
  }

  // Streak
  if (stats.currentStreak >= 5) score += 1
  else if (stats.currentStreak === 0 && stats.longestStreak > 3) score -= 1

  if (score >= 2) return 'improving'
  if (score <= -2) return 'declining'
  return 'stable'
}

// ── Summary Builder ─────────────────────────────────────────────
function buildSummary(stats: UserStatsForAI, trend: string): string {
  const focusPart = stats.weekFocusMinutes > 0
    ? `Bu hafta toplam ${stats.weekFocusMinutes} dakika odaklanarak ${stats.weekSessions} oturum tamamladın.`
    : 'Bu hafta henüz aktif çalışma kaydedilmedi.'

  const trendPart =
    trend === 'improving'
      ? 'Geçen haftaya göre belirgin bir yükseliş trendinde olduğun görülüyor.'
      : trend === 'declining'
        ? 'Geçen haftaya kıyasla performansta bir düşüş gözlemleniyor.'
        : 'Performansın geçen haftayla benzer seviyede, stabil bir seyir izliyor.'

  const taskPart = stats.weekTasksDone > 0
    ? `Görev tamamlama oranın %${stats.taskCompletionRate}.`
    : ''

  return [focusPart, trendPart, taskPart].filter(Boolean).join(' ')
}

// ── Highlights Builder ──────────────────────────────────────────
function buildHighlights(stats: UserStatsForAI): string[] {
  const highlights: string[] = []

  if (stats.currentStreak >= 3) {
    highlights.push(`${stats.currentStreak} günlük çalışma serisi devam ediyor`)
  }

  if (stats.focusTrend >= 10) {
    highlights.push(`Odak süresi geçen haftaya göre %${Math.round(stats.focusTrend)} arttı`)
  }

  if (stats.taskCompletionRate >= 80) {
    highlights.push(`Görev tamamlama oranı %${stats.taskCompletionRate} — hedeflere sadık kalınmış`)
  }

  if (stats.weekFocusMinutes >= 300) {
    highlights.push(`Bu hafta ${Math.round(stats.weekFocusMinutes / 60)} saatten fazla çalışıldı`)
  }

  if (stats.weekSessions >= 10) {
    highlights.push(`${stats.weekSessions} pomodoro oturumu tamamlandı`)
  }

  if (stats.subjectStats.length >= 2) {
    highlights.push(`${stats.subjectStats.length} farklı derste aktif çalışma yapıldı`)
  }

  if (stats.peakHours.length >= 2) {
    highlights.push(`Düzenli çalışma saatleri oluşmuş (${stats.peakHours.map(h => h + ':00').join(', ')})`)
  }

  // Return top 3
  return highlights.slice(0, 3)
}

// ── Concerns Builder ────────────────────────────────────────────
function buildConcerns(stats: UserStatsForAI): string[] {
  const concerns: string[] = []

  if (stats.currentStreak === 0 && stats.longestStreak > 0) {
    concerns.push('Çalışma serisi kopmuş — tekrar düzenli ritme dönülmeli')
  }

  if (stats.focusTrend <= -20) {
    concerns.push(`Odak süresi geçen haftaya göre %${Math.abs(Math.round(stats.focusTrend))} düşmüş`)
  }

  if (stats.taskCompletionRate < 50 && stats.weekTasksDone > 0) {
    concerns.push('Görev tamamlama oranı düşük — hedefler daha gerçekçi ayarlanabilir')
  }

  if (stats.avgDailyFocus < 30 && stats.weekFocusMinutes > 0) {
    concerns.push('Günlük ortalama odak süresi 30 dakikanın altında')
  }

  if (stats.subjectStats.length >= 2) {
    const top = stats.subjectStats[0]
    const bottom = stats.subjectStats[stats.subjectStats.length - 1]
    if (top.tasksCompleted > bottom.tasksCompleted * 4) {
      concerns.push(`${bottom.subject} dersine yeterli zaman ayrılmamış`)
    }
  }

  return concerns.slice(0, 2)
}

// ── Streak Analysis ─────────────────────────────────────────────
function buildStreakAnalysis(stats: UserStatsForAI): string {
  if (stats.currentStreak >= 14) {
    return `${stats.currentStreak} günlük serin çalışma alışkanlığının artık bir yaşam biçimi olduğunu gösteriyor. Harika!`
  }
  if (stats.currentStreak >= 7) {
    return `${stats.currentStreak} günlük seri güçlü bir düzen oluşturduğunu gösteriyor. 2 haftayı hedefle!`
  }
  if (stats.currentStreak >= 3) {
    return `${stats.currentStreak} günlük seri iyi bir başlangıç. Hedef 7 güne ulaşmak olmalı.`
  }
  if (stats.currentStreak > 0) {
    return `${stats.currentStreak} günlük serinle yeniden başlamışsın. Her gün küçük de olsa bir çalışma yap.`
  }
  if (stats.longestStreak > 0) {
    return `Aktif seri yok ama daha önce ${stats.longestStreak} günlük rekorun var. O seviyeye geri dönebilirsin!`
  }
  return 'Henüz düzenli bir çalışma serisi oluşmamış. Günde 15 dakikayla başlamak yeterli.'
}

// ── Next Week Focus ─────────────────────────────────────────────
function buildNextWeekFocus(stats: UserStatsForAI, trend: string): string {
  if (trend === 'declining' && stats.currentStreak === 0) {
    return 'Gelecek hafta odak: her gün en az 1 pomodoro oturumu yaparak seriyi yeniden başlat.'
  }

  if (stats.subjectStats.length >= 2) {
    const weakest = stats.subjectStats[stats.subjectStats.length - 1]
    return `Gelecek hafta ${weakest.subject} dersine ekstra zaman ayır — dengeyi sağla.`
  }

  if (stats.taskCompletionRate < 60) {
    return 'Gelecek hafta günlük görev sayısını azalt ama tamamlama oranını %80 üzerine çıkar.'
  }

  if (stats.avgDailyFocus < 45) {
    return 'Gelecek hafta günlük odak süresini 15 dakika artırmayı hedefle.'
  }

  return 'Gelecek hafta mevcut temponu koru ve bir üst seviye hedefi belirle.'
}

// ── Recommendations Builder ─────────────────────────────────────
function buildRecommendations(stats: UserStatsForAI, trend: string): string[] {
  const recs: string[] = []

  // Time-based
  if (stats.peakHours.length >= 2) {
    recs.push(`En verimli saatlerin ${stats.peakHours.map(h => h + ':00').join('-')} arası — zor konuları bu saatlere planla.`)
  }

  // Focus-based
  if (stats.avgDailyFocus >= 90) {
    recs.push('Uzun çalışma bloklarının arasına aktif mola (yürüyüş, streç) ekle.')
  } else if (stats.avgDailyFocus < 30) {
    recs.push('Kısa pomodoro seansları (15-20 dk) ile başla, kademeli olarak artır.')
  }

  // Subject-based
  if (stats.subjectStats.length >= 3) {
    recs.push('Haftada en az 3 farklı derste çalışarak ders dengesini koru.')
  }

  // Streak-based
  if (stats.currentStreak >= 5) {
    recs.push('Serini korumak için hafta sonları da kısa bir oturum yap.')
  } else {
    recs.push('Her gün aynı saatte çalışma alışkanlığı oluştur — tutarlılık başarıyı getirir.')
  }

  // General
  if (trend === 'improving') {
    recs.push('Trendin yükselişte! Bir sonraki hedef olarak günlük süreyi %10 artır.')
  } else if (trend === 'declining') {
    recs.push('Performans düşüşü normal olabilir. Aşırı yüklenme yerine kaliteli kısa seanslar tercih et.')
  }

  return recs.slice(0, 3)
}
