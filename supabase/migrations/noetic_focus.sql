-- ═══════════════════════════════════════════════════════════════
-- Noetic OS Focus — session reflection + recall engine linkage
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- pomodoro_sessions: which ders/konu the session was about + the
-- post-session reflection captured on the Session Complete overlay.
alter table pomodoro_sessions
  add column if not exists subject_id     uuid references subjects(id) on delete set null,
  add column if not exists topic_id       uuid references topics(id) on delete set null,
  add column if not exists session_rating text,
  add column if not exists recall_text    text;

create index if not exists pomodoro_sessions_topic_idx on pomodoro_sessions(topic_id);

-- flashcards: link a card to the topic it was generated from, so the
-- Recall Engine can find (or create) "the card for this topic".
alter table flashcards
  add column if not exists topic_id uuid references topics(id) on delete set null;

create index if not exists flashcards_topic_idx on flashcards(topic_id);
