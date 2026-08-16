import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient, AI_MODEL } from '@/lib/ai/client'
import { logUsage } from '@/lib/ai/usage'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { sanitizeString, validateUUID, MAX } from '@/lib/security'
import { getCachedAnalyticsData } from '@/lib/analytics/queries'
import type { AssistPageContext } from '@/lib/assist/types'

export const runtime = 'nodejs'

const ENDPOINT = '/api/assist'

const GENERAL_SYSTEM = `Sen Noetic OS'in genel öğrenme asistanısın. Öğrencinin öğrenme sürecinde sorularını yanıtlıyorsun.
Kısa, net, Türkçe. Gereksiz uzatma — birkaç cümle veya kısa madde listesi yeterli.`

/**
 * `staticSystem` is identical across every call in the same context kind
 * (same words for every user, every topic) — it's the part worth marking
 * with `cache_control`. `dynamicContext` is the per-request data (topic
 * name, this week's numbers, ...) and is never cached. Splitting them is
 * what makes Anthropic's ephemeral prompt cache actually able to hit;
 * folding both into one interpolated string (the previous shape) made
 * every call's system prompt unique and defeated caching entirely.
 */
interface Grounded { staticSystem: string; dynamicContext: string }

async function buildGrounding(
  supabase: SupabaseClient,
  userId:   string,
  ctx:      AssistPageContext,
): Promise<Grounded> {
  switch (ctx.kind) {
    case 'atlas-topic': {
      if (!validateUUID(ctx.topicId) || !validateUUID(ctx.subjectId)) {
        throw new Error('Geçersiz konu')
      }
      const { data: topic } = await supabase
        .from('topics')
        .select('title, subjects(name)')
        .eq('id', ctx.topicId)
        .eq('subject_id', ctx.subjectId)
        .eq('user_id', userId)
        .maybeSingle()

      if (!topic) throw new Error('Konu bulunamadı')
      const subjectName = (topic.subjects as { name?: string } | null)?.name ?? 'ders'

      return {
        staticSystem: `Sen Noetic OS'in Atlas modülündeki öğrenme asistanısın. Kullanıcının incelediği konuyu doğru, net ve öğretici şekilde Türkçe anlat. Bilmediğin veya emin olmadığın bir şeyi uydurma.`,
        dynamicContext: `Konu: ${topic.title}\nDers: ${subjectName}`,
      }
    }

    case 'atlas-subject': {
      if (!validateUUID(ctx.subjectId)) throw new Error('Geçersiz ders')
      const { data: subject } = await supabase
        .from('subjects')
        .select('name')
        .eq('id', ctx.subjectId)
        .eq('user_id', userId)
        .maybeSingle()

      return {
        staticSystem: `Sen Noetic OS'in Atlas modülündeki öğrenme asistanısın. Kısa, net, Türkçe yanıtla.`,
        dynamicContext: `Kullanıcı "${subject?.name ?? 'bir ders'}" dersinin konu haritasına bakıyor.`,
      }
    }

    case 'atlas':
      return {
        staticSystem: `Sen Noetic OS'in Atlas modülündeki öğrenme asistanısın. Kullanıcı derslerinin ve konularının haritasına bakıyor. Kısa, net, Türkçe yanıtla.`,
        dynamicContext: '',
      }

    case 'planner': {
      const today = new Date().toISOString().split('T')[0]
      const weekEnd = new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0]

      const [examsRes, tasksRes, goalsRes] = await Promise.all([
        supabase.from('exams').select('name, exam_date').eq('user_id', userId).gte('exam_date', today).order('exam_date').limit(5),
        supabase.from('daily_tasks').select('completed').eq('user_id', userId).eq('source', 'planner').gte('date', today).lte('date', weekEnd),
        supabase.from('goals').select('title, deadline').eq('user_id', userId).eq('completed', false).order('deadline', { ascending: true, nullsFirst: false }).limit(5),
      ])

      const exams = (examsRes.data ?? []) as { name: string; exam_date: string }[]
      const tasks = (tasksRes.data ?? []) as { completed: boolean }[]
      const goals = (goalsRes.data ?? []) as { title: string; deadline: string | null }[]

      const examsText = exams.length > 0
        ? exams.map(e => `${e.name} (${e.exam_date})`).join(', ')
        : 'kayıtlı sınav yok'
      const goalsText = goals.length > 0
        ? goals.map(g => `${g.title}${g.deadline ? ` (${g.deadline})` : ''}`).join(', ')
        : 'kayıtlı hedef yok'

      return {
        staticSystem: `Sen Noetic OS'in Planner modülündeki planlama asistanısın. Kullanıcının önümüzdeki 7 günü, hedefleri ve sınavları için somut, uygulanabilir öneriler ver. Kısa, net, Türkçe. Genel geçer tavsiye değil, verilen veriye dayan.`,
        dynamicContext: `Önümüzdeki 7 gün planlanan görev: ${tasks.length}, tamamlanan: ${tasks.filter(t => t.completed).length}
Yaklaşan sınavlar: ${examsText}
Açık hedefler: ${goalsText}`,
      }
    }

    case 'insights': {
      // app_cache-backed — see lib/analytics/queries.ts. Without this,
      // every assist message asked in Insights context re-ran the full
      // 7-query analytics fetch, even mid-conversation follow-ups.
      const data = await getCachedAnalyticsData(supabase, userId)
      const w = data.weeklyComparison
      return {
        staticSystem: `Sen Noetic OS'in Insights modülündeki analiz asistanısın. Kullanıcının verilerini yorumluyorsun. Kısa, net, veri odaklı, Türkçe. Sadece yorumla — tavsiye ver ama duygusal olma.`,
        dynamicContext: `Bu hafta odak: ${w.this_week_minutes} dk (geçen hafta ${w.last_week_minutes} dk)
Görev tamamlama: %${data.productivityScore.task_completion}
Recall başarısı: %${data.recallWeek.successRate}
Tutarlılık: %${data.productivityScore.consistency}
Seri: ${data.currentStreak} gün
En verimli gün: ${data.mostProductiveDay ?? 'belirsiz'}`,
      }
    }

    case 'vault':
      return {
        staticSystem: `Sen Noetic OS'in Vault modülündeki yardımcısın. Kullanıcı henüz belirli bir not veya belge açmadı. Kısa, net, Türkçe yanıtla.`,
        dynamicContext: '',
      }

    default:
      return { staticSystem: GENERAL_SYSTEM, dynamicContext: '' }
  }
}

