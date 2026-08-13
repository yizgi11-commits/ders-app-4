-- ═══════════════════════════════════════════════════════════════
-- Noetic OS Onboarding — grade level + difficulty analysis
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

alter table user_profiles
  add column if not exists grade_level text;

alter table study_preferences
  add column if not exists difficulties jsonb not null default '[]';
