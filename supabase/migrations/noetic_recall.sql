-- ═══════════════════════════════════════════════════════════════
-- Noetic OS Recall — graded review history
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- flashcards previously kept only a `review_count` tally, so there was
-- no way to tell a card that was always answered "Easy" from one that
-- was repeatedly failed. Recall analytics (success rate, hardest
-- topics, weekly completion) all need the individual outcomes.
create table if not exists recall_reviews (
  id            uuid        default gen_random_uuid() primary key,
  user_id       uuid        references auth.users(id) on delete cascade not null,
  flashcard_id  uuid        references flashcards(id) on delete cascade not null,
  topic_id      uuid        references topics(id)     on delete set null,
  subject_id    uuid        references subjects(id)   on delete set null,
  grade         text        not null check (grade in ('again', 'hard', 'good', 'easy')),
  interval_days int         not null,
  reviewed_at   timestamptz not null default now()
);

alter table recall_reviews enable row level security;
create policy "recall_reviews_all" on recall_reviews for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists recall_reviews_user_date  on recall_reviews(user_id, reviewed_at desc);
create index if not exists recall_reviews_topic_idx  on recall_reviews(user_id, topic_id);
create index if not exists recall_reviews_card_idx   on recall_reviews(flashcard_id);

-- Denormalised "last studied" so the queue can show it without a
-- per-topic aggregate over the whole review history.
alter table flashcards
  add column if not exists last_reviewed_at timestamptz;
