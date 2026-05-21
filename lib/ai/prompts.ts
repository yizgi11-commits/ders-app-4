import type { UserStatsForAI } from './types'

// ─────────────────────────────────────────────────────────────────
// SYSTEM PROMPT (shared, cached by Anthropic)
// ─────────────────────────────────────────────────────────────────
export const SYSTEM_PROMPT = `Sen Study OS'un yapay zeka destekli çalışma koçusun.
Öğrencilerin çalışma alışkanlıklarını analiz ederek kişiselleştirilmiş, Türkçe içgörüler üretiyorsun.

KURALLAR:
- Yanıtların her zaman geçerli JSON formatında olsun
- Türkçe, samimi ama profesyonel bir dil kullan
- Kısa ve etkili mesajlar yaz (maks 1-2 cümle per insight)
- Robotik değil, gerçek bir koç gibi konuş
- Spesifik veri kullan, genel söylemlerden kaçın
- Abartmadan, dürüstçe değerlendir`

// ─────────────────────────────────────────────────────────────────
// DAILY INSIGHTS PROMPT
// ─────────────────────────────────────────────────────────────────
export function buildDailyPrompt(stats: UserStatsForAI): string {
  const focusChangeText = stats.focusTrend >= 0
    ? `geçen haftaya göre %${Math.round(stats.focusTrend)} arttı`
    : `geçen haftaya göre %${Math.round(Math.abs(stats.focusTrend))} azaldı`

  const recentActivity = stats.recentDays
    .map(d => `${d.date}: ${d.focusMinutes} dk, ${d.sessions} oturum`)
    .join(' | ')

  const subjectText = stats.subjectStats.length > 0
    ? stats.subjectStats.map(s => `${s.subject}: ${s.tasksCompleted} görev`).join(', ')
    : 'henüz ders verisi yok'

  return `Kullanıcı verileri:
- Seviye: ${stats.level} | Toplam XP: ${stats.totalXp} | Bugün XP: ${stats.todayXp}
- Seri: ${stats.currentStreak} gün (rekor: ${stats.longestStreak} gün)
- Bu hafta odak: ${stats.weekFocusMinutes} dk (${focusChangeText})
- Bugün odak: ${stats.todayFocusMinutes} dk
- Haftalık görev tamamlama: ${stats.weekTasksDone} görev (%${stats.taskCompletionRate} oran)
- Son 3 gün: ${recentActivity}
- Dersler: ${subjectText}
- Zirve saatler: ${stats.peakHours.length > 0 ? stats.peakHours.map(h => `${h}:00`).join(', ') : 'belirsiz'}

3-5 adet kişiselleştirilmiş insight ve 1 motivasyon mesajı üret.

JSON formatı (bu formattan sapma):
{
  "insights": [
    {
      "type": "positive" | "warning" | "tip" | "neutral",
      "icon": "emoji",
      "text": "Türkçe insight metni",
      "metric": "opsiyonel metrik (örn: +22%, 5 gün)"
    }
  ],
  "motivation": "Tek cümlelik motivasyon mesajı",
  "greeting": "Kısa selamlama (örn: Harika gidiyorsun! / Devam et!)"
}`
}

// ─────────────────────────────────────────────────────────────────
// WEEKLY REPORT PROMPT
// ─────────────────────────────────────────────────────────────────
export function buildWeeklyPrompt(stats: UserStatsForAI): string {
  const subjectText = stats.subjectStats.length > 0
    ? stats.subjectStats.map(s => `${s.subject}: ${s.tasksCompleted} görev, ort ${s.avgXp} XP`).join('\n  ')
    : 'Ders verisi yok'

  const focusChange = stats.prevWeekFocusMinutes > 0
    ? Math.round(((stats.weekFocusMinutes - stats.prevWeekFocusMinutes) / stats.prevWeekFocusMinutes) * 100)
    : 0

  return `Kullanıcının bu haftaki tüm verileri:

ÖZET:
- Seviye: ${stats.level} | Toplam XP: ${stats.totalXp}
- Haftalık odak süresi: ${stats.weekFocusMinutes} dk (önceki hafta: ${stats.prevWeekFocusMinutes} dk, değişim: ${focusChange > 0 ? '+' : ''}${focusChange}%)
- Tamamlanan oturumlar: ${stats.weekSessions} (önceki hafta: ${stats.prevWeekSessions})
- Günlük ortalama odak: ${stats.avgDailyFocus} dk
- Görev tamamlama oranı: %${stats.taskCompletionRate}
- Aktif seri: ${stats.currentStreak} gün
- Zirve çalışma saatleri: ${stats.peakHours.map(h => `${h}:00`).join(', ')}

DERS DETAYI:
  ${subjectText}

Kapsamlı bir haftalık rapor üret.

JSON formatı:
{
  "summary": "2-3 cümlelik haftalık özet",
  "productivity_trend": "improving" | "stable" | "declining",
  "highlights": ["öne çıkan başarı 1", "öne çıkan başarı 2"],
  "concerns": ["iyileştirme alanı 1"],
  "strongest_subject": "en güçlü ders veya null",
  "weakest_subject": "en zayıf ders veya null",
  "streak_analysis": "Seri hakkında 1 cümle",
  "next_week_focus": "Gelecek hafta için 1 spesifik öneri",
  "recommendations": ["öneri 1", "öneri 2", "öneri 3"]
}`
}

// ─────────────────────────────────────────────────────────────────
// RECOMMENDATIONS PROMPT
// ─────────────────────────────────────────────────────────────────
export function buildRecommendationsPrompt(stats: UserStatsForAI): string {
  return `Kullanıcı verisi:
- Görev tamamlama oranı: %${stats.taskCompletionRate}
- Ortalama günlük odak: ${stats.avgDailyFocus} dk
- Haftalık seri: ${stats.currentStreak} gün
- Bu hafta odak: ${stats.weekFocusMinutes} dk
- Önceki hafta odak: ${stats.prevWeekFocusMinutes} dk
- Zirve saatler: ${stats.peakHours.map(h => `${h}:00`).join(', ')}

Kullanıcı için özelleştirilmiş öneriler üret.

JSON formatı:
{
  "difficulty_adjustment": "increase" | "decrease" | "maintain",
  "difficulty_reason": "1 cümle neden",
  "optimal_session_mins": 25 | 35 | 45 (sayı),
  "break_tip": "Mola hakkında 1 öneri",
  "focus_tip": "Odak hakkında 1 öneri",
  "workload_tip": "İş yükü hakkında 1 öneri"
}`
}
