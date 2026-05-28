import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/flashcards?subject_id=&due_today=1
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const subjectId = searchParams.get('subject_id')
  const dueToday  = searchParams.get('due_today') === '1'
  const today     = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('flashcards')
    .select(`
      *,
      subjects ( id, name, icon, color )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (subjectId) query = query.eq('subject_id', subjectId)
  if (dueToday)  query = query.lte('next_review_date', today)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also return count of cards due today (for dashboard widget)
  const { count: dueCount } = await supabase
    .from('flashcards')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('next_review_date', today)

  return NextResponse.json({
    flashcards: data ?? [],
    due_count:  dueCount ?? 0,
  })
}

// POST /api/flashcards  — manual creation
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const { front, back, subject_id } = body

  if (!front?.trim() || !back?.trim()) {
    return NextResponse.json({ error: 'Ön yüz ve arka yüz zorunludur' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('flashcards')
    .insert({
      user_id:          user.id,
      subject_id:       subject_id || null,
      front:            front.trim(),
      back:             back.trim(),
      next_review_date: today,
    })
    .select(`*, subjects ( id, name, icon, color )`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
