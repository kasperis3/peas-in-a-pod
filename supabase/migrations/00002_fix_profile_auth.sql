-- Run this in Supabase SQL Editor if you get 500 errors on profiles
-- Fixes: trigger failures, duplicate inserts, missing insert policy

-- 1. Safer profile creation on sign-up (handles null email, duplicates)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_name text;
  user_email text;
begin
  user_email := coalesce(new.email, '');
  user_name := coalesce(
    new.raw_user_meta_data ->> 'name',
    nullif(split_part(user_email, '@', 1), ''),
    'Pea'
  );

  insert into public.profiles (id, name, email)
  values (new.id, user_name, user_email)
  on conflict (id) do update
    set email = excluded.email,
        name = case
          when public.profiles.name = '' or public.profiles.name is null
          then excluded.name
          else public.profiles.name
        end;

  return new;
exception
  when others then
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- 2. Recreate trigger (safe if already exists)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 3. Ensure users can create their own profile (app fallback)
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert
  with check (auth.uid() = id);

-- 4. Backfill profiles for auth users missing a row
insert into public.profiles (id, name, email)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'name', split_part(coalesce(u.email, 'user'), '@', 1), 'Pea'),
  coalesce(u.email, '')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
