-- ═══════════════════════════════════════════════════════════════
-- Noetic OS Atlas — link Vault notes to a specific topic
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

alter table notes
  add column if not exists topic_id uuid references topics(id) on delete set null;

create index if not exists notes_topic_idx on notes(topic_id);
