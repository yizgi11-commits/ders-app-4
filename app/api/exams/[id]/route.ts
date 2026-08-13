import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateUUID, safeError } from '@/lib/security'

type Params = { params: Promise<{ id: string }> }

// DELETE /api/exams/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params
  if (!validateUUID(id)) return NextResponse.json({ error: 'Geçersiz id' }, { status: 400 })

  const { error } = await supabase.from('exams').delete().eq('id', id).eq('user_id', user.id)
  if (error) return safeError(error, 'Sınav silinemedi')
  return new NextResponse(null, { status: 204 })
}
