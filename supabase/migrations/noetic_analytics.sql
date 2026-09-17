-- ═══════════════════════════════════════════════════════════════
-- Noetic OS — Product analytics (first-party, no third-party service)
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

create table if not exists user_events (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  event_type  text        not null,
  metadata    jsonb       not null default '{}',
  created_at  timestamptz not null default now()
);

alter table user_events enable row level security;

-- Users can write and read their own events...
create policy "user_events_insert_own" on user_events
  for insert with check (auth.uid() = user_id);
create policy "user_events_select_own" on user_events
  for select using (auth.uid() = user_id);

-- ...and the app owner can read everyone's, for the admin analytics
-- route — no service-role key involved (this app doesn't use one, see
-- lib/supabase/server.ts), just an RLS policy scoped to one email.
-- Postgres unions multiple permissive SELECT policies, so this adds
-- to (not replaces) the own-row policy above.
create policy "user_events_admin_select_all" on user_events
  for select using (auth.email() = 'yizgi11@gmail.com');

-- No update/delete policy — events are an immutable log, same pattern
-- as api_usage.

create index if not exists user_events_user_type_idx
  on user_events (user_id, event_type, created_at desc);
create index if not exists user_events_type_created_idx
  on user_events (event_type, created_at desc);
