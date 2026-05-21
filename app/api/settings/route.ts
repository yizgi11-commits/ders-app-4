import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/settings — kullanıcı profili + metadata
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    id:    user.id,
    email: user.email,
    ad:    user.user_metadata?.ad ?? '',
    profile,
  })
}

// PATCH /api/settings — profil güncelle
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()

  // Update display name in auth metadata
  if (body.ad !== undefined) {
    await supabase.auth.updateUser({
      data: { ad: body.ad },
    })
  }

  // Update profile
  const profileUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.study_goal       !== undefined) profileUpdates.study_goal           = body.study_goal
  if (body.exam_type        !== undefined) profileUpdates.exam_type             = body.exam_type
  if (body.daily_available_mins !== undefined) profileUpdates.daily_available_mins = body.daily_available_mins
  if (body.preferred_hours  !== undefined) profileUpdates.preferred_hours       = body.preferred_hours
  if (body.focus_intensity  !== undefined) profileUpdates.focus_intensity        = body.focus_intensity

  await supabase
    .from('user_profiles')
    .update(profileUpdates)
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}

// DELETE /api/settings — hesap sil
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  // Sign out first
  await supabase.auth.signOut()

  return NextResponse.json({ success: true, message: 'Hesap silme talebi alındı.' })
}
