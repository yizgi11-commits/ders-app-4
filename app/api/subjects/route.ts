import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/subjects — list all subjects with topics + analytics
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('*, topics(*)')
    .eq('user_id', user.id)
    .order('sort_order')
    .order('sort_order', { referencedTable: 'topics' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Gather per-subject analytics from task_templates + daily_tasks
  const subjectNames = (subjects ?? []).map((s: { name: string }) => s.name)

  let analytics: Record<string, { tasksCompleted: number; xpEarned: number }> = {}

  if (subjectNames.length > 0) {
    const { data: taskData } = await supabase
      .from('daily_tasks')
      .select('xp_earned, task_templates(subject)')
      .eq('user_id', user.id)
      .eq('completed', true)

    analytics = {}
    ;(taskData ?? []).forEach((row: { xp_earned: number; task_templates: { subject: string }[] | { subject: string } | null }) => {
      const tmpl = Array.isArray(row.task_templates) ? row.task_templates[0] : row.task_templates
      const sub = tmpl?.subject ?? ''
      if (!analytics[sub]) analytics[sub] = { tasksCompleted: 0, xpEarned: 0 }
      analytics[sub].tasksCompleted++
      analytics[sub].xpEarned += row.xp_earned
    })
  }

  return NextResponse.json({
    subjects: subjects ?? [],
    analytics,
  })
}

// POST /api/subjects — create new subject
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const name  = String(body.name ?? '').trim()
  const icon  = String(body.icon ?? '📚')
  const color = String(body.color ?? '#6366f1')

  if (!name) return NextResponse.json({ error: 'İsim gerekli' }, { status: 400 })

  // Get next sort_order
  const { count } = await supabase
    .from('subjects')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { data, error } = await supabase
    .from('subjects')
    .insert({
      user_id:    user.id,
      name,
      icon,
      color,
      sort_order: (count ?? 0),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/subjects — update subject
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

  const { data, error } = await supabase
    .from('subjects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/subjects — delete subject
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const { id } = body

  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
