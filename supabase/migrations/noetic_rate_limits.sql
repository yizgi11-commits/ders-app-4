-- ═══════════════════════════════════════════════════════════════
-- Noetic OS — Atomic rate limiting
-- Run in Supabase SQL Editor
--
-- Fixes two problems with the old api_usage-based limiter:
--  1. Only AI routes ever wrote to api_usage, so limits on every other
--     route (subjects, topics, goals, exams, planner, pomodoro start,
--     pdf upload, folders) counted 0 forever and never triggered.
--  2. Usage was logged AFTER the Claude call returned, so N concurrent
--     requests all passed the count check together (check-then-act race).
--
-- consume_rate_limit() checks AND records the hit in one step, serialized
-- per (user, key) with a transaction-scoped advisory lock, so two
-- concurrent requests can never both take the last slot.
-- ═══════════════════════════════════════════════════════════════

create table if not exists rate_limit_hits (
  id          bigserial   primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  endpoint    text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists rate_limit_hits_lookup_idx
  on rate_limit_hits (user_id, endpoint, created_at desc);

alter table rate_limit_hits enable row level security;

create policy "rate_limit_hits_select_own" on rate_limit_hits
  for select using (auth.uid() = user_id);
create policy "rate_limit_hits_insert_own" on rate_limit_hits
  for insert with check (auth.uid() = user_id);
create policy "rate_limit_hits_delete_own" on rate_limit_hits
  for delete using (auth.uid() = user_id);

create or replace function consume_rate_limit(
  p_endpoint text,
  p_max      int,
  p_since    timestamptz
)
returns table (allowed boolean, remaining int)
language plpgsql
security invoker
as $$
declare
  v_user  uuid := auth.uid();
  v_count int;
begin
  if v_user is null then
    return query select false, 0;
    return;
  end if;

  -- Serialize concurrent calls for the same user+key until commit.
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':' || p_endpoint, 0));

  -- Opportunistic cleanup so the table doesn't grow forever.
  delete from rate_limit_hits
   where user_id = v_user and endpoint = p_endpoint
     and created_at < now() - interval '3 days';

  select count(*) into v_count
    from rate_limit_hits
   where user_id = v_user and endpoint = p_endpoint and created_at >= p_since;

  if v_count >= p_max then
    return query select false, 0;
    return;
  end if;

  insert into rate_limit_hits (user_id, endpoint) values (v_user, p_endpoint);
  return query select true, p_max - v_count - 1;
end;
$$;

grant execute on function consume_rate_limit(text, int, timestamptz) to authenticated;
