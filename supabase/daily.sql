-- Daily mode: results, points and streaks for signed-in players.
-- Run this once in the Supabase SQL Editor, after schema.sql.
--
-- Same security model as schema.sql: clients can read their own rows, and
-- the only write path is the record_daily RPC below.

create table public.daily_results (
  user_id uuid not null references auth.users(id) on delete cascade,
  puzzle_number int not null,
  attempts smallint[] not null, -- per anime: stage that got it (1-3), 0 = missed
  score smallint not null,      -- anime solved (0-3)
  points smallint not null,     -- 100 / 60 / 30 per anime by stage (0-300)
  created_at timestamptz not null default now(),
  primary key (user_id, puzzle_number)
);

alter table public.daily_results enable row level security;
grant select on public.daily_results to authenticated;
create policy "read own daily results" on public.daily_results
  for select using (auth.uid() = user_id);

alter table public.profiles
  add column daily_played int not null default 0,
  add column daily_perfect int not null default 0,  -- days scoring 300
  add column daily_total_points int not null default 0,
  add column daily_best_points int not null default 0,
  add column daily_current_streak int not null default 0,
  add column daily_longest_streak int not null default 0,
  add column daily_last_puzzle int;

-- Records one finished daily. Repeats for the same puzzle are ignored, so a
-- player can't farm stats by replaying. Returns {"current": n, "longest": n}.
-- Daily #1 is 2026-11-08 (keep in sync with LAUNCH_DATE in src/lib/daily.js).
-- Players' local dates can be a day either side of UTC, so ±1 is accepted.
-- Points are worked out here from the attempts (the client never sends
-- them); keep 100 / 60 / 30 in sync with STAGE_POINTS in src/lib/daily.js.
create function public.record_daily(p_puzzle int, p_attempts int[])
returns json language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_today int := (now() at time zone 'utc')::date - date '2026-11-08' + 1;
  v_score int;
  v_points int;
  v_inserted int;
  v_last int;
  v_cur int;
  v_long int;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_puzzle is null or p_puzzle < v_today - 1 or p_puzzle > v_today + 1 then
    raise exception 'invalid puzzle number';
  end if;
  if coalesce(array_length(p_attempts, 1), 0) <> 3
     or exists (select 1 from unnest(p_attempts) a where a is null or a < 0 or a > 3) then
    raise exception 'invalid attempts';
  end if;

  select count(*) filter (where a > 0),
         coalesce(sum(case a when 1 then 100 when 2 then 60 when 3 then 30 else 0 end), 0)
    into v_score, v_points
    from unnest(p_attempts) a;

  insert into public.daily_results (user_id, puzzle_number, attempts, score, points)
  values (v_uid, p_puzzle, p_attempts::smallint[], v_score, v_points)
  on conflict do nothing;
  get diagnostics v_inserted = row_count;

  select daily_last_puzzle, daily_current_streak, daily_longest_streak
    into v_last, v_cur, v_long
    from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'profile not found';
  end if;

  if v_inserted = 1 then
    -- Streak = consecutive days completed. A puzzle older than the last one
    -- (time-zone edge cases) still counts as played but leaves the streak.
    if v_last is null or p_puzzle > v_last then
      v_cur := case when v_last = p_puzzle - 1 then v_cur + 1 else 1 end;
      v_long := greatest(v_long, v_cur);
      v_last := p_puzzle;
    end if;

    update public.profiles set
      daily_played         = daily_played + 1,
      daily_perfect        = daily_perfect + (case when v_points = 300 then 1 else 0 end),
      daily_total_points   = daily_total_points + v_points,
      daily_best_points    = greatest(daily_best_points, v_points),
      daily_current_streak = v_cur,
      daily_longest_streak = v_long,
      daily_last_puzzle    = v_last,
      updated_at           = now()
    where id = v_uid;
  end if;

  return json_build_object('current', v_cur, 'longest', v_long);
end $$;

revoke execute on function public.record_daily(int, int[]) from anon, public;
grant execute on function public.record_daily(int, int[]) to authenticated;
