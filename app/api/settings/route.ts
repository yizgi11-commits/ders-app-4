import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sanitizeString, MAX, safeError, logWriteError } from '@/lib/security'

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
    const { error } = await supabase.auth.updateUser({
      data: { ad: sanitizeString(body.ad, MAX.DISPLAY_NAME) },
    })
    if (error) return safeError(error, 'Ad güncellenemedi')
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

  const { error } = await supabase
    .from('user_profiles')
    .update(profileUpdates)
    .eq('user_id', user.id)

  if (error) return safeError(error, 'Ayarlar kaydedilemedi')

  return NextResponse.json({ success: true })
}

// Deletion order matters: children before parents, so a table without
// an `on delete cascade` FK back to something earlier in this list
// doesn't fail with a foreign-key violation (e.g. recall_reviews/
// flashcards before topics/subjects; account-level rows last).
const USER_DATA_TABLES = [
  'user_events', 'recall_reviews', 'flashcards', 'notes', 'note_folders',
  'documents', 'pomodoro_sessions', 'daily_focus_time', 'study_statistics',
  'daily_tasks', 'goals', 'exams', 'schedule_blocks', 'subjects', 'topics',
  'user_xp', 'user_streaks', 'user_achievements', 'daily_goals',
  'study_preferences', 'app_cache', 'ai_insights', 'user_profiles',
] as const

// DELETE /api/settings — hesap sil
// Actually deletes every row the user owns, then (only if a service-role
// key is configured — this app normally runs on the anon key alone, see
// lib/supabase/server.ts) removes the auth.users row itself via the
// Admin API. Without a service-role key the auth account can't be
// removed this way, so we still fully wipe the user's data and sign
// them out — there's just an empty, data-less auth row left behind.
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const failedTables: string[] = []
  for (const table of USER_DATA_TABLES) {
    const { error } = await supabase.from(table).delete().eq('user_id', user.id)
    if (error) {
      logWriteError(`account delete: ${table}`, error)
      failedTables.push(table)
    }
  }

  let authDeleted = false
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (serviceRoleKey && supabaseUrl) {
    try {
      const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const { error } = await admin.auth.admin.deleteUser(user.id)
      if (error) logWriteError('account delete: auth.admin.deleteUser', error)
      else authDeleted = true
    } catch (err) {
      logWriteError('account delete: admin client', err)
    }
  }

  await supabase.auth.signOut()

  if (failedTables.length > 0) {
    return NextResponse.json({
      success: false,
      message: 'Hesabının verilerinin bir kısmı silinemedi. Tekrar dene veya destekle iletişime geç.',
      failed_tables: failedTables,
      auth_deleted: authDeleted,
    }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: authDeleted
      ? 'Hesabın ve tüm verilerin kalıcı olarak silindi.'
      : 'Hesabının verileri silindi.',
    auth_deleted: authDeleted,
  })
}
