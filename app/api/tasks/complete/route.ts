import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { levelFromTotalXp } from "@/lib/tasks/xp";
import { ALL_TASKS_BONUS, streakBonus } from "@/lib/tasks/xp";
import type { UserXP, UserStreak } from "@/lib/tasks/types";
import { checkAndUnlockAchievements } from "@/lib/gamification/check";
import { invalidateDashboardCaches } from "@/lib/cache";

// POST /api/tasks/complete
// Body: { taskId: string }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await req.json();
  const taskId: string = body?.taskId;
  if (!taskId) return NextResponse.json({ error: "taskId eksik" }, { status: 400 });

  const today = new Date().toISOString().split("T")[0];

  // ── Fetch the task + template (verify ownership) ──
  const { data: task, error: tErr } = await supabase
    .from("daily_tasks")
    .select("*, task_templates(xp_reward)")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  if (tErr || !task) return NextResponse.json({ error: "Görev bulunamadı" }, { status: 404 });
  if (task.completed)  return NextResponse.json({ error: "Zaten tamamlandı" }, { status: 409 });

  const baseXp: number = task.task_templates.xp_reward;

  // ── Fetch current XP + streak ─────────
  const { data: userXp }    = await supabase.from("user_xp").select("*").eq("user_id", user.id).single<UserXP>();
  const { data: userStreak } = await supabase.from("user_streaks").select("*").eq("user_id", user.id).single<UserStreak>();

  if (!userXp || !userStreak) return NextResponse.json({ error: "Kullanıcı verisi bulunamadı" }, { status: 500 });

  // ── Mark task complete ────────────────
  await supabase
    .from("daily_tasks")
    .update({ completed: true, completed_at: new Date().toISOString(), xp_earned: baseXp })
    .eq("id", taskId);

  // ── Check if ALL tasks are now done ───
  const { data: todayTasks } = await supabase
    .from("daily_tasks")
    .select("completed")
    .eq("user_id", user.id)
    .eq("date", today);

  const allDone = (todayTasks ?? []).every((t: { completed: boolean }) => t.completed);

  // ── Calculate total XP to add ─────────
  const sBonus  = streakBonus(userStreak.current_streak);
  const aBonus  = allDone ? ALL_TASKS_BONUS : 0;
  const totalEarned = baseXp + sBonus + aBonus;

  const newTotalXp = userXp.total_xp + totalEarned;
  const oldLevel   = userXp.level;
  const newLevel   = levelFromTotalXp(newTotalXp);

  // ── Update user_xp ────────────────────
  await supabase
    .from("user_xp")
    .update({
      total_xp: newTotalXp,
      level: newLevel,
      last_active_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  // Note: completing a task no longer bumps user_streaks — the Learning
  // Streak is now driven by Focus sessions and Recall reviews only (see
  // /api/pomodoro/complete and /api/recall/review). streakBonus above
  // still reads the current streak value, it just isn't written here.

  // ── Invalidate dashboard caches + check achievements ─────────
  const [newAchievements] = await Promise.all([
    checkAndUnlockAchievements(supabase, user.id, 'task'),
    invalidateDashboardCaches(supabase, user.id),
  ])

  return NextResponse.json({
    xp_earned:            baseXp,
    bonus_xp:             sBonus + aBonus,
    total_xp:             newTotalXp,
    level:                newLevel,
    level_up:             newLevel > oldLevel,
    all_completed:        allDone,
    new_achievements:     newAchievements,
  });
}
