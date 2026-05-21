// ─────────────────────────────────────────
// Difficulty levels
// ─────────────────────────────────────────
export type Difficulty = 1 | 2 | 3;

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: "Kolay",
  2: "Orta",
  3: "Zor",
};

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  1: "text-green-700 bg-green-100 border-green-200",
  2: "text-amber-700 bg-amber-100 border-amber-200",
  3: "text-red-700 bg-red-100 border-red-200",
};

// ─────────────────────────────────────────
// Database row shapes (match Supabase tables)
// ─────────────────────────────────────────
export interface TaskTemplate {
  id: string;
  subject: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  xp_reward: number;
  created_at: string;
}

export interface DailyTask {
  id: string;
  user_id: string;
  template_id: string;
  date: string;           // "YYYY-MM-DD"
  completed: boolean;
  completed_at: string | null;
  xp_earned: number;
  created_at: string;
}

export interface UserXP {
  user_id: string;
  total_xp: number;
  level: number;
  current_difficulty: Difficulty;
  last_active_date: string | null;
  updated_at: string;
}

export interface UserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_streak_date: string | null;
  updated_at: string;
}

// ─────────────────────────────────────────
// API response shapes (joined data for the UI)
// ─────────────────────────────────────────
export interface DailyTaskWithTemplate extends DailyTask {
  task_templates: TaskTemplate;
}

export interface TodayTasksResponse {
  tasks: DailyTaskWithTemplate[];
  userXp: UserXP;
  userStreak: UserStreak;
}

export interface CompleteTaskResponse {
  xp_earned: number;
  total_xp: number;
  level: number;
  level_up: boolean;
  all_completed: boolean;
  bonus_xp: number;
}
