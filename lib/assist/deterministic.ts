// ─────────────────────────────────────────────────────────────────
// Deterministic Noetic Assist replies — no Claude call.
//
// "Optimize my schedule" and "Explain my performance" both reduce to
// sorting/formatting data the app already has (exams, tasks, goals,
// analytics) plus a small rule ladder for the recommendation line —
// no free-form language generation is actually needed, so these stay
// pure software. Compare lib/dashboard/command-center.ts's
// computeNextAction, which is the same kind of priority ladder.
// ─────────────────────────────────────────────────────────────────

export interface PlannerSignals {
  exams:          { name: string; exam_date: string }[]   // sorted by exam_date asc
  tasksTotal:     number
  tasksCompleted: number
  goals:          { title: string; deadline: string | null }[]   // sorted by deadline asc
}

export function buildPlannerReply(s: PlannerSignals): string {
  const today = new Date().toISOString().split('T')[0]
  const lines: string[] = []

  const completionPct = s.tasksTotal > 0
    ? Math.round((s.tasksCompleted / s.tasksTotal) * 100)
    : null

  lines.push(
    completionPct !== null
      ? `Önümüzdeki 7 gün için ${s.tasksTotal} görev planlı, ${s.tasksCompleted} tamamlandı (%${completionPct}).`
      : 'Önümüzdeki 7 gün için henüz planlanmış bir görev yok.'
  )

  const nearestExam = s.exams[0] ?? null
  let daysAway: number | null = null
  if (nearestExam) {
    daysAway = Math.round(
      (new Date(nearestExam.exam_date + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86_400_000
    )
    lines.push(
      daysAway <= 3
        ? `🎯 En yakın sınav: ${nearestExam.name} — ${daysAway} gün kaldı.`
        : `🎯 En yakın sınav: ${nearestExam.name} — ${daysAway} gün sonra.`
    )
  }

  if (s.goals.length > 0) {
    const goalsText = s.goals.slice(0, 3)
      .map(g => g.deadline ? `${g.title} (${g.deadline})` : g.title)
      .join(', ')
    lines.push(`Açık hedefler: ${goalsText}.`)
  }

  if (nearestExam && daysAway !== null && daysAway <= 3) {
    lines.push(`Öneri: Bu hafta ağırlığı ${nearestExam.name} dersine ver, diğer görevleri ikinci plana at.`)
  } else if (completionPct !== null && completionPct < 50) {
    lines.push('Öneri: Görev sayını azalt ama başladığını bitir — küçük adımlarla tamamlama oranını yükselt.')
  } else if (s.goals.length > 0) {
    lines.push(`Öneri: "${s.goals[0].title}" hedefine bu hafta somut bir adım at.`)
  } else {
    lines.push('Öneri: Mevcut temponu koru — planına sadık kal.')
  }

  return lines.join('\n')
}

export interface InsightsSignals {
  thisWeekMinutes:   number
  minutesChangePct:  number
  taskCompletionPct: number
  recallSuccessPct:  number
  recallTotal:       number
  consistencyPct:    number
}

function fmtHours(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}s ${m}dk` : `${m}dk`
}

export function buildInsightsReply(s: InsightsSignals): string {
  const lines: string[] = []

  lines.push(
    s.thisWeekMinutes === 0
      ? 'Bu hafta henüz kayıtlı odak süresi yok.'
      : s.minutesChangePct >= 10
        ? `Bu hafta ${fmtHours(s.thisWeekMinutes)} odaklandın — geçen haftaya göre %${s.minutesChangePct} artış.`
        : s.minutesChangePct <= -10
          ? `Bu hafta ${fmtHours(s.thisWeekMinutes)} odaklandın — geçen haftaya göre %${Math.abs(s.minutesChangePct)} düşüş.`
          : `Bu hafta ${fmtHours(s.thisWeekMinutes)} odaklandın — geçen haftayla benzer seviyede.`
  )

  lines.push(
    s.recallTotal > 0
      ? `Recall başarı oranın %${s.recallSuccessPct} (${s.recallTotal} tekrar), tutarlılık %${s.consistencyPct}.`
      : `Bu hafta Recall tekrarı yapılmadı, tutarlılık %${s.consistencyPct}.`
  )

  if (s.minutesChangePct <= -20) {
    lines.push('Öneri: Odak süren düşmüş — bu hafta günde en az bir kısa pomodoro oturumu planla.')
  } else if (s.taskCompletionPct < 50) {
    lines.push('Öneri: Görev tamamlama oranın düşük — günlük hedefi küçült, bitirme oranına odaklan.')
  } else if (s.recallTotal === 0) {
    lines.push('Öneri: Bu hafta hiç Recall tekrarı yok — birkaç kart çevirerek başla.')
  } else if (s.consistencyPct < 50) {
    lines.push('Öneri: Daha düzenli çalışmak için her gün kısa da olsa bir oturum yap.')
  } else {
    lines.push('Öneri: Mevcut temponu koru — dengeli gidiyorsun.')
  }

  return lines.join('\n')
}
