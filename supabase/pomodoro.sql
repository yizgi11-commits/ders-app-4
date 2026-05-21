-- ============================================================
-- Study OS — Pomodoro Schema
-- Run in Supabase SQL Editor after schema.sql
-- ============================================================

-- ─────────────────────────────────────────
-- 1. POMODORO SESSIONS
--    One row per timer session (focus or break).
-- ─────────────────────────────────────────
create table if not exists pomodoro_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid    not null references auth.users(id) on delete cascade,
  task_id          uuid             references daily_tasks(id) on delete set null,
  type             text    not null check (type in ('focus', 'short_break', 'long_break')),
  duration_seconds int     not null,
  elapsed_seconds  int     not null default 0,
  status           text    not null default 'active'
                           check (status in ('active', 'completed', 'interrupted')),
  xp_earned        int     not null default 0,
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- 2. STUDY STATISTICS
--    Cumulative totals per user.
-- ─────────────────────────────────────────
create table if not exists study_statistics (
  user_id                   uuid primary key references auth.users(id) on delete cascade,
  total_focus_minutes       int not null default 0,
  total_sessions_completed  int not null default 0,
  total_sessions_interrupted int not null default 0,
  current_session_streak    int not null default 0,
  longest_streak_sessions   int not null default 0,
  updated_at                timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- 3. DAILY FOCUS TIME
--    One row per user per day — easy queries.
-- ─────────────────────────────────────────
create table if not exists daily_focus_time (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  date               date not null default current_date,
  focus_minutes      int  not null default 0,
  sessions_completed int  not null default 0,
  unique (user_id, date)
);

-- ─────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table pomodoro_sessions  enable row level security;
alter table study_statistics   enable row level security;
alter table daily_focus_time   enable row level security;

create policy "pomodoro_sessions_select" on pomodoro_sessions
  for select using (auth.uid() = user_id);
create policy "pomodoro_sessions_insert" on pomodoro_sessions
  for insert with check (auth.uid() = user_id);
create policy "pomodoro_sessions_update" on pomodoro_sessions
  for update using (auth.uid() = user_id);

create policy "study_statistics_select" on study_statistics
  for select using (auth.uid() = user_id);
create policy "study_statistics_insert" on study_statistics
  for insert with check (auth.uid() = user_id);
create policy "study_statistics_update" on study_statistics
  for update using (auth.uid() = user_id);

create policy "daily_focus_time_select" on daily_focus_time
  for select using (auth.uid() = user_id);
create policy "daily_focus_time_insert" on daily_focus_time
  for insert with check (auth.uid() = user_id);
create policy "daily_focus_time_update" on daily_focus_time
  for update using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 5. INDEXES
-- ─────────────────────────────────────────
create index if not exists pomodoro_sessions_user_date
  on pomodoro_sessions (user_id, started_at desc);

create index if not exists daily_focus_time_user_date
  on daily_focus_time (user_id, date desc);
