import type {
  Insight, WeeklyComparison, ProductivityScore,
  PomodoroStat, SubjectStat, DailyTaskStat,
} from './types'

interface InsightInput {
  weeklyComparison:  WeeklyComparison
  currentStreak:     number
  longestStreak:     number
  mostProductiveDay: string | null
  productivityScore: ProductivityScore
  pomodoroStats:     PomodoroStat
  subjectStats:      SubjectStat[]
  dailyTasks:        DailyTaskStat[]  // last 7 days
}

let _id = 0
function insight(
  type: Insight['type'],
  emoji: string,
  title: string,
  description: string
): Insight {
  return { id: String(++_id), type, emoji, title, description }
}

export function generateInsights(input: InsightInput): Insight[] {
  const {
    weeklyComparison: wc,
    currentStreak, longestStreak,
    mostProductiveDay,
    productivityScore: ps,
    pomodoroStats, subjectStats, dailyTasks,
  } = input

  _id = 0
  const list: Insight[] = []

  // ── Study time trends ──────────────────────────────────────────
  if (wc.minutes_change_pct >= 15) {
    list.push(insight('positive', '📈',
      'Çalışma süresi arttı',
      `Bu hafta çalışma süren %${wc.minutes_change_pct} arttı — harika bir ilerleme!`
    ))
  } else if (wc.minutes_change_pct <= -20) {
    list.push(insight('warning', '⏰',
      'Çalışma süresi azaldı',
      `Bu hafta geçen haftaya göre %${Math.abs(wc.minutes_change_pct)} daha az çalıştın.`
    ))
  } else if (wc.this_week_minutes > 0) {
    list.push(insight('neutral', '⏱️',
      'Stabil tempo',
      `Bu hafta ${Math.round(wc.this_week_minutes / 60 * 10) / 10} saat çalıştın.`
    ))
  }

  // ── Task completion trends ──────────────────────────────────────
  if (wc.tasks_change_pct >= 20) {
    list.push(insight('positive', '✅',
      'Görev tamamlama arttı',
      `Bu hafta %${wc.tasks_change_pct} daha fazla görev tamamladın!`
    ))
  } else if (wc.tasks_change_pct <= -20) {
    list.push(insight('warning', '📋',
      'Görev tamamlama düştü',
      `Geçen haftaya kıyasla daha az görev tamamladın.`
    ))
  }

  // ── Streak insights ────────────────────────────────────────────
  if (currentStreak >= 7) {
    list.push(insight('achievement', '🔥',
      `${currentStreak} günlük seri!`,
      currentStreak >= longestStreak
        ? 'Rekor kırdın! Muhteşem bir istikrar yakalıyorsun.'
        : `En uzun serine (${longestStreak} gün) yaklaşıyorsun, devam et!`
    ))
  } else if (currentStreak >= 3) {
    list.push(insight('positive', '🔥',
      `${currentStreak} günlük seri`,
      'İstikrarlı bir çalışma temposu yakaladın.'
    ))
  } else if (currentStreak === 0) {
    list.push(insight('warning', '💡',
      'Seriyi başlat',
      'Bugün çalışarak yeni bir çalışma serisi başlatabilirsin!'
    ))
  }

  // ── Most productive day ────────────────────────────────────────
  if (mostProductiveDay) {
    list.push(insight('neutral', '📅',
      'En verimli günün',
      `Son 30 günde en fazla ${mostProductiveDay} günleri çalışıyorsun.`
    ))
  }

  // ── Subject difficulty ─────────────────────────────────────────
  const hardSubject = subjectStats
    .filter(s => s.total >= 3)
    .sort((a, b) => a.completion_rate - b.completion_rate)[0]

  if (hardSubject && hardSubject.completion_rate < 60) {
    list.push(insight('warning', '📚',
      'Zorlu ders tespit edildi',
      `${hardSubject.subject} görevlerinde tamamlama oranın %${hardSubject.completion_rate} — biraz daha pratik yapmayı dene.`
    ))
  }

  const easySubject = subjectStats
    .filter(s => s.total >= 3)
    .sort((a, b) => b.completion_rate - a.completion_rate)[0]

  if (easySubject && easySubject.completion_rate === 100) {
    list.push(insight('achievement', '⭐',
      'Mükemmel ders',
      `${easySubject.subject} dersinde tüm görevleri tamamladın!`
    ))
  }

  // ── Pomodoro insights ──────────────────────────────────────────
  if (pomodoroStats.completion_rate >= 80 && pomodoroStats.total_completed >= 5) {
    list.push(insight('positive', '🍅',
      'Yüksek odak kalitesi',
      `Pomodoro tamamlama oranın %${pomodoroStats.completion_rate} — çok iyi!`
    ))
  } else if (pomodoroStats.completion_rate < 50 && pomodoroStats.total_completed > 0) {
    list.push(insight('warning', '🍅',
      'Odak seansları yarıda kesiliyor',
      'Pomodoro seanslarının yarısından fazlası tamamlanmadan bitiyor.'
    ))
  }

  if (pomodoroStats.total_focus_minutes >= 600) {
    list.push(insight('achievement', '🏆',
      `${Math.round(pomodoroStats.total_focus_minutes / 60)} saat odak süresi`,
      'Toplam odak süren 10 saati geçti — olağanüstü bir çaba!'
    ))
  }

  // ── Consecutive study days ─────────────────────────────────────
  const activeDays = dailyTasks.filter(d => d.completed > 0).length
  if (activeDays === 7) {
    list.push(insight('achievement', '🏅',
      'Mükemmel hafta',
      'Son 7 günün tamamında görev tamamladın — harika bir hafta!'
    ))
  } else if (activeDays >= 5) {
    list.push(insight('positive', '💪',
      'Çok aktif hafta',
      `Bu hafta ${activeDays}/7 gün aktif çalıştın.`
    ))
  }

  // ── Productivity score based insight ──────────────────────────
  if (ps.total >= 80) {
    list.push(insight('achievement', '🚀',
      'Üretkenlik zirvesinde',
      `Üretkenlik skorun ${ps.total}/100 — zirve performans!`
    ))
  } else if (ps.total < 30) {
    list.push(insight('warning', '💡',
      'Potansiyelini aç',
      'Her gün küçük adımlar büyük farklar yaratır. Başlamak için en iyi zaman şimdi!'
    ))
  }

  // Return max 6 insights (most important first)
  return list.slice(0, 6)
}
