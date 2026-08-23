-- ═══════════════════════════════════════════════════════════════
-- Noetic OS — Performance indexes
-- Run in Supabase SQL Editor
--
-- Only covers gaps confirmed against actual query patterns in the
-- codebase (grepped every .eq/.gte/.lte/.order on these tables).
-- flashcards(user_id, next_review_date), daily_focus_time(user_id, date)
-- and recall_reviews(user_id, reviewed_at) already exist (flashcards.sql,
-- pomodoro.sql, noetic_recall.sql) and already cover every read pattern
-- found — not repeated here to avoid duplicate indexes.
-- ═══════════════════════════════════════════════════════════════

-- daily_tasks: `completed` is filtered standalone in several hot paths
-- (today's-tasks-done check, weekly completion count) but wasn't part
-- of the existing (user_id, date) index.
create index if not exists daily_tasks_user_date_completed_idx
  on daily_tasks (user_id, date, completed);

-- pomodoro_sessions: nearly every read filters status = 'completed'
-- alongside user_id + started_at, which the existing (user_id, started_at)
-- index doesn't help narrow.
create index if not exists pomodoro_sessions_user_status_date_idx
  on pomodoro_sessions (user_id, status, started_at desc);

-- pomodoro_sessions: the Atlas topic page filters user_id + topic_id +
-- status together; the existing topic_id index isn't composited with
-- either of those.
create index if not exists pomodoro_sessions_user_topic_status_idx
  on pomodoro_sessions (user_id, topic_id, status);

-- recall_reviews: grade-breakdown stats (again/hard/good/easy counts)
-- filter user_id + grade with no date range, not well served by the
-- existing (user_id, reviewed_at) index.
create index if not exists recall_reviews_user_grade_idx
  on recall_reviews (user_id, grade);
