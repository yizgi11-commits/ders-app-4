import type { SupabaseClient } from "@supabase/supabase-js";
import type { Difficulty, TaskTemplate } from "./types";

const DAILY_TASK_LIMIT = 3;

// ─────────────────────────────────────────
// pickRandom — pick N distinct items
// ─────────────────────────────────────────
function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ─────────────────────────────────────────
// generateDailyTasks
//   1. Fetch all templates at the given difficulty
//   2. Exclude templates the user already had in
//      the last 7 days (avoid repetition)
//   3. Pick DAILY_TASK_LIMIT tasks at random
//   4. Insert rows into daily_tasks
//   Returns the inserted task IDs.
// ─────────────────────────────────────────
export async function generateDailyTasks(
  supabase: SupabaseClient,
  userId: string,
  difficulty: Difficulty
): Promise<string[]> {
  const today = new Date().toISOString().split("T")[0];

  // ── Already has tasks today? ──────────
  const { data: existing } = await supabase
    .from("daily_tasks")
    .select("id")
    .eq("user_id", userId)
    .eq("date", today);

  if (existing && existing.length > 0) {
    return existing.map((t: { id: string }) => t.id);
  }

  // ── Templates at this difficulty ──────
  const { data: templates, error: tErr } = await supabase
    .from("task_templates")
    .select("*")
    .eq("difficulty", difficulty);

  if (tErr || !templates || templates.length === 0) {
    throw new Error("Görev şablonları alınamadı.");
  }

  // ── Last-7-days template IDs for this user ──
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenStr = sevenDaysAgo.toISOString().split("T")[0];

  const { data: recent } = await supabase
    .from("daily_tasks")
    .select("template_id")
    .eq("user_id", userId)
    .gte("date", sevenStr);

  const recentIds = new Set((recent ?? []).map((r: { template_id: string }) => r.template_id));

  // ── Filter out recently seen ──────────
  const fresh = (templates as TaskTemplate[]).filter((t) => !recentIds.has(t.id));

  // If not enough fresh tasks, fall back to full pool
  const pool = fresh.length >= DAILY_TASK_LIMIT ? fresh : (templates as TaskTemplate[]);
  const picked = pickRandom(pool, DAILY_TASK_LIMIT);

  // ── Insert ────────────────────────────
  const rows = picked.map((t) => ({
    user_id: userId,
    template_id: t.id,
    date: today,
  }));

  const { data: inserted, error: iErr } = await supabase
    .from("daily_tasks")
    .insert(rows)
    .select("id");

  if (iErr) throw new Error("Görevler oluşturulamadı: " + iErr.message);

  return (inserted ?? []).map((r: { id: string }) => r.id);
}

// ─────────────────────────────────────────
// ensureUserXp
//   Creates the user_xp row if it doesn't exist yet.
// ─────────────────────────────────────────
export async function ensureUserRecords(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  // user_xp
  const { data: xpRow } = await supabase
    .from("user_xp")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!xpRow) {
    await supabase.from("user_xp").insert({
      user_id: userId,
      total_xp: 0,
      level: 1,
      current_difficulty: 1,
    });
  }

  // user_streaks
  const { data: streakRow } = await supabase
    .from("user_streaks")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!streakRow) {
    await supabase.from("user_streaks").insert({
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
    });
  }
}
