import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDaySchedule, generateWeekSchedule } from '@/lib/planner/generate'
import type { StudyIntensity, ScheduleBlock, StudyPreferences, GenerateInput } from '@/lib/planner/types'

// ─── GET /api/planner?date=YYYY-MM-DD ────────────────────────────
// Returns schedule blocks for the given date (or today)
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const dateParam = req.nextUrl.searchParams.get('date')
  const date = dateParam ?? new Date().toISOString().split('T')[0]
  const weekMode = req.nextUrl.searchParams.get('week') === '1'

  // Get blocks
  if (weekMode) {
    // Get entire week
    const weekStart = getWeekStart(date)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEndStr = weekEnd.toISOString().split('T')[0]
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const { data: blocks } = await supabase
      .from('schedule_blocks')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekStartStr)
      .lte('date', weekEndStr)
      .order('date')
      .order('sort_order')

    // Also get preferences
    const { data: prefs } = await supabase
      .from('study_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({ blocks: blocks ?? [], preferences: prefs })
  }

  const { data: blocks } = await supabase
    .from('schedule_blocks')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .order('sort_order')

  // Also get preferences
  const { data: prefs } = await supabase
    .from('study_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ blocks: blocks ?? [], preferences: prefs })
}

// ─── POST /api/planner — Generate schedule for a date/week ───────
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body = await req.json()
  const date           = body.date ?? new Date().toISOString().split('T')[0]
  const weekMode       = body.week === true
  const dailyStudyMins = Number(body.daily_study_mins) || 120
  const intensity      = (body.intensity ?? 'normal') as StudyIntensity
  const startHour      = Number(body.start_hour) || 16
  const subjectPriorities: string[] = body.subject_priorities ?? []
  const weakSubjects: string[] = body.weak_subjects ?? []

  // Save/update preferences
  await supabase.from('study_preferences').upsert({
    user_id:             user.id,
    daily_study_mins:    dailyStudyMins,
    intensity,
    start_hour:          startHour,
    subject_priorities:  subjectPriorities,
    weak_subjects:       weakSubjects,
    updated_at:          new Date().toISOString(),
  }, { onConflict: 'user_id' })

  // Fetch user's subjects with topics
  const { data: dbSubjects } = await supabase
    .from('subjects')
    .select('id, name, icon, color, topics(title, status)')
    .eq('user_id', user.id)
    .order('sort_order')

  const subjects: GenerateInput['subjects'] = (dbSubjects ?? []).map((s: any, idx: number) => {
    const prioIdx = subjectPriorities.indexOf(s.id)
    return {
      id:   s.id,
      name: s.name,
      icon: s.icon,
      color: s.color,
      priority: prioIdx >= 0 ? prioIdx + 1 : idx + 100,
      isWeak: weakSubjects.includes(s.id),
      needsReviewTopics: (s.topics ?? [])
        .filter((t: { status: string }) => t.status === 'needs_review')
        .map((t: { title: string }) => t.title),
    }
  })

  const baseInput = { dailyStudyMins, intensity, startHour, subjects }

  if (weekMode) {
    const weekStart = getWeekStart(date)
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    // Delete existing blocks for the week
    await supabase
      .from('schedule_blocks')
      .delete()
      .eq('user_id', user.id)
      .gte('date', weekStartStr)
      .lte('date', weekEndStr)

    const weekSchedules = generateWeekSchedule(baseInput, weekStartStr)

    // Insert all blocks
    const allBlocks = weekSchedules.flatMap(day =>
      day.blocks.map(b => ({ ...b, user_id: user.id }))
    )

    if (allBlocks.length > 0) {
      await supabase.from('schedule_blocks').insert(allBlocks)
    }

    // Fetch back
    const { data: freshBlocks } = await supabase
      .from('schedule_blocks')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekStartStr)
      .lte('date', weekEndStr)
      .order('date')
      .order('sort_order')

    return NextResponse.json({ blocks: freshBlocks ?? [], generated: true })
  }

  // Single day
  await supabase
    .from('schedule_blocks')
    .delete()
    .eq('user_id', user.id)
    .eq('date', date)

  const schedule = generateDaySchedule({ ...baseInput, date })

  if (schedule.blocks.length > 0) {
    await supabase.from('schedule_blocks').insert(
      schedule.blocks.map(b => ({ ...b, user_id: user.id }))
    )
  }

  const { data: freshBlocks } = await supabase
    .from('schedule_blocks')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .order('sort_order')

  return NextResponse.json({ blocks: freshBlocks ?? [], generated: true })
}

// ─── PATCH /api/planner — Update block status ────────────────────
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id, status, sort_order } = await req.json()
  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (status) updates.status = status
  if (typeof sort_order === 'number') updates.sort_order = sort_order

  const { data, error } = await supabase
    .from('schedule_blocks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Plan güncellenemedi' }, { status: 500 })
  return NextResponse.json(data)
}

// ── Helper ──
function getWeekStart(dateStr: string): Date {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1 // Monday=0
  d.setDate(d.getDate() - diff)
  return d
}
