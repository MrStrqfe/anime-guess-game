-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
--
-- Security model: clients hold only the anon key. The profiles table has a
-- select-own policy and deliberately NO insert/update/delete policies, so the
-- only write paths are the signup trigger and the record_game RPC below.
-- Stats are still client-trusted in principle (a signed-in user could call
-- record_game with a fabricated array) -- inherent to static hosting; the RPC
-- validates shape and computes aggregates server-side to cap the damage.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  games_played int not null default 0,
  total_correct int not null default 0,
  total_answered int not null default 0,
  best_score int not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Signed-in users need the table-level grant as well as the RLS policy;
-- RLS then restricts them to their own row. Anon gets nothing.
grant select on public.profiles to authenticated;

create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

-- Auto-create a profile row on signup (covers email and OAuth signups).
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The single write path for stats. p_results is the ordered per-round
-- correctness array for one finished game (up to 10 rounds). The streak is
-- per-round and persists across games: +1 per correct round, reset to 0 on a
-- missed round.
create function public.record_game(p_results boolean[])
returns void language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_total int := coalesce(array_length(p_results, 1), 0);
  v_score int;
  v_cur int;
  v_long int;
  r boolean;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if v_total < 1 or v_total > 10 then
    raise exception 'invalid round count';
  end if;

  select count(*) filter (where x) into v_score from unnest(p_results) x;

  select current_streak, longest_streak into v_cur, v_long
    from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'profile not found';
  end if;

  foreach r in array p_results loop
    if r then
      v_cur := v_cur + 1;
      v_long := greatest(v_long, v_cur);
    else
      v_cur := 0;
    end if;
  end loop;

  update public.profiles set
    games_played   = games_played + 1,
    total_correct  = total_correct + v_score,
    total_answered = total_answered + v_total,
    -- best_score only considers full 10-question games so it stays comparable
    best_score     = case when v_total = 10 then greatest(best_score, v_score) else best_score end,
    current_streak = v_cur,
    longest_streak = v_long,
    updated_at     = now()
  where id = v_uid;
end $$;

revoke execute on function public.record_game(boolean[]) from anon, public;
grant execute on function public.record_game(boolean[]) to authenticated;
