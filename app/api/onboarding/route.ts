import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { OnboardingData, StudyGoal } from '@/lib/onboarding/types'
import { DEFAULT_SUBJECTS } from '@/lib/onboarding/types'

// ─── GET /api/onboarding — Check onboarding status ──────────────
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
    completed: profile?.onboarding_completed ?? false,
    step: profile?.onboarding_step ?? 0,
    profile,
  })
}

// ─── POST /api/onboarding — Complete onboarding ─────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const body: OnboardingData = await req.json()
  const dailyAvailMins = body.dailyGoalHours * 60

  // 1. Save/update profile
  await supabase.from('user_profiles').upsert({
    user_id:              user.id,
    display_name:         body.displayName || user.user_metadata?.ad || 'Öğrenci',
    study_goal:           body.studyGoal,
    grade_level:          body.gradeLevel,
    daily_available_mins: dailyAvailMins,
    onboarding_completed: true,
    onboarding_step:      6,
    updated_at:           new Date().toISOString(),
  }, { onConflict: 'user_id' })

  // 2. Create subjects for the ones the user selected (all defaults if none picked)
  const pool = DEFAULT_SUBJECTS[body.studyGoal as StudyGoal] ?? DEFAULT_SUBJECTS.ders_basarisi
  const chosen = body.subjects.length > 0
    ? pool.filter(s => body.subjects.includes(s.name))
    : pool
  const subjectRows = chosen.map((s, i) => ({
    user_id:    user.id,
    name:       s.name,
    icon:       s.icon,
    color:      s.color,
    sort_order: i,
  }))

  // Only insert if user has no subjects yet
  const { count } = await supabase
    .from('subjects')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  let subjectIds: string[] = []
  if ((count ?? 0) === 0 && subjectRows.length > 0) {
    const { data: inserted } = await supabase
      .from('subjects')
      .insert(subjectRows)
      .select('id')
    subjectIds = (inserted ?? []).map(s => s.id)
  }

  // 3. Save study preferences (incl. difficulty analysis) for the planner
  await supabase.from('study_preferences').upsert({
    user_id:            user.id,
    daily_study_mins:   dailyAvailMins,
    start_hour:         16,
    subject_priorities: subjectIds,
    weak_subjects:      [],
    difficulties:       body.difficulties,
    updated_at:         new Date().toISOString(),
  }, { onConflict: 'user_id' })

  // 4. Initialize XP + streak rows if not exist
  await Promise.all([
    supabase.from('user_xp').upsert({
      user_id:  user.id,
      total_xp: 0,
      level:    1,
    }, { onConflict: 'user_id' }),
    supabase.from('user_streaks').upsert({
      user_id:        user.id,
      current_streak: 0,
      longest_streak: 0,
    }, { onConflict: 'user_id' }),
  ])

  // 5. Set daily goals based on the target daily study hours
  const goalMap: Record<number, { focus: number; pomodoros: number; tasks: number }> = {
    1: { focus: 60,  pomodoros: 2, tasks: 2 },
    2: { focus: 120, pomodoros: 4, tasks: 3 },
    3: { focus: 180, pomodoros: 5, tasks: 4 },
    4: { focus: 240, pomodoros: 6, tasks: 5 },
  }
  const goals = goalMap[body.dailyGoalHours] ?? goalMap[2]
  const today = new Date().toISOString().split('T')[0]

  await supabase.from('daily_goals').upsert({
    user_id:             user.id,
    date:                today,
    focus_minutes_goal:  goals.focus,
    pomodoro_goal:       goals.pomodoros,
    tasks_goal:          goals.tasks,
  }, { onConflict: 'user_id,date' })

  return NextResponse.json({
    success: true,
    subjects_created: subjectIds.length,
  })
}

// ─── PATCH /api/onboarding — Save progress step ────────────────
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { step } = await req.json()

  await supabase.from('user_profiles').upsert({
    user_id:         user.id,
    onboarding_step: step,
    updated_at:      new Date().toISOString(),
  }, { onConflict: 'user_id' })

  return NextResponse.json({ step })
}
