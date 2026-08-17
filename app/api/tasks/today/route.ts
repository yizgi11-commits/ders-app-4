import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTodaysSystemTasks } from "@/lib/tasks/generator";

// GET /api/tasks/today
// Returns today's tasks (generates them if they don't exist yet).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  try {
    const { tasks, userXp, userStreak } = await getTodaysSystemTasks(supabase, user.id);
    return NextResponse.json({ tasks, userXp, userStreak });
  } catch {
    return NextResponse.json({ error: "Görevler alınamadı" }, { status: 500 });
  }
}
