import type { SupabaseClient } from '@supabase/supabase-js'
import { getAnthropicClient, AI_MODEL, TOKEN_LIMITS } from './client'
import { SYSTEM_PROMPT, buildDailyPrompt, buildWeeklyPrompt, buildRecommendationsPrompt } from './prompts'
import { collectUserStats } from './collect-stats'
import type { DailyCoachData, WeeklyReport, Recommendations, AIInsightRow } from './types'

// ─────────────────────────────────────────────────────────────────
// Cache helpers
// ─────────────────────────────────────────────────────────────────
function todayCacheKey(): string {
  return new Date().toISOString().split('T')[0]
}
function weekCacheKey(): string {
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil((((d.getTime() - jan1.getTime()) / 86400000) + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

async function getCached<T>(
  supabase:    SupabaseClient,
  userId:      string,
  type:        AIInsightRow['insight_type'],
  cacheKey:    string,
): Promise<T | null> {
  const { data } = await supabase
    .from('ai_insights')
    .select('content')
    .eq('user_id', userId)
    .eq('insight_type', type)
    .eq('cache_key', cacheKey)
    .maybeSingle()

  return data?.content ?? null
}

async function saveCache(
  supabase:    SupabaseClient,
  userId:      string,
  type:        AIInsightRow['insight_type'],
  cacheKey:    string,
  content:     object,
): Promise<void> {
  await supabase.from('ai_insights').upsert({
    user_id:      userId,
    insight_type: type,
    cache_key:    cacheKey,
    content,
    generated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,insight_type,cache_key' })
}

// ─────────────────────────────────────────────────────────────────
// Core AI call — returns parsed JSON or null on failure
// ─────────────────────────────────────────────────────────────────
async function callAI<T>(
  userPrompt:  string,
  maxTokens:   number,
): Promise<T | null> {
  try {
    const client = getAnthropicClient()
    const msg = await client.messages.create({
      model:      AI_MODEL,
      max_tokens: maxTokens,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          // Prompt caching — reuses system prompt across calls
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    return JSON.parse(jsonMatch[0]) as T
  } catch (err) {
    console.error('[AI] Generation error:', err)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────
// DAILY COACH INSIGHTS
// Returns cached data or generates fresh insights
// ─────────────────────────────────────────────────────────────────
export async function getDailyInsights(
  supabase: SupabaseClient,
  userId:   string,
  force:    boolean = false,
): Promise<DailyCoachData | null> {
  const cacheKey = todayCacheKey()

  // Check cache first
  if (!force) {
    const cached = await getCached<DailyCoachData>(supabase, userId, 'daily', cacheKey)
    if (cached) return cached
  }

  // Collect stats
  const stats = await collectUserStats(supabase, userId)

  // Generate
  const data = await callAI<Omit<DailyCoachData, 'generated_at'>>(
    buildDailyPrompt(stats),
    TOKEN_LIMITS.daily,
  )
  if (!data) return getFallbackDaily(stats)

  const result: DailyCoachData = { ...data, generated_at: new Date().toISOString() }
  await saveCache(supabase, userId, 'daily', cacheKey, result)
  return result
}

// ─────────────────────────────────────────────────────────────────
// WEEKLY REPORT
// ─────────────────────────────────────────────────────────────────
export async function getWeeklyReport(
  supabase: SupabaseClient,
  userId:   string,
  force:    boolean = false,
): Promise<WeeklyReport | null> {
  const cacheKey = weekCacheKey()

  if (!force) {
    const cached = await getCached<WeeklyReport>(supabase, userId, 'weekly', cacheKey)
    if (cached) return cached
  }

  const stats = await collectUserStats(supabase, userId)
  const data  = await callAI<Omit<WeeklyReport, 'generated_at'>>(
    buildWeeklyPrompt(stats),
    TOKEN_LIMITS.weekly,
  )
  if (!data) return null

  const result: WeeklyReport = { ...data, generated_at: new Date().toISOString() }
  await saveCache(supabase, userId, 'weekly', cacheKey, result)
  return result
}

// ─────────────────────────────────────────────────────────────────
// RECOMMENDATIONS
// ─────────────────────────────────────────────────────────────────
export async function getRecommendations(
  supabase: SupabaseClient,
  userId:   string,
  force:    boolean = false,
): Promise<Recommendations | null> {
  const cacheKey = todayCacheKey()

  if (!force) {
    const cached = await getCached<Recommendations>(supabase, userId, 'recommendations', cacheKey)
    if (cached) return cached
  }

  const stats = await collectUserStats(supabase, userId)
  const data  = await callAI<Omit<Recommendations, 'generated_at'>>(
    buildRecommendationsPrompt(stats),
    TOKEN_LIMITS.recommendations,
  )
  if (!data) return getFallbackRecommendations()

  const result: Recommendations = { ...data, generated_at: new Date().toISOString() }
  await saveCache(supabase, userId, 'recommendations', cacheKey, result)
  return result
}

// ─────────────────────────────────────────────────────────────────
// FALLBACKS — used when API unavailable or key not set
// ─────────────────────────────────────────────────────────────────
import type { UserStatsForAI } from './types'

function getFallbackDaily(stats: UserStatsForAI): DailyCoachData {
  const insights = []

  if (stats.currentStreak >= 3) {
    insights.push({
      type: 'positive' as const,
      icon: '🔥',
      text: `${stats.currentStreak} günlük çalışma serinle harika bir ritim yakaladın!`,
      metric: `${stats.currentStreak} gün`,
    })
  }

  if (stats.weekFocusMinutes > 0) {
    insights.push({
      type: 'positive' as const,
      icon: '⏱️',
      text: `Bu hafta toplam ${stats.weekFocusMinutes} dakika odak süren var.`,
      metric: `${stats.weekFocusMinutes} dk`,
    })
  }

  if (stats.taskCompletionRate >= 80) {
    insights.push({
      type: 'positive' as const,
      icon: '✅',
      text: 'Görev tamamlama oranın çok iyi, bu tempo devam ettir!',
      metric: `%${stats.taskCompletionRate}`,
    })
  } else {
    insights.push({
      type: 'tip' as const,
      icon: '💡',
      text: 'Günlük görevlerini düzenli tamamlamak XP kazanmanı hızlandırır.',
    })
  }

  insights.push({
    type: 'tip' as const,
    icon: '🎯',
    text: 'Pomodoro tekniğiyle 25 dakikalık odak seansları çalışma verimliliğini artırır.',
  })

  return {
    insights: insights.slice(0, 4),
    motivation: 'Her adım seni hedefe bir adım daha yaklaştırır. 💪',
    greeting: stats.currentStreak > 0 ? 'Seri devam ediyor!' : 'Bugün başlamak için harika bir gün!',
    generated_at: new Date().toISOString(),
  }
}

function getFallbackRecommendations(): Recommendations {
  return {
    difficulty_adjustment: 'maintain',
    difficulty_reason: 'Mevcut seviyende devam etmen tavsiye edilir.',
    optimal_session_mins: 25,
    break_tip: 'Her 25 dakika çalışma sonrası 5 dakika mola ver.',
    focus_tip: 'Telefonu sessize al ve derin çalışma moduna gir.',
    workload_tip: 'Günde 3 görev tamamlamayı hedefle.',
    generated_at: new Date().toISOString(),
  }
}
