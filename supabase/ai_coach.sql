-- ═══════════════════════════════════════════════════════════════
-- AI Study Coach — Database Migration
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── AI Insights Cache ────────────────────────────────────────────
create table if not exists ai_insights (
  id           uuid         default gen_random_uuid() primary key,
  user_id      uuid         references auth.users(id) on delete cascade not null,
  insight_type text         not null,  -- 'daily' | 'weekly' | 'recommendations'
  cache_key    text         not null,  -- 'YYYY-MM-DD' or 'YYYY-Www'
  content      jsonb        not null,
  generated_at timestamptz  default now() not null,
  unique(user_id, insight_type, cache_key)
);

create index if not exists ai_insights_user_idx on ai_insights(user_id, insight_type, cache_key);

alter table ai_insights enable row level security;

create policy "Users can read own ai_insights"
  on ai_insights for select
  using (auth.uid() = user_id);

create policy "Users can insert own ai_insights"
  on ai_insights for insert
  with check (auth.uid() = user_id);

create policy "Users can update own ai_insights"
  on ai_insights for update
  using (auth.uid() = user_id);

-- ── Gamification: user_achievements ─────────────────────────────
create table if not exists user_achievements (
  id             uuid         default gen_random_uuid() primary key,
  user_id        uuid         references auth.users(id) on delete cascade not null,
  achievement_id text         not null,
  unlocked_at    timestamptz  default now() not null,
  xp_rewarded    int          default 0 not null,
  unique(user_id, achievement_id)
);

create index if not exists user_achievements_user_idx on user_achievements(user_id);

alter table user_achievements enable row level security;

create policy "Users can read own achievements"
  on user_achievements for select
  using (auth.uid() = user_id);

create policy "Users can insert own achievements"
  on user_achievements for insert
  with check (auth.uid() = user_id);

-- ── Daily Goals ──────────────────────────────────────────────────
create table if not exists daily_goals (
  id                   uuid   default gen_random_uuid() primary key,
  user_id              uuid   references auth.users(id) on delete cascade not null,
  date                 date   default current_date not null,
  focus_minutes_goal   int    default 60 not null,
  pomodoro_goal        int    default 4  not null,
  tasks_goal           int    default 3  not null,
  created_at           timestamptz default now(),
  unique(user_id, date)
);

alter table daily_goals enable row level security;

create policy "Users can manage own daily_goals"
  on daily_goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── increment_xp RPC (used by achievement system) ────────────────
create or replace function increment_xp(p_user_id uuid, p_amount int)
returns void
language plpgsql security definer
as $$
begin
  update user_xp
  set
    total_xp   = total_xp + p_amount,
    updated_at = now()
  where user_id = p_user_id;
end;
$$;
