import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeString, safeError, MAX } from '@/lib/security'

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

  if (error) return safeError(error, 'Klasörler alınamadı')
  return NextResponse.json({ folders: data ?? [] })
}

// POST /api/notes/folders
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body  = await req.json()
  const name  = sanitizeString(body.name ?? '', MAX.FOLDER_NAME)
  const color = sanitizeString(body.color ?? 'indigo', 30)
  const icon  = sanitizeString(body.icon ?? '📁', 10)

  if (!name) return NextResponse.json({ error: 'İsim gerekli' }, { status: 400 })

  const { data, error } = await supabase
    .from('note_folders')
    .insert({ user_id: user.id, name, color, icon })
    .select()
    .single()

  if (error) return safeError(error, 'Klasör oluşturulamadı')
  return NextResponse.json(data, { status: 201 })
}
