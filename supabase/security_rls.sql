-- ================================================================
-- Security RLS Verification + Hardening Migration
-- Run in Supabase SQL Editor
-- ================================================================

-- ── 1. Create missing tables (if not exists) ─────────────────────

CREATE TABLE IF NOT EXISTS app_cache (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cache_key  text        NOT NULL,
  data       jsonb       NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  UNIQUE(user_id, cache_key)
);

CREATE INDEX IF NOT EXISTS app_cache_lookup_idx
  ON app_cache(user_id, cache_key, expires_at);

CREATE TABLE IF NOT EXISTS api_usage (
  id         uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint   text          NOT NULL,
  model      text          NOT NULL DEFAULT 'claude-haiku-4-5',
  tokens_in  int           NOT NULL DEFAULT 0,
  tokens_out int           NOT NULL DEFAULT 0,
  cost_usd   numeric(10,6) NOT NULL DEFAULT 0,
  created_at timestamptz   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_usage_user_date_idx
  ON api_usage(user_id, created_at DESC);

-- ── 2. Enable RLS on all tables ──────────────────────────────────

ALTER TABLE subjects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_folders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_blocks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_focus_time   ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_statistics   ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights        ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_cache          ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage          ENABLE ROW LEVEL SECURITY;

-- ── 3. Policies ──────────────────────────────────────────────────

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

-- daily_tasks (drop old split policies first)
DROP POLICY IF EXISTS "daily_tasks_select" ON daily_tasks;
DROP POLICY IF EXISTS "daily_tasks_insert" ON daily_tasks;
DROP POLICY IF EXISTS "daily_tasks_update" ON daily_tasks;
DROP POLICY IF EXISTS "Users manage own daily_tasks" ON daily_tasks;
CREATE POLICY "Users manage own daily_tasks" ON daily_tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- task_templates: public read, no user_id column
DROP POLICY IF EXISTS "task_templates_read" ON task_templates;
CREATE POLICY "task_templates_read" ON task_templates
  FOR SELECT USING (true);

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
DROP POLICY IF EXISTS "Users can manage own daily goals" ON daily_goals;
DROP POLICY IF EXISTS "Users manage own daily_goals" ON daily_goals;
CREATE POLICY "Users manage own daily_goals" ON daily_goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- study_statistics
DROP POLICY IF EXISTS "Users manage own study_statistics" ON study_statistics;
CREATE POLICY "Users manage own study_statistics" ON study_statistics
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- study_preferences
DROP POLICY IF EXISTS "Users manage own study_preferences" ON study_preferences;
CREATE POLICY "Users manage own study_preferences" ON study_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_streaks
DROP POLICY IF EXISTS "user_streaks_select" ON user_streaks;
DROP POLICY IF EXISTS "user_streaks_insert" ON user_streaks;
DROP POLICY IF EXISTS "user_streaks_update" ON user_streaks;
DROP POLICY IF EXISTS "Users manage own user_streaks" ON user_streaks;
CREATE POLICY "Users manage own user_streaks" ON user_streaks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_xp
DROP POLICY IF EXISTS "user_xp_select" ON user_xp;
DROP POLICY IF EXISTS "user_xp_insert" ON user_xp;
DROP POLICY IF EXISTS "user_xp_update" ON user_xp;
DROP POLICY IF EXISTS "Users manage own user_xp" ON user_xp;
CREATE POLICY "Users manage own user_xp" ON user_xp
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_achievements
DROP POLICY IF EXISTS "Users can read own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users manage own user_achievements" ON user_achievements;
CREATE POLICY "Users manage own user_achievements" ON user_achievements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_profiles
DROP POLICY IF EXISTS "Users manage own user_profiles" ON user_profiles;
CREATE POLICY "Users manage own user_profiles" ON user_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ai_insights
DROP POLICY IF EXISTS "Users manage own ai_insights" ON ai_insights;
CREATE POLICY "Users manage own ai_insights" ON ai_insights
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- app_cache
DROP POLICY IF EXISTS "cache_all" ON app_cache;
DROP POLICY IF EXISTS "Users manage own app_cache" ON app_cache;
CREATE POLICY "Users manage own app_cache" ON app_cache
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- api_usage
DROP POLICY IF EXISTS "usage_select_own" ON api_usage;
DROP POLICY IF EXISTS "usage_insert_own" ON api_usage;
DROP POLICY IF EXISTS "Users read own api_usage" ON api_usage;
DROP POLICY IF EXISTS "Users insert own api_usage" ON api_usage;
CREATE POLICY "Users read own api_usage" ON api_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own api_usage" ON api_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── 4. Storage bucket 'pdfs': user-scoped policies ───────────────

DROP POLICY IF EXISTS "Users upload own PDFs" ON storage.objects;
CREATE POLICY "Users upload own PDFs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users read own PDFs" ON storage.objects;
CREATE POLICY "Users read own PDFs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users delete own PDFs" ON storage.objects;
CREATE POLICY "Users delete own PDFs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
