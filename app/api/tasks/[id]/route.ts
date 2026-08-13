import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateUUID, safeError } from '@/lib/security'

type Params = { params: Promise<{ id: string }> }

// GET /api/tasks/[id] — a single daily_task (system or planner sourced),
// used by Focus to resolve subject/topic when arriving via ?task=<id>.
export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params
  if (!validateUUID(id)) return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

  const { data, error } = await supabase
    .from('daily_tasks')
    .select('*, subjects(id, name, icon, color), topics(id, title), task_templates(subject, title)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return safeError(error, 'Görev bulunamadı', 404)
  return NextResponse.json(data)
}
