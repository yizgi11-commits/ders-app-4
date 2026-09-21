-- Noetic OS — security hardening (run once in the Supabase SQL Editor)
--
-- increment_xp() was `security definer` with a caller-supplied user id and
-- amount, and Postgres grants EXECUTE to PUBLIC by default — so anyone holding
-- the (public) anon key could call it from a browser and give any user
-- unlimited XP. Lock it down:
--   * anonymous callers can no longer execute it
--   * an authenticated caller can only touch their OWN row (auth.uid())
--   * the amount is bounded (server awards are small, a batch of achievement rewards)

create or replace function increment_xp(p_user_id uuid, p_amount int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not allowed';
  end if;
  if p_amount is null or p_amount < 0 or p_amount > 10000 then
    raise exception 'invalid amount';
  end if;

  update user_xp
  set
    total_xp   = total_xp + p_amount,
    level      = greatest(1, floor(sqrt(total_xp + p_amount) / 10 + 1)::int),
    updated_at = now()
  where user_id = p_user_id;
end;
$$;

revoke all on function increment_xp(uuid, int) from public, anon;
grant execute on function increment_xp(uuid, int) to authenticated;
