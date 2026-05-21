import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { collectUserStats } from '@/lib/ai/collect-stats'
import { getAnthropicClient, AI_MODEL, TOKEN_LIMITS } from '@/lib/ai/client'
import type { DailyCoachData, UserStatsForAI } from '@/lib/ai/types'

export const runtime = 'nodejs'

// ─────────────────────────────────────────────────────────────────
// Build the prompt for Claude
// ─────────────────────────────────────────────────────────────────
function buildPrompt(stats: UserStatsForAI): string {
  const peakHoursStr = stats.peakHours.length
    ? stats.peakHours.map(h => `${h}:00`).join(', ')
    : 'belirsiz'

  const subjectsStr = stats.subjectStats.length
    ? stats.subjectStats.map(s => `${s.subject} (${s.tasksCompleted} görev)`).join(', ')
    : 'henüz ders yok'

  const trendStr = stats.focusTrend > 0
    ? `+${Math.round(stats.focusTrend)}% artış`
    : stats.focusTrend < 0
    ? `${Math.round(stats.focusTrend)}% düşüş`
    : 'değişim yok'

  return `Kullanıcının güncel çalışma verileri:

- Seviye: ${stats.level} | Toplam XP: ${stats.totalXp}
- Mevcut seri: ${stats.currentStreak} gün | En uzun seri: ${stats.longestStreak} gün
- Bu hafta odak süresi: ${Math.round(stats.weekFocusMinutes / 60 * 10) / 10} saat (${stats.weekSessions} oturum)
- Geçen haftaya göre: ${trendStr}
- Bugün odak: ${stats.todayFocusMinutes} dakika
- Haftalık görev tamamlama: %${stats.taskCompletionRate} (${stats.weekTasksDone} görev)
- En verimli saatler: ${peakHoursStr}
- Çalıştığı dersler: ${subjectsStr}

Yukarıdaki gerçek verilere dayanarak TAM OLARAK 3 içgörü üret.
Her içgörü kullanıcının gerçek sayılarına atıfta bulunmalı.
Yanıtı YALNIZCA aşağıdaki JSON formatında ver, başka hiçbir şey ekleme:

{
  "greeting": "kısa selamlama (max 10 kelime, kullanıcının durumuna özel)",
  "insights": [
    {
      "type": "positive|warning|tip|neutral",
      "icon": "tek emoji",
      "text": "Türkçe içgörü mesajı, gerçek sayıları kullan (max 20 kelime)",
      "metric": "öne çıkan metrik (örn: '+22%', '7 gün', '3.5 saat')"
    }
  ],
  "motivation": "kısa motivasyon cümlesi (max 12 kelime, Türkçe)"
}`
}

// ─────────────────────────────────────────────────────────────────
// GET /api/ai/insights
// ─────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const force = req.nextUrl.searchParams.get('force') === '1'
  const todayKey = new Date().toISOString().split('T')[0] // "YYYY-MM-DD"

  // ── 1. Check 24h cache ──────────────────────────────────────────
  if (!force) {
    const { data: cached } = await supabase
      .from('ai_insights')
      .select('content, generated_at')
      .eq('user_id', user.id)
      .eq('insight_type', 'daily')
      .eq('cache_key', todayKey)
      .maybeSingle()

    if (cached) {
      return NextResponse.json(cached.content)
    }
  }

  // ── 2. Collect real user stats ──────────────────────────────────
  const stats = await collectUserStats(supabase, user.id)

  // ── 3. Call Claude ──────────────────────────────────────────────
  let coachData: DailyCoachData

  try {
    const anthropic = getAnthropicClient()
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: TOKEN_LIMITS.daily,
      system: 'Sen bir çalışma koçusun. Doğrudan, özgün ve motive edici ol. Her zaman kullanıcının gerçek verilerini referans al. Yalnızca geçerli JSON döndür, açıklama ekleme.',
      messages: [
        { role: 'user', content: buildPrompt(stats) },
      ],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract JSON (Claude may wrap in ```json ... ```)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON bulunamadı')

    const parsed = JSON.parse(jsonMatch[0])

    coachData = {
      greeting:     parsed.greeting     ?? '',
      insights:     parsed.insights     ?? [],
      motivation:   parsed.motivation   ?? '',
      generated_at: new Date().toISOString(),
    }
  } catch (err) {
    console.error('[AI Insights] Claude API hatası:', err)
    // Graceful fallback — still return useful data from stats
    coachData = buildFallback(stats)
  }

  // ── 4. Save to cache ────────────────────────────────────────────
  await supabase
    .from('ai_insights')
    .upsert(
      {
        user_id:      user.id,
        insight_type: 'daily',
        cache_key:    todayKey,
        content:      coachData,
        generated_at: coachData.generated_at,
      },
      { onConflict: 'user_id,insight_type,cache_key' },
    )

  return NextResponse.json(coachData)
}

// ─────────────────────────────────────────────────────────────────
// Fallback when Claude is unavailable (no API key, quota, etc.)
// ─────────────────────────────────────────────────────────────────
function buildFallback(stats: UserStatsForAI): DailyCoachData {
  const insights = []

  if (stats.currentStreak >= 3) {
    insights.push({ type: 'positive' as const, icon: '🔥', text: `${stats.currentStreak} günlük serinle harika bir ritim yakaladın.`, metric: `${stats.currentStreak} gün` })
  } else {
    insights.push({ type: 'tip' as const, icon: '🎯', text: 'Düzenli çalışma serisi oluşturmak uzun vadede çok değerli.', metric: undefined })
  }

  if (stats.weekFocusMinutes > 0) {
    const hrs = Math.round(stats.weekFocusMinutes / 60 * 10) / 10
    insights.push({ type: 'neutral' as const, icon: '⏱', text: `Bu hafta ${hrs} saat odaklandın, ${stats.weekSessions} oturum tamamladın.`, metric: `${hrs} saat` })
  }

  if (stats.taskCompletionRate >= 80) {
    insights.push({ type: 'positive' as const, icon: '✅', text: `%${stats.taskCompletionRate} görev tamamlama oranı mükemmel bir performans.`, metric: `%${stats.taskCompletionRate}` })
  } else {
    insights.push({ type: 'warning' as const, icon: '📋', text: `Günlük görevlere odaklanmak XP kazanımını ve ilerlemeyi hızlandırır.`, metric: undefined })
  }

  return {
    greeting: stats.currentStreak > 0 ? `${stats.currentStreak} günlük serini sürdür! 💪` : 'Bugün çalışmaya hazır mısın? 🚀',
    insights,
    motivation: 'Her gün küçük bir adım, büyük bir fark yaratır.',
    generated_at: new Date().toISOString(),
  }
}
