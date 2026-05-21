import type { UserStatsForAI, DailyCoachData, Insight } from './types'

// ─────────────────────────────────────────────────────────────────
// SMART INSIGHTS ENGINE — Rule-based "AI-like" daily insights
// No API calls, just clever pattern detection on user data
// ─────────────────────────────────────────────────────────────────

export function generateSmartInsights(stats: UserStatsForAI): DailyCoachData {
  const insights: Insight[] = []
  const hour = new Date().getHours()

  // ── 1. Streak Analysis ──────────────────────────────────────────
  if (stats.currentStreak >= 7) {
    insights.push({
      type: 'positive',
      icon: '🔥',
      text: `${stats.currentStreak} günlük seri muhteşem! Bu disiplin seni akranlarının önüne geçiriyor.`,
      metric: `${stats.currentStreak} gün`,
    })
  } else if (stats.currentStreak >= 3) {
    insights.push({
      type: 'positive',
      icon: '🔥',
      text: `${stats.currentStreak} günlük serin güçleniyor. 7 güne ulaşırsan ekstra başarım kazanırsın!`,
      metric: `${stats.currentStreak} gün`,
    })
  } else if (stats.currentStreak === 0 && stats.longestStreak > 0) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      text: `Serin kopmuş! En uzun rekorun ${stats.longestStreak} gündü. Bugün yeniden başla.`,
      metric: `Rekor: ${stats.longestStreak}`,
    })
  }

  // ── 2. Focus Trend (Week-over-Week) ─────────────────────────────
  if (stats.prevWeekFocusMinutes > 0) {
    const change = Math.round(stats.focusTrend)
    if (change >= 20) {
      insights.push({
        type: 'positive',
        icon: '📈',
        text: `Odak süren geçen haftaya göre %${change} arttı! Yükseliş trendini koru.`,
        metric: `+%${change}`,
      })
    } else if (change <= -20) {
      insights.push({
        type: 'warning',
        icon: '📉',
        text: `Bu hafta odak süren %${Math.abs(change)} düştü. Kısa bir pomodoro seansı deneyebilirsin.`,
        metric: `-%${Math.abs(change)}`,
      })
    } else {
      insights.push({
        type: 'neutral',
        icon: '📊',
        text: `Odak süren geçen haftayla benzer seviyede. Stabilite de bir başarıdır!`,
        metric: `${stats.weekFocusMinutes} dk`,
      })
    }
  }

  // ── 3. Peak Hours Intelligence ──────────────────────────────────
  if (stats.peakHours.length >= 2) {
    const peakStr = stats.peakHours.map(h => `${h}:00`).join('-')
    const isCurrentPeak = stats.peakHours.some(h => Math.abs(h - hour) <= 1)

    if (isCurrentPeak) {
      insights.push({
        type: 'tip',
        icon: '⚡',
        text: `Şu an zirve verimlilik saatindesin! Verilerine göre ${peakStr} arası en iyi çalıştığın zaman.`,
        metric: peakStr,
      })
    } else {
      insights.push({
        type: 'tip',
        icon: '🕐',
        text: `Verilerin gösteriyor ki en verimli saatlerin ${peakStr} arası. Bu saatleri kaçırma!`,
        metric: peakStr,
      })
    }
  }

  // ── 4. Task Completion Rate ─────────────────────────────────────
  if (stats.taskCompletionRate >= 90) {
    insights.push({
      type: 'positive',
      icon: '✅',
      text: 'Görev tamamlama oranın %90 üzerinde, müthiş bir disiplin!',
      metric: `%${stats.taskCompletionRate}`,
    })
  } else if (stats.taskCompletionRate >= 60) {
    insights.push({
      type: 'neutral',
      icon: '📋',
      text: `Görevlerin %${stats.taskCompletionRate} oranında tamamlanıyor. %80 üstüne çıkmayı dene!`,
      metric: `%${stats.taskCompletionRate}`,
    })
  } else if (stats.weekTasksDone > 0) {
    insights.push({
      type: 'warning',
      icon: '🎯',
      text: 'Görev tamamlama oranın düşük. Daha az ama gerçekçi hedefler koy.',
      metric: `%${stats.taskCompletionRate}`,
    })
  }

  // ── 5. Subject Distribution ─────────────────────────────────────
  if (stats.subjectStats.length >= 2) {
    const top = stats.subjectStats[0]
    const bottom = stats.subjectStats[stats.subjectStats.length - 1]
    if (top.tasksCompleted > bottom.tasksCompleted * 3) {
      insights.push({
        type: 'warning',
        icon: '⚖️',
        text: `${top.subject} dersine çok yoğunlaşmışsın. ${bottom.subject} dersini ihmal etmemeye dikkat et.`,
      })
    }
  }

  // ── 6. Today's Focus Check ──────────────────────────────────────
  if (stats.todayFocusMinutes === 0 && hour >= 14) {
    insights.push({
      type: 'tip',
      icon: '💡',
      text: 'Bugün henüz çalışma başlatmamışsın. 25 dakikalık bir seansla başlamak yeterli!',
    })
  } else if (stats.todayFocusMinutes >= 120) {
    insights.push({
      type: 'positive',
      icon: '🏆',
      text: `Bugün ${stats.todayFocusMinutes} dakika çalıştın. Harika bir gün geçiriyorsun!`,
      metric: `${stats.todayFocusMinutes} dk`,
    })
  }

  // ── 7. Level Progress ───────────────────────────────────────────
  const xpForNext = stats.level * 100
  const progress = stats.totalXp % xpForNext
  const remaining = xpForNext - progress
  if (remaining <= 50 && remaining > 0) {
    insights.push({
      type: 'tip',
      icon: '🌟',
      text: `Sonraki seviyeye sadece ${remaining} XP kaldı! Birkaç görev daha seni levele çıkarır.`,
      metric: `${remaining} XP`,
    })
  }

  // ── Build Greeting ──────────────────────────────────────────────
  const greeting = buildGreeting(stats, hour)
  const motivation = pickMotivation(stats)

  return {
    insights: insights.slice(0, 5), // Max 5
    motivation,
    greeting,
    generated_at: new Date().toISOString(),
  }
}

