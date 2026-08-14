-- ═══════════════════════════════════════════════════════════════
-- Noetic OS Vault — documents registry + saved/atlas metadata
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── Documents ────────────────────────────────────────────────
-- PDFs previously lived only in the 'pdfs' storage bucket, with no
-- row anywhere and their extracted text thrown away after flashcard
-- generation. Vault's Documents tab and Noetic Assist both need the
-- text to persist, so each upload now gets a row here.
create table if not exists documents (
  id             uuid        default gen_random_uuid() primary key,
  user_id        uuid        references auth.users(id) on delete cascade not null,
  name           text        not null,
  storage_path   text,                       -- null if the storage upload failed
  size_bytes     int         not null default 0,
  extracted_text text        not null default '',
  subject_id     uuid        references subjects(id) on delete set null,
  topic_id       uuid        references topics(id) on delete set null,
  is_favorite    boolean     not null default false,
  created_at     timestamptz default now()
);

alter table documents enable row level security;
create policy "documents_all" on documents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists documents_user_idx  on documents(user_id, created_at desc);
create index if not exists documents_topic_idx on documents(topic_id);

-- ── Flashcards: mark cards as saved/starred in the Vault ─────
alter table flashcards
  add column if not exists is_favorite boolean not null default false,
  add column if not exists document_id uuid references documents(id) on delete set null;

create index if not exists flashcards_document_idx on flashcards(document_id);
