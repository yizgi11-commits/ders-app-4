-- ═══════════════════════════════════════════════════════════════
-- Study Planner — Database Migration
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── User Study Preferences ───────────────────────────────────────
create table if not exists study_preferences (
  id                  uuid        default gen_random_uuid() primary key,
  user_id             uuid        references auth.users(id) on delete cascade not null unique,
  daily_study_mins    int         not null default 120,
  intensity           text        not null default 'normal'
                                  check (intensity in ('light', 'normal', 'intense')),
  start_hour          int         not null default 16,
  subject_priorities  jsonb       not null default '[]',
  weak_subjects       jsonb       not null default '[]',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table study_preferences enable row level security;
create policy "study_prefs_all" on study_preferences for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Schedule Blocks ──────────────────────────────────────────────
create table if not exists schedule_blocks (
  id            uuid        default gen_random_uuid() primary key,
  user_id       uuid        references auth.users(id) on delete cascade not null,
  date          date        not null,
  start_time    text        not null,       -- 'HH:MM'
  end_time      text        not null,
  block_type    text        not null default 'study'
                            check (block_type in ('study', 'pomodoro', 'break', 'review')),
  subject_id    uuid        references subjects(id) on delete set null,
  subject_name  text,
  topic_hint    text,
  status        text        not null default 'pending'
                            check (status in ('pending', 'completed', 'skipped')),
  sort_order    int         not null default 0,
  created_at    timestamptz default now()
);

create index if not exists schedule_blocks_user_date on schedule_blocks(user_id, date, sort_order);

alter table schedule_blocks enable row level security;
create policy "schedule_blocks_all" on schedule_blocks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
