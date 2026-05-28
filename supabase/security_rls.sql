-- ================================================================
-- Security RLS Verification + Hardening Migration
-- Run in Supabase SQL Editor
-- ================================================================

-- ── Verify & enable RLS on all user tables ───────────────────────
ALTER TABLE IF EXISTS subjects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS topics            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS note_folders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS flashcards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daily_tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS task_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedule_blocks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daily_focus_time  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS daily_goals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study_statistics  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_streaks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS achievements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS api_usage         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_cache         ENABLE ROW LEVEL SECURITY;

-- ── Drop and re-create policies to ensure correctness ────────────

-- subjects
DROP POLICY IF EXISTS "Users manage own subjects" ON subjects;
CREATE POLICY "Users manage own subjects" ON subjects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- topics
DROP POLICY IF EXISTS "Users manage own topics" ON topics;
CREATE POLICY "Users manage own topics" ON topics
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- notes
DROP POLICY IF EXISTS "Users manage own notes" ON notes;
CREATE POLICY "Users manage own notes" ON notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- note_folders
DROP POLICY IF EXISTS "Users manage own note_folders" ON note_folders;
CREATE POLICY "Users manage own note_folders" ON note_folders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- flashcards
DROP POLICY IF EXISTS "Users manage own flashcards" ON flashcards;
CREATE POLICY "Users manage own flashcards" ON flashcards
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- daily_tasks
DROP POLICY IF EXISTS "Users manage own daily_tasks" ON daily_tasks;
CREATE POLICY "Users manage own daily_tasks" ON daily_tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- task_templates
DROP POLICY IF EXISTS "Users manage own task_templates" ON task_templates;
CREATE POLICY "Users manage own task_templates" ON task_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- schedule_blocks
DROP POLICY IF EXISTS "Users manage own schedule_blocks" ON schedule_blocks;
CREATE POLICY "Users manage own schedule_blocks" ON schedule_blocks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- pomodoro_sessions
DROP POLICY IF EXISTS "Users manage own pomodoro_sessions" ON pomodoro_sessions;
CREATE POLICY "Users manage own pomodoro_sessions" ON pomodoro_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- daily_focus_time
DROP POLICY IF EXISTS "Users manage own daily_focus_time" ON daily_focus_time;
CREATE POLICY "Users manage own daily_focus_time" ON daily_focus_time
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- daily_goals
DROP POLICY IF EXISTS "Users manage own daily_goals" ON daily_goals;
CREATE POLICY "Users manage own daily_goals" ON daily_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- study_statistics
DROP POLICY IF EXISTS "Users manage own study_statistics" ON study_statistics;
CREATE POLICY "Users manage own study_statistics" ON study_statistics
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_streaks
DROP POLICY IF EXISTS "Users manage own user_streaks" ON user_streaks;
CREATE POLICY "Users manage own user_streaks" ON user_streaks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- achievements
DROP POLICY IF EXISTS "Users manage own achievements" ON achievements;
CREATE POLICY "Users manage own achievements" ON achievements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- api_usage (read-only for user, insert via server)
DROP POLICY IF EXISTS "Users read own api_usage" ON api_usage;
CREATE POLICY "Users read own api_usage" ON api_usage
  FOR SELECT USING (auth.uid() = user_id);

-- api_usage insert: allow authenticated users to insert their own rows
DROP POLICY IF EXISTS "Users insert own api_usage" ON api_usage;
CREATE POLICY "Users insert own api_usage" ON api_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- app_cache
DROP POLICY IF EXISTS "Users manage own app_cache" ON app_cache;
CREATE POLICY "Users manage own app_cache" ON app_cache
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Storage bucket 'pdfs': ensure private, user-scoped ───────────
-- Buckets are managed in the Supabase dashboard or via storage API.
-- The policies below assume bucket 'pdfs' exists and is NOT public.

-- Allow users to upload only to their own folder
DROP POLICY IF EXISTS "Users upload own PDFs" ON storage.objects;
CREATE POLICY "Users upload own PDFs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to read only their own PDFs
DROP POLICY IF EXISTS "Users read own PDFs" ON storage.objects;
CREATE POLICY "Users read own PDFs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own PDFs
DROP POLICY IF EXISTS "Users delete own PDFs" ON storage.objects;
CREATE POLICY "Users delete own PDFs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
