import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/ai/client'
import { logUsage } from '@/lib/ai/usage'
import { sanitizeString, safeError, MAX } from '@/lib/security'
import { checkRateLimit } from '@/lib/security/rate-limit'

// POST /api/flashcards/generate
// Body: { text, subject_id?, source_pdf?, source_pdf_name? }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  // ── Rate limit: 10 generations per day ────────────────────────
  const { allowed, remaining } = await checkRateLimit(
    supabase, user.id, '/api/flashcards/generate', 10, 24
  )
  if (!allowed) {
    return NextResponse.json(
      { error: 'Günlük kart üretme limitine ulaştınız (10/gün). Yarın tekrar deneyin.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
    )
  }

  const body = await req.json()
  const { text, subject_id, source_pdf, source_pdf_name } = body

  if (!text || text.length < 50) {
    return NextResponse.json({ error: 'Yeterli metin bulunamadı' }, { status: 400 })
  }

  // Sanitize optional string fields
  const safePdfPath = source_pdf      ? sanitizeString(source_pdf,      500)  : null
  const safePdfName = source_pdf_name ? sanitizeString(source_pdf_name, 200)  : null

  // Limit text to control token usage
  const trimmedText = String(text).slice(0, 8000)

  // ── Call Claude ────────────────────────────────────────────────
  const anthropic = getAnthropicClient()

  const prompt = `Aşağıdaki ders notundan 10-15 adet flash kart oluştur.
Her kart: ön yüz (soru veya kavram) + arka yüz (kısa, net cevap).
Türkçe yaz. Sadece JSON döndür, başka hiçbir şey yazma.

Metin:
${trimmedText}

Format:
[{"front":"...","back":"..."},...]`

  let flashcardData: { front: string; back: string }[] = []

  try {
    const msg = await anthropic.messages.create({
      model:      'claude-haiku-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = msg.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    // Log usage (non-blocking)
    void logUsage(
      supabase, user.id,
      '/api/flashcards/generate',
      msg.usage.input_tokens,
      msg.usage.output_tokens,
    )

    // Parse JSON — strip any markdown fences if Claude wraps it
    let raw = content.text.trim()
    raw = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('Response is not an array')

    flashcardData = parsed
      .filter((c: unknown) => {
        if (typeof c !== 'object' || c === null) return false
        const card = c as Record<string, unknown>
        return typeof card.front === 'string' && typeof card.back === 'string'
      })
      .slice(0, 20) // max 20 cards per generation
      .map((c: { front: string; back: string }) => ({
        front: sanitizeString(c.front, MAX.FLASHCARD_SIDE),
        back:  sanitizeString(c.back,  MAX.FLASHCARD_SIDE),
      }))
      .filter(c => c.front.length > 0 && c.back.length > 0)

  } catch (err) {
    console.error('Flashcard generation error:', err)
    return NextResponse.json({ error: 'Kartlar oluşturulamadı. Tekrar deneyin.' }, { status: 500 })
  }

  if (flashcardData.length === 0) {
    return NextResponse.json({ error: 'Geçerli kart bulunamadı.' }, { status: 500 })
  }

  // ── Insert into DB ─────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0]
  const rows = flashcardData.map(c => ({
    user_id:          user.id,
    subject_id:       subject_id || null,
    front:            c.front,
    back:             c.back,
    source_pdf:       safePdfPath,
    source_pdf_name:  safePdfName,
    next_review_date: today,
  }))

  const { data: inserted, error: insertError } = await supabase
    .from('flashcards')
    .insert(rows)
    .select()

  if (insertError) {
    return safeError(insertError, 'Kartlar kaydedilemedi.')
  }

  return NextResponse.json({
    flashcards: inserted,
    count:      inserted?.length ?? 0,
    remaining:  remaining - 1,
  })
}
