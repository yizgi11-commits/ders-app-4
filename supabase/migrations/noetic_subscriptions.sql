-- ═══════════════════════════════════════════════════════════════
-- Noetic OS — Free/Pro subscription tier
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- No Stripe yet — subscription_tier is set manually (SQL Editor or a
-- future admin panel) until billing is wired up. Every user already
-- has a user_profiles row by the time they reach /dashboard (created
-- during onboarding), so DEFAULT 'free' backfills existing rows too.
alter table user_profiles
  add column if not exists subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'pro')),
  add column if not exists subscription_expires_at timestamptz;

-- To upgrade a user for testing:
--   update user_profiles set subscription_tier = 'pro',
--     subscription_expires_at = now() + interval '30 days'
--   where user_id = '<uuid>';
