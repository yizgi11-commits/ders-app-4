import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDailyTasks, ensureUserRecords } from "@/lib/tasks/generator";
import { nextDifficulty } from "@/lib/tasks/progression";
import type { Difficulty, UserXP } from "@/lib/tasks/types";

// GET /api/tasks/today
// Returns today's tasks (generates them if they don't exist yet).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];

  // ── Ensure user has xp + streak rows ──
  await ensureUserRecords(supabase, user.id);

  // ── Fetch user xp row ─────────────────
  const { data: userXp } = await supabase
    .from("user_xp")
    .select("*")
    .eq("user_id", user.id)
    .single<UserXP>();

  if (!userXp) return NextResponse.json({ error: "XP verisi bulunamadı" }, { status: 500 });

  // ── Progression: determine today's difficulty ──
  // If this is a new day, recalculate difficulty based on yesterday
  let difficulty = userXp.current_difficulty as Difficulty;

  if (userXp.last_active_date && userXp.last_active_date !== today) {
    // Count yesterday's completed tasks
    const { data: yesterdayTasks } = await supabase
      .from("daily_tasks")
      .select("completed")
      .eq("user_id", user.id)
      .eq("date", userXp.last_active_date);

    const completedCount = (yesterdayTasks ?? []).filter(
      (t: { completed: boolean }) => t.completed
    ).length;

    difficulty = nextDifficulty({
      current: difficulty,
      completedCount,
      totalCount: yesterdayTasks?.length ?? 3,
      lastActiveDate: userXp.last_active_date,
    });

    // Persist new difficulty
    await supabase
      .from("user_xp")
      .update({ current_difficulty: difficulty })
      .eq("user_id", user.id);
  }

  // ── Generate (or return existing) today's tasks ──
  await generateDailyTasks(supabase, user.id, difficulty);

  // ── Fetch tasks with template data ────
  const { data: tasks, error } = await supabase
    .from("daily_tasks")
    .select("*, task_templates(*)")
    .eq("user_id", user.id)
    .eq("date", today)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Fetch streak ──────────────────────
  const { data: userStreak } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // ── Re-fetch xp (may have been updated) ──
  const { data: freshXp } = await supabase
    .from("user_xp")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ tasks, userXp: freshXp, userStreak });
}
