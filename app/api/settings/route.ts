import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeString, MAX } from '@/lib/security'

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
      data: { ad: sanitizeString(body.ad, MAX.DISPLAY_NAME) },
    })
  }

  // Update profile
  const profileUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.study_goal       !== undefined) profileUpdates.study_goal      = sanitizeString(body.study_goal, MAX.ENUM_VALUE)
  if (body.exam_type        !== undefined) profileUpdates.exam_type       = sanitizeString(body.exam_type, MAX.ENUM_VALUE)
  if (body.daily_available_mins !== undefined) {
    const mins = Number(body.daily_available_mins)
    profileUpdates.daily_available_mins = Number.isFinite(mins) ? Math.min(Math.max(Math.round(mins), 0), 1440) : 120
  }
  if (body.preferred_hours  !== undefined) profileUpdates.preferred_hours = sanitizeString(body.preferred_hours, MAX.ENUM_VALUE)
  if (body.focus_intensity  !== undefined) profileUpdates.focus_intensity = sanitizeString(body.focus_intensity, MAX.ENUM_VALUE)

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
