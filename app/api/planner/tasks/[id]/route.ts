import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateUUID, safeError } from '@/lib/security'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/planner/tasks/[id]
// Body: { completed?: boolean }
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params
  if (!validateUUID(id)) return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (typeof body.completed === 'boolean') {
    updates.completed = body.completed
    updates.completed_at = body.completed ? new Date().toISOString() : null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('daily_tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('source', 'planner')
    .select('*, subjects(id, name, icon, color), topics(id, title)')
    .single()

  if (error) return safeError(error, 'Görev güncellenemedi')
  return NextResponse.json(data)
}

// DELETE /api/planner/tasks/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params
  if (!validateUUID(id)) return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

  const { error } = await supabase
    .from('daily_tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('source', 'planner')

  if (error) return safeError(error, 'Görev silinemedi')
  return new NextResponse(null, { status: 204 })
}
