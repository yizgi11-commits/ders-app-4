-- ═══════════════════════════════════════════════════════════════
-- Universal Cache + API Usage Tracking
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Universal app cache ───────────────────────────────────────
create table if not exists app_cache (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users(id) on delete cascade not null,
  cache_key  text        not null,
  data       jsonb       not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  unique(user_id, cache_key)
);

create index if not exists app_cache_lookup_idx
  on app_cache(user_id, cache_key, expires_at);

alter table app_cache enable row level security;
create policy "cache_all" on app_cache for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-cleanup: delete entries expired > 7 days ago
-- (call this once a week via a cron or pg_cron)
create or replace function cleanup_expired_cache()
returns void language sql security definer as $$
  delete from app_cache where expires_at < now() - interval '7 days';
$$;

-- ── 2. API usage tracking ────────────────────────────────────────
create table if not exists api_usage (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users(id) on delete cascade not null,
  endpoint   text        not null,
  model      text        not null default 'claude-haiku-4-5',
  tokens_in  int         not null default 0,
  tokens_out int         not null default 0,
  cost_usd   numeric(10,6) not null default 0,
  created_at timestamptz default now()
);

create index if not exists api_usage_user_date_idx
  on api_usage(user_id, created_at desc);

create index if not exists api_usage_date_idx
  on api_usage(created_at desc);

-- RLS: users see own usage, admins see all (via service role)
alter table api_usage enable row level security;
create policy "usage_select_own" on api_usage
  for select using (auth.uid() = user_id);
create policy "usage_insert_own" on api_usage
  for insert with check (auth.uid() = user_id);