// ── Smart Greeting based on context ────────────────────────────
function buildGreeting(stats: UserStatsForAI, hour: number): string {
  if (stats.currentStreak >= 7) return 'Seri makinesi! Durdurulamıyorsun 💪'
  if (stats.todayFocusMinutes >= 60) return 'Bugün harika gidiyorsun!'
  if (stats.focusTrend >= 20) return 'Yükseliş trendinde! Devam et 🚀'
  if (stats.focusTrend <= -30) return 'Biraz mola verdin, ama geri dönebilirsin!'

  if (hour < 12) return 'Günaydın! Erken başlamak en iyisi ☀️'
  if (hour < 17) return 'İyi öğlenler! Verimli bir gün olsun'
  if (hour < 21) return 'İyi akşamlar! Son sprint zamanı'
  return 'Gece kuşu modunda mısın? 🦉'
}

// ── Contextual Motivation ──────────────────────────────────────
function pickMotivation(stats: UserStatsForAI): string {
  const pool: string[] = []

  if (stats.currentStreak >= 5) {
    pool.push('Düzenli çalışma zekadan daha güçlüdür. Sen bunu kanıtlıyorsun!')
    pool.push(`${stats.currentStreak} gün üst üste — bu alışkanlık artık senin bir parçan.`)
  }

  if (stats.focusTrend >= 10) {
    pool.push('Geçen haftadan daha iyisin. İlerleme her gün bir adımdır.')
  }

  if (stats.taskCompletionRate >= 80) {
    pool.push('Hedeflerini tutturan biri olarak, başarı senin için sürpriz olmayacak.')
  }

  if (stats.weekFocusMinutes >= 300) {
    pool.push('Bu hafta 5 saatten fazla odaklandın. Bu ciddi bir yatırım!')
  }

  // Default pool
  pool.push(
    'Bugün attığın her adım, yarının başarısını inşa ediyor.',
    'Küçük adımlar büyük sonuçlar yaratır. Devam et!',
    'En zor kısım başlamaktır. Başladığına göre devam et!',
    'Disiplin motivasyon bittiğinde devreye girer. Sen disiplinlisin.',
    'Her ders, geleceğine yapılan bir yatırımdır.',
  )

  // Deterministic pick based on day (so it doesn't change on refresh)
  const dayIndex = new Date().getDate()
  return pool[dayIndex % pool.length]
}
