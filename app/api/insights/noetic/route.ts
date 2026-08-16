import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchAnalyticsData } from '@/lib/analytics/queries'
import { getAnthropicClient, AI_MODEL } from '@/lib/ai/client'
import { SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { logUsage } from '@/lib/ai/usage'
import { getCache, setCache, TTL, cacheKey } from '@/lib/cache'
import { checkRateLimit } from '@/lib/security/rate-limit'
import type { AnalyticsData } from '@/lib/analytics/types'
import type { NoeticInsightData } from '@/lib/insights/types'

export const runtime = 'nodejs'

function fmtHours(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}s ${m}dk` : `${m}dk`
}

function buildPrompt(d: AnalyticsData): string {
  const w = d.weeklyComparison
  const subjects = d.subjectStats.length > 0
    ? d.subjectStats.slice(0, 3).map(s => `${s.subject}: ${s.completed}/${s.total} görev (%${s.completion_rate})`).join(', ')
    : 'ders verisi yok'

  return `Öğrencinin bu haftaki verileri:
- Odak: ${w.this_week_minutes} dk (geçen hafta ${w.last_week_minutes} dk, değişim %${w.minutes_change_pct})
- Görev tamamlama: %${d.productivityScore.task_completion}
- Recall başarısı: %${d.recallWeek.successRate} (${d.recallWeek.total} tekrar)
- Tutarlılık: %${d.productivityScore.consistency}
- Seri: ${d.currentStreak} gün
- Tamamlanan görev: ${w.this_week_tasks} (geçen hafta ${w.last_week_tasks})
- Dersler: ${subjects}
- En verimli gün: ${d.mostProductiveDay ?? 'belirsiz'}

Bu veriyi yorumla. Sadece JSON döndür:
{"icon":"tek emoji","headline":"tek cümlelik, sayı içeren başlık","body":"maksimum 3 cümle yorum"}`
}

/** Deterministic reading of the same numbers, used when Claude is unavailable. */
function buildFallback(d: AnalyticsData): NoeticInsightData {
  const w = d.weeklyComparison
  const change = w.minutes_change_pct

  let headline: string
  let icon: string
  if (w.this_week_minutes === 0) {
    icon = '📭'
    headline = 'Bu hafta kayıtlı odak süresi yok.'
  } else if (change >= 10) {
    icon = '📈'
    headline = `Odak süren bu hafta %${change} arttı.`
  } else if (change <= -10) {
    icon = '📉'
    headline = `Odak süren bu hafta %${Math.abs(change)} düştü.`
  } else {
    icon = '📊'
    headline = `Odak süren geçen haftayla benzer seviyede (${fmtHours(w.this_week_minutes)}).`
  }

  const parts: string[] = []
  parts.push(`Bu hafta ${fmtHours(w.this_week_minutes)} odaklandın ve ${w.this_week_tasks} görev tamamladın.`)
  if (d.recallWeek.total > 0) {
    parts.push(`Recall başarı oranın %${d.recallWeek.successRate} (${d.recallWeek.total} tekrar).`)
  } else {
    parts.push('Bu hafta hiç Recall tekrarı yapılmadı.')
  }
  parts.push(`Tutarlılık skorun %${d.productivityScore.consistency}.`)

  return {
    headline,
    body: parts.join(' '),
    icon,
    generated_at: new Date().toISOString(),
    fallback: true,
  }
}

// GET /api/insights/noetic — the AI commentary layer on the Insights page
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]
  const key   = cacheKey.noeticInsight(today)

  // ── 1. Serve cached commentary (one generation per user per day) ──
  const cached = await getCache<NoeticInsightData>(supabase, user.id, key)
  if (cached) return NextResponse.json(cached)

  const analytics = await fetchAnalyticsData(supabase, user.id)

  // ── 2. Rate limit — only consumed on a real generation ───────────
  const { allowed } = await checkRateLimit(supabase, user.id, 'insights/noetic', 5, 24)
  if (!allowed) {
    return NextResponse.json({ ...buildFallback(analytics), rate_limited: true })
  }

  // ── 3. Generate ──────────────────────────────────────────────────
  let insight: NoeticInsightData

  try {
    const anthropic = getAnthropicClient()
    const response = await anthropic.messages.create({
      model:      AI_MODEL,
      max_tokens: 400,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: buildPrompt(analytics) }],
    })

    void logUsage(
      supabase, user.id, 'insights/noetic',
      response.usage.input_tokens,
      response.usage.output_tokens,
    )

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('JSON parse hatası')

    const parsed = JSON.parse(match[0])
    if (typeof parsed.headline !== 'string' || typeof parsed.body !== 'string') {
      throw new Error('Eksik alan')
    }

    insight = {
      headline:     parsed.headline.trim(),
      body:         parsed.body.trim(),
      icon:         typeof parsed.icon === 'string' && parsed.icon ? parsed.icon : '📊',
      generated_at: new Date().toISOString(),
    }
  } catch (err) {
    console.error('[Noetic Insight] Hata:', err)
    insight = buildFallback(analytics)
  }

  await setCache(supabase, user.id, key, insight, TTL.AI_INSIGHTS)

  return NextResponse.json(insight)
}
