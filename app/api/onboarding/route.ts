import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { OnboardingData } from '@/lib/onboarding/types'
import { DEFAULT_SUBJECTS, HOURS_TO_START } from '@/lib/onboarding/types'
import type { StudyGoal, PreferredHours, FocusIntensity } from '@/lib/onboarding/types'

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

  // 1. Save/update profile
  await supabase.from('user_profiles').upsert({
    user_id:              user.id,
    display_name:         body.displayName || user.user_metadata?.ad || 'Öğrenci',
    study_goal:           body.studyGoal,
    exam_type:            body.examType,
    daily_available_mins: body.dailyAvailMins,
    preferred_hours:      body.preferredHours,
    focus_intensity:      body.focusIntensity,
    consistency_level:    body.consistencyLevel,
    onboarding_completed: true,
    onboarding_step:      6,
    updated_at:           new Date().toISOString(),
  }, { onConflict: 'user_id' })

  // 2. Create default subjects based on study goal
  const defaultSubs = DEFAULT_SUBJECTS[body.studyGoal as StudyGoal] ?? DEFAULT_SUBJECTS.genel_basari
  const subjectRows = defaultSubs.map((s, i) => ({
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

  // 3. Save study preferences for the planner
  const startHour = HOURS_TO_START[body.preferredHours as PreferredHours] ?? 16
  const weakSubjectIds = body.weakSubjects
    .map(name => {
      const idx = defaultSubs.findIndex(s => s.name === name)
      return idx >= 0 && subjectIds[idx] ? subjectIds[idx] : null
    })
    .filter(Boolean) as string[]

  await supabase.from('study_preferences').upsert({
    user_id:            user.id,
    daily_study_mins:   body.dailyAvailMins,
    intensity:          body.focusIntensity,
    start_hour:         startHour,
    subject_priorities: subjectIds,
    weak_subjects:      weakSubjectIds,
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

  // 5. Set daily goals based on consistency
  const goalMap: Record<string, { focus: number; pomodoros: number; tasks: number }> = {
    never:     { focus: 30,  pomodoros: 2, tasks: 2 },
    rarely:    { focus: 45,  pomodoros: 3, tasks: 3 },
    sometimes: { focus: 60,  pomodoros: 4, tasks: 3 },
    often:     { focus: 90,  pomodoros: 5, tasks: 4 },
    daily:     { focus: 120, pomodoros: 6, tasks: 5 },
  }
  const goals = goalMap[body.consistencyLevel] ?? goalMap.sometimes
  const today = new Date().toISOString().split('T')[0]

  await supabase.from('daily_goals').upsert({
    user_id:           user.id,
    date:              today,
    focus_goal:        goals.focus,
    pomodoro_goal:     goals.pomodoros,
    task_goal:         goals.tasks,
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
