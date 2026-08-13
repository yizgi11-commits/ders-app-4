import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeString, validateUUID, safeError, MAX } from '@/lib/security'

// GET /api/exams?upcoming=1&limit=5 — list exams (optionally only upcoming, soonest first)
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const upcoming = searchParams.get('upcoming') === '1'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)

  let query = supabase
    .from('exams')
    .select('*, subjects(id, name, icon, color)')
    .eq('user_id', user.id)
    .order('exam_date', { ascending: true })
    .limit(limit)

  if (upcoming) query = query.gte('exam_date', new Date().toISOString().split('T')[0])

  const { data, error } = await query
  if (error) return safeError(error, 'Sınavlar alınamadı')

  return NextResponse.json({ exams: data ?? [] })
}

// POST /api/exams
// Body: { name, exam_date, subject_id? }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const name = sanitizeString(body.name ?? '', MAX.GOAL_TEXT)
  const examDate = sanitizeString(body.exam_date ?? '', 10)
  const subjectId = body.subject_id && validateUUID(body.subject_id) ? body.subject_id : null

  if (!name || !examDate) {
    return NextResponse.json({ error: 'Ad ve tarih gerekli' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('exams')
    .insert({ user_id: user.id, name, exam_date: examDate, subject_id: subjectId })
    .select('*, subjects(id, name, icon, color)')
    .single()

  if (error) return safeError(error, 'Sınav oluşturulamadı')
  return NextResponse.json(data, { status: 201 })
}
