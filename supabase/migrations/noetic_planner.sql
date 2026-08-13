-- ═══════════════════════════════════════════════════════════════
-- Noetic OS Planner — user-created tasks, goals, exams
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── daily_tasks: allow Planner-created rows alongside the ──────
-- ── system-generated (task_templates) gamification rows.    ──
alter table daily_tasks alter column template_id drop not null;

alter table daily_tasks
  add column if not exists subject_id       uuid references subjects(id) on delete set null,
  add column if not exists topic_id         uuid references topics(id) on delete set null,
  add column if not exists topic_text       text,
  add column if not exists duration_minutes int,
  add column if not exists priority         text check (priority in ('high', 'medium', 'low')),
  add column if not exists source           text not null default 'system'
                                             check (source in ('system', 'planner'));

create index if not exists daily_tasks_source_idx on daily_tasks(user_id, source, date);

-- ── Goals ────────────────────────────────────────────────────
create table if not exists goals (
  id                  uuid        default gen_random_uuid() primary key,
  user_id             uuid        references auth.users(id) on delete cascade not null,
  title               text        not null,
  subject_id          uuid        references subjects(id) on delete set null,
  topic_id            uuid        references topics(id) on delete set null,  -- optional Atlas link (post-Phase 5)
  deadline            date,
  manual_progress_pct int         not null default 0 check (manual_progress_pct between 0 and 100),
  completed           boolean     not null default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table goals enable row level security;
create policy "goals_all" on goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists goals_user_idx on goals(user_id, deadline);

-- ── Exams ────────────────────────────────────────────────────
create table if not exists exams (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  name        text        not null,
  exam_date   date        not null,
  subject_id  uuid        references subjects(id) on delete set null,
  created_at  timestamptz default now()
);

alter table exams enable row level security;
create policy "exams_all" on exams for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists exams_user_date_idx on exams(user_id, exam_date);
