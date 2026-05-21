-- ═══════════════════════════════════════════════════════════════
-- Study OS — Gamification Schema Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. user_achievements ────────────────────────────────────────
create table if not exists user_achievements (
  id             uuid        default gen_random_uuid() primary key,
  user_id        uuid        references auth.users(id) on delete cascade not null,
  achievement_id text        not null,
  unlocked_at    timestamptz default now() not null,
  xp_rewarded    int         default 0 not null,
  unique(user_id, achievement_id)
);

create index if not exists user_achievements_user_idx on user_achievements(user_id);

-- RLS
alter table user_achievements enable row level security;

create policy "Users can read own achievements"
  on user_achievements for select
  using (auth.uid() = user_id);

create policy "Users can insert own achievements"
  on user_achievements for insert
  with check (auth.uid() = user_id);

-- ── 2. daily_goals ──────────────────────────────────────────────
create table if not exists daily_goals (
  id                   uuid  default gen_random_uuid() primary key,
  user_id              uuid  references auth.users(id) on delete cascade not null,
  date                 date  default current_date not null,
  focus_minutes_goal   int   default 60  not null check (focus_minutes_goal > 0),
  pomodoro_goal        int   default 4   not null check (pomodoro_goal > 0),
  tasks_goal           int   default 3   not null check (tasks_goal > 0),
  created_at           timestamptz default now(),
  unique(user_id, date)
);

create index if not exists daily_goals_user_date_idx on daily_goals(user_id, date);

-- RLS
alter table daily_goals enable row level security;

create policy "Users can manage own daily goals"
  on daily_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 3. increment_xp RPC (safe atomic increment) ─────────────────
-- Called from checkAndUnlockAchievements to award achievement XP
create or replace function increment_xp(p_user_id uuid, p_amount int)
returns void
language plpgsql
security definer
as $$
begin
  update user_xp
  set
    total_xp   = total_xp + p_amount,
    level      = greatest(1, floor(sqrt(total_xp + p_amount) / 10 + 1)::int),
    updated_at = now()
  where user_id = p_user_id;
end;
$$;

-- ── 4. Verify existing tables exist (informational only) ────────
-- These should already exist from your previous migrations:
--   user_xp, user_streaks, study_statistics,
--   daily_focus_time, pomodoro_sessions, daily_tasks
