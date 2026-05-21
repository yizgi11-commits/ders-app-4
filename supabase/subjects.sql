-- ═══════════════════════════════════════════════════════════════
-- Derslerim (Subjects & Topics) — Database Migration
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── Subjects ─────────────────────────────────────────────────────
create table if not exists subjects (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  name        text        not null,
  icon        text        not null default '📚',
  color       text        not null default '#6366f1',
  sort_order  int         not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists subjects_user_idx on subjects(user_id, sort_order);

alter table subjects enable row level security;

create policy "subjects_select" on subjects for select using (auth.uid() = user_id);
create policy "subjects_insert" on subjects for insert with check (auth.uid() = user_id);
create policy "subjects_update" on subjects for update using (auth.uid() = user_id);
create policy "subjects_delete" on subjects for delete using (auth.uid() = user_id);

-- ── Topics ───────────────────────────────────────────────────────
create table if not exists topics (
  id          uuid        default gen_random_uuid() primary key,
  subject_id  uuid        references subjects(id) on delete cascade not null,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  title       text        not null,
  status      text        not null default 'not_started'
                          check (status in ('not_started', 'in_progress', 'needs_review', 'completed')),
  notes       text,
  sort_order  int         not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists topics_subject_idx on topics(subject_id, sort_order);
create index if not exists topics_user_idx on topics(user_id);

alter table topics enable row level security;

create policy "topics_select" on topics for select using (auth.uid() = user_id);
create policy "topics_insert" on topics for insert with check (auth.uid() = user_id);
create policy "topics_update" on topics for update using (auth.uid() = user_id);
create policy "topics_delete" on topics for delete using (auth.uid() = user_id);
