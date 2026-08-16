-- ═══════════════════════════════════════════════════════════════
-- Noetic OS — schedule the app_cache cleanup that was never wired up
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════
--
-- cleanup_expired_cache() (supabase/cache_and_usage.sql) has existed
-- since the caching system was introduced, with a comment saying to
-- call it "once a week via a cron or pg_cron" — nothing ever did.
-- app_cache has grown unbounded ever since (every dashboard-stats,
-- weekly-progress, analytics-data, ai-stats and noetic-insight write
-- adds a row that's never removed once expired). This schedules it.
--
-- Safe to re-run: unschedules any existing job with the same name
-- before creating it, so running this migration twice won't create
-- duplicate cron entries.

create extension if not exists pg_cron with schema extensions;

select cron.unschedule(jobid)
from cron.job
where jobname = 'noetic-cleanup-expired-cache';

select cron.schedule(
  'noetic-cleanup-expired-cache',
  '0 4 * * 0',              -- every Sunday at 04:00 UTC
  $$ select cleanup_expired_cache(); $$
);