// POST /api/assist
// Body: { pageContext: AssistPageContext, message: string }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const pageContext = body?.pageContext as AssistPageContext
  const message = sanitizeString(body?.message ?? '', MAX.GENERIC_TEXT)

  if (!pageContext?.kind) return NextResponse.json({ error: 'Geçersiz bağlam' }, { status: 400 })
  if (!message) return NextResponse.json({ error: 'Mesaj gerekli' }, { status: 400 })

  const { allowed } = await checkRateLimit(supabase, user.id, ENDPOINT, 30, 24)
  if (!allowed) {
    return NextResponse.json({ error: 'Günlük Noetic Assist limitine ulaştın (30/gün). Yarın tekrar dene.' }, { status: 429 })
  }

  let grounded: Grounded
  try {
    grounded = await buildGrounding(supabase, user.id, pageContext)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bağlam yüklenemedi'
    return NextResponse.json({ error: msg }, { status: 404 })
  }

  try {
    const anthropic = getAnthropicClient()
    const response = await anthropic.messages.create({
      model:      AI_MODEL,
      max_tokens: 500,
      system: grounded.dynamicContext
        ? [
            { type: 'text', text: grounded.staticSystem, cache_control: { type: 'ephemeral' } },
            { type: 'text', text: grounded.dynamicContext },
          ]
        : [{ type: 'text', text: grounded.staticSystem, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: message }],
    })

    void logUsage(supabase, user.id, ENDPOINT, response.usage.input_tokens, response.usage.output_tokens)

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    if (!text) throw new Error('Boş yanıt')

    return NextResponse.json({ text })
  } catch (err) {
    console.error('[Assist] Hata:', err)
    return NextResponse.json({ error: 'Yanıt oluşturulamadı. Tekrar dene.' }, { status: 500 })
  }
}
