import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient, AI_MODEL } from '@/lib/ai/client'
import { logUsage } from '@/lib/ai/usage'
import { sanitizeString, validateUUID, safeError, MAX } from '@/lib/security'
import { checkRateLimit } from '@/lib/security/rate-limit'
import type { AssistAction, AssistSource } from '@/lib/vault/types'

const ACTIONS: AssistAction[] = ['summarize', 'flashcards', 'explain', 'quiz']
const SOURCES: AssistSource[] = ['note', 'document']

const MAX_TOKENS: Record<AssistAction, number> = {
  summarize:  700,
  explain:    1000,
  flashcards: 2000,
  quiz:       1600,
}

// Fixed per-action instructions — identical for every user and every
// call, unlike the note/document text. Sent as a `system` block with
// `cache_control` so Anthropic can serve it from prompt cache instead
// of re-billing full input price on every single Vault Assist click.
// (Previously these were interpolated into the same string as the
// source text, which meant no two calls ever shared an exact prefix —
// structurally defeating prompt caching.)
const SYSTEM_PROMPTS: Record<AssistAction, string> = {
  summarize: `Aşağıdaki ders içeriğini Türkçe olarak özetle. En fazla 6 cümle, sade ve net.
Sadece JSON döndür, başka hiçbir şey yazma.

Format:
{"text":"..."}`,

  explain: `Aşağıdaki ders içeriğini bir öğrenciye anlatır gibi Türkçe açıkla.
Zor kavramları basitleştir, gerekirse örnek ver. En fazla 3 paragraf.
Sadece JSON döndür, başka hiçbir şey yazma.

Format:
{"text":"..."}`,

  flashcards: `Aşağıdaki ders içeriğinden 8-12 adet flash kart oluştur.
Her kart: ön yüz (soru veya kavram) + arka yüz (kısa, net cevap). Türkçe yaz.
Sadece JSON döndür, başka hiçbir şey yazma.

Format:
[{"front":"...","back":"..."},...]`,

  quiz: `Aşağıdaki ders içeriğinden 5 adet çoktan seçmeli soru oluştur.
Her sorunun tam 4 seçeneği olsun. "correct" alanı doğru seçeneğin 0-tabanlı indeksi olsun.
Türkçe yaz. Sadece JSON döndür, başka hiçbir şey yazma.

Format:
[{"question":"...","options":["...","...","...","..."],"correct":0},...]`,
}

