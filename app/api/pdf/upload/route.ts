import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/pdf/upload
// Accepts multipart/form-data: file (PDF), subject_id (optional)
// Returns: { text, path, name, size }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'PDF dosyası gerekli' }, { status: 400 })

  // Check both MIME type AND file extension (defense in depth)
  const hasValidMime = file.type === 'application/pdf'
  const hasValidExt  = file.name.toLowerCase().endsWith('.pdf')
  if (!hasValidMime || !hasValidExt) {
    return NextResponse.json({ error: 'Sadece PDF dosyaları kabul edilir' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'PDF 10 MB\'dan küçük olmalıdır' }, { status: 400 })
  }

  // ── Extract text from PDF ──────────────────────────────────────
  const buffer = Buffer.from(await file.arrayBuffer())
  let extractedText = ''

  try {
    // Dynamic import to avoid Next.js edge runtime issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
    const parsed = await pdfParse(buffer)
    extractedText = parsed.text
      .replace(/\s+/g, ' ')         // collapse whitespace
      .replace(/\n{3,}/g, '\n\n')   // max 2 consecutive newlines
      .trim()
  } catch {
    return NextResponse.json({ error: 'PDF metni okunamadı. Lütfen farklı bir PDF deneyin.' }, { status: 422 })
  }

  if (!extractedText || extractedText.length < 50) {
    return NextResponse.json({
      error: 'PDF\'den yeterli metin çıkarılamadı. Görüntü tabanlı (taranmış) PDF\'ler desteklenmez.'
    }, { status: 422 })
  }

  // ── Upload to Supabase Storage ─────────────────────────────────
  const timestamp = Date.now()
  const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path      = `${user.id}/${timestamp}_${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('pdfs')
    .upload(path, buffer, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    // Still return text even if storage fails — user can still generate flashcards
    console.error('PDF storage error:', uploadError.message)
  }

  // Truncate text for API response (client doesn't need the full text shown)
  const previewText = extractedText.slice(0, 1500)
  // We send up to 8000 chars to Claude for flashcard generation
  const generationText = extractedText.slice(0, 8000)

  // ── Register the document so Vault can list it and Noetic Assist ──
  // ── can work on its text later (storage alone keeps no metadata). ──
  const subjectId = (formData.get('subject_id') as string | null) || null
  const topicId   = (formData.get('topic_id')   as string | null) || null

  const { data: doc } = await supabase
    .from('documents')
    .insert({
      user_id:        user.id,
      name:           file.name,
      storage_path:   uploadError ? null : path,
      size_bytes:     file.size,
      extracted_text: extractedText.slice(0, 200_000),
      subject_id:     subjectId,
      topic_id:       topicId,
    })
    .select('id')
    .single()

  return NextResponse.json({
    text:           generationText,
    preview:        previewText,
    full_length:    extractedText.length,
    path:           uploadError ? null : path,
    name:           file.name,
    size:           file.size,
    document_id:    doc?.id ?? null,
  })
}
