-- ─────────────────────────────────────────────────────────────
-- Smart Notes Schema — Step 13
-- ─────────────────────────────────────────────────────────────

-- note_folders table
create table if not exists note_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text not null default 'indigo',
  icon text not null default '📁',
  created_at timestamptz default now()
);
alter table note_folders enable row level security;
create policy "Users manage own folders" on note_folders for all using (auth.uid() = user_id);

-- notes table
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  folder_id uuid references note_folders(id) on delete set null,
  subject_id uuid references subjects(id) on delete set null,
  title text not null default 'Başlıksız Not',
  content text not null default '',
  content_preview text generated always as (substring(content from 1 for 200)) stored,
  tags text[] not null default '{}',
  is_pinned boolean not null default false,
  is_archived boolean not null default false,
  is_favorite boolean not null default false,
  word_count int not null default 0,
  reading_time_mins int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table notes enable row level security;
create policy "Users manage own notes" on notes for all using (auth.uid() = user_id);
create index on notes(user_id, updated_at desc);
create index on notes using gin(to_tsvector('turkish', title || ' ' || content));

-- note_ai_results table (cache AI results)
create table if not exists note_ai_results (
  id uuid primary key default gen_random_uuid(),
  note_id uuid references notes(id) on delete cascade not null,
  type text not null, -- 'summary' | 'keypoints' | 'flashcards' | 'quiz'
  result jsonb not null,
  created_at timestamptz default now()
);
alter table note_ai_results enable row level security;
create policy "Users manage own ai results" on note_ai_results for all using (
  auth.uid() = (select user_id from notes where id = note_id)
);
