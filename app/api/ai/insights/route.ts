import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { collectUserStats } from '@/lib/ai/collect-stats'
import { getAnthropicClient, AI_MODEL } from '@/lib/ai/client'
import { logUsage } from '@/lib/ai/usage'
import { getCache, setCache, TTL, cacheKey } from '@/lib/cache'
import { checkRateLimit } from '@/lib/security/rate-limit'
import type { DailyCoachData, UserStatsForAI } from '@/lib/ai/types'

export const runtime = 'nodejs'

// ── Compact prompt (<50 words) ────────────────────────────────────
function buildPrompt(s: UserStatsForAI): string {
  const subject = s.subjectStats[0]?.subject ?? 'belirsiz'
  return `Seri:${s.currentStreak}gün bugün:${s.todayFocusMinutes}dk haftalık:%${s.taskCompletionRate} zayıf:${subject}
3 Türkçe içgörü+motivasyon. SADECE JSON:
{"greeting":"","insights":[{"type":"positive|warning|tip","icon":"emoji","text":"","metric":""}],"motivation":""}`
}

// ── Fallback when Claude unavailable ─────────────────────────────
function buildFallback(s: UserStatsForAI): DailyCoachData {
  const insights = []
  if (s.currentStreak >= 3)
    insights.push({ type: 'positive' as const, icon: '🔥', text: `${s.currentStreak} günlük serinle harika bir ritim yakaladın!`, metric: `${s.currentStreak} gün` })
  else
    insights.push({ type: 'tip' as const, icon: '🎯', text: 'Düzenli çalışma serisi oluşturmak uzun vadede çok değerli.', metric: undefined })

  if (s.weekFocusMinutes > 0) {
    const hrs = Math.round(s.weekFocusMinutes / 60 * 10) / 10
    insights.push({ type: 'neutral' as const, icon: '⏱', text: `Bu hafta ${hrs} saat odaklandın, ${s.weekSessions} oturum tamamladın.`, metric: `${hrs} saat` })
  }
  insights.push({ type: s.taskCompletionRate >= 70 ? 'positive' as const : 'warning' as const, icon: '✅', text: `Haftalık görev tamamlama oranın %${s.taskCompletionRate}.`, metric: `%${s.taskCompletionRate}` })

  return {
    greeting:     s.currentStreak > 0 ? `${s.currentStreak} günlük serini sürdür! 💪` : 'Bugün çalışmaya hazır mısın? 🚀',
    insights,
    motivation:   'Her gün küçük bir adım, büyük bir fark yaratır.',
    generated_at: new Date().toISOString(),
  }
}

// ── GET /api/ai/insights ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]
  const insightKey    = cacheKey.aiInsights(today)
  const generatingKey = cacheKey.aiGenerating()

  // ── 1. Return cached data if fresh ───────────────────────────
  const cached = await getCache<DailyCoachData>(supabase, user.id, insightKey)
  if (cached) return NextResponse.json(cached)

  // ── Rate limit: 5 AI calls per day (only checked when not cached) ─
  const { allowed } = await checkRateLimit(supabase, user.id, 'ai/insights', 5, 24)
  if (!allowed) {
    // Return fallback stats instead of erroring out completely
    const stats = await collectUserStats(supabase, user.id)
    return NextResponse.json({ ...buildFallback(stats), rate_limited: true })
  }

  // ── 2. Prevent duplicate generation (is_generating lock) ─────
  const isGenerating = await getCache<boolean>(supabase, user.id, generatingKey)
  if (isGenerating) {
    // Another request is already generating — return fallback stats
    const stats = await collectUserStats(supabase, user.id)
    return NextResponse.json(buildFallback(stats))
  }

  // Acquire lock (30s TTL)
  await setCache(supabase, user.id, generatingKey, { locked: true }, TTL.GENERATING_LOCK)

  // ── 3. Collect stats ──────────────────────────────────────────
  const stats = await collectUserStats(supabase, user.id)

  // ── 4. Call Claude ────────────────────────────────────────────
  let coachData: DailyCoachData

  try {
    const anthropic = getAnthropicClient()
    const response = await anthropic.messages.create({
      model:      AI_MODEL,
      max_tokens: 300,
      system:     'Çalışma koçusun. Yalnızca geçerli JSON döndür.',
      messages:   [{ role: 'user', content: buildPrompt(stats) }],
    })

    // Log usage (non-blocking)
    logUsage(
      supabase, user.id, 'ai/insights',
      response.usage.input_tokens,
      response.usage.output_tokens,
    )

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON parse hatası')

    const parsed = JSON.parse(jsonMatch[0])
    coachData = {
      greeting:     parsed.greeting     ?? '',
      insights:     parsed.insights     ?? [],
      motivation:   parsed.motivation   ?? '',
      generated_at: new Date().toISOString(),
    }
  } catch (err) {
    console.error('[AI Insights] Hata:', err)
    coachData = buildFallback(stats)
  }

  // ── 5. Save to cache + release lock ──────────────────────────
  await Promise.all([
    setCache(supabase, user.id, insightKey, coachData, TTL.AI_INSIGHTS),
    supabase.from('app_cache').delete().eq('user_id', user.id).eq('cache_key', generatingKey),
  ])

  return NextResponse.json(coachData)
}
