import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/notes/folders
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data, error } = await supabase
    .from('note_folders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ folders: data ?? [] })
}

// POST /api/notes/folders
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body  = await req.json()
  const name  = String(body.name ?? '').trim()
  const color = String(body.color ?? 'indigo')
  const icon  = String(body.icon ?? '📁')

  if (!name) return NextResponse.json({ error: 'İsim gerekli' }, { status: 400 })

  const { data, error } = await supabase
    .from('note_folders')
    .insert({ user_id: user.id, name, color, icon })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