function parseJson(raw: string): unknown {
  const cleaned = raw.trim()
    .replace(/^```(?:json)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim()
  return JSON.parse(cleaned)
}

// POST /api/vault/assist
// Body: { source: 'note'|'document', id: string, action: AssistAction }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const source = body.source as AssistSource
  const action = body.action as AssistAction
  const id     = String(body.id ?? '')

  if (!SOURCES.includes(source)) return NextResponse.json({ error: 'Geçersiz kaynak' }, { status: 400 })
  if (!ACTIONS.includes(action)) return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
  if (!validateUUID(id))         return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

  // ── Rate limit: 5 assists per day (Free tier) ────────────────────
  const { allowed, remaining } = await checkRateLimit(
    supabase, user.id, '/api/vault/assist', 5, 24
  )
  if (!allowed) {
    return NextResponse.json(
      { error: 'Günlük Noetic Assist limitine ulaştınız (5/gün). Yarın tekrar deneyin.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    )
  }

  // ── Load the source content (ownership enforced by the filters) ─
  let text = ''
  let subjectId: string | null = null
  let topicId:   string | null = null
  let documentId: string | null = null

  if (source === 'note') {
    const { data: note } = await supabase
      .from('notes')
      .select('content, subject_id, topic_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!note) return NextResponse.json({ error: 'Not bulunamadı' }, { status: 404 })
    text = note.content ?? ''
    subjectId = note.subject_id
    topicId   = note.topic_id
  } else {
    const { data: doc } = await supabase
      .from('documents')
      .select('extracted_text, subject_id, topic_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!doc) return NextResponse.json({ error: 'Belge bulunamadı' }, { status: 404 })
    text = doc.extracted_text ?? ''
    subjectId  = doc.subject_id
    topicId    = doc.topic_id
    documentId = id
  }

  if (text.trim().length < 50) {
    return NextResponse.json({ error: 'İçerik çok kısa — en az 50 karakter gerekli.' }, { status: 400 })
  }

  // ── Call Claude ────────────────────────────────────────────────
  const anthropic = getAnthropicClient()
  let parsed: unknown

  try {
    const msg = await anthropic.messages.create({
      model:      AI_MODEL,
      max_tokens: MAX_TOKENS[action],
      system: [{ type: 'text', text: SYSTEM_PROMPTS[action], cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: `Metin:\n${text.slice(0, 8000)}` }],
    })

    const content = msg.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    void logUsage(supabase, user.id, '/api/vault/assist', msg.usage.input_tokens, msg.usage.output_tokens)

    parsed = parseJson(content.text)
  } catch (err) {
    console.error('Vault assist error:', err)
    return NextResponse.json({ error: 'Sonuç oluşturulamadı. Tekrar deneyin.' }, { status: 500 })
  }

  // ── Shape + persist per action ─────────────────────────────────
  if (action === 'summarize' || action === 'explain') {
    const out = parsed as { text?: unknown }
    const value = typeof out?.text === 'string' ? out.text.trim() : ''
    if (!value) return NextResponse.json({ error: 'Boş sonuç döndü.' }, { status: 500 })
    return NextResponse.json({ result: { text: value }, remaining: remaining - 1 })
  }

  if (action === 'flashcards') {
    if (!Array.isArray(parsed)) return NextResponse.json({ error: 'Geçersiz sonuç.' }, { status: 500 })

    const cards = parsed
      .filter((c): c is { front: string; back: string } =>
        typeof c === 'object' && c !== null &&
        typeof (c as Record<string, unknown>).front === 'string' &&
        typeof (c as Record<string, unknown>).back === 'string')
      .slice(0, 20)
      .map(c => ({
        front: sanitizeString(c.front, MAX.FLASHCARD_SIDE),
        back:  sanitizeString(c.back,  MAX.FLASHCARD_SIDE),
      }))
      .filter(c => c.front && c.back)

    if (cards.length === 0) return NextResponse.json({ error: 'Geçerli kart bulunamadı.' }, { status: 500 })

    const today = new Date().toISOString().split('T')[0]
    const { data: inserted, error: insertError } = await supabase
      .from('flashcards')
      .insert(cards.map(c => ({
        user_id:          user.id,
        subject_id:       subjectId,
        topic_id:         topicId,
        document_id:      documentId,
        front:            c.front,
        back:             c.back,
        next_review_date: today,
      })))
      .select('*, subjects(id, name, icon, color)')

    if (insertError) return safeError(insertError, 'Kartlar kaydedilemedi.')

    return NextResponse.json({
      result: { saved: inserted?.length ?? 0, cards: inserted ?? [] },
      remaining: remaining - 1,
    })
  }

  // quiz
  if (!Array.isArray(parsed)) return NextResponse.json({ error: 'Geçersiz sonuç.' }, { status: 500 })

  const questions = parsed
    .filter((q): q is { question: string; options: string[]; correct: number } => {
      if (typeof q !== 'object' || q === null) return false
      const r = q as Record<string, unknown>
      return typeof r.question === 'string'
        && Array.isArray(r.options) && r.options.length === 4
        && r.options.every(o => typeof o === 'string')
        && typeof r.correct === 'number' && r.correct >= 0 && r.correct <= 3
    })
    .slice(0, 8)
    .map(q => ({
      question: sanitizeString(q.question, MAX.GENERIC_TEXT),
      options:  q.options.map(o => sanitizeString(o, MAX.GENERIC_TEXT)),
      correct:  q.correct,
    }))

  if (questions.length === 0) return NextResponse.json({ error: 'Geçerli soru bulunamadı.' }, { status: 500 })

  return NextResponse.json({ result: { questions }, remaining: remaining - 1 })
}
