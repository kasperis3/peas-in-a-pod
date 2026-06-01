-- Safe profile creation: only inserts when id exists in auth.users (avoids FK violations)

create or replace function public.ensure_my_profile()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  result public.profiles;
  user_name text;
  user_email text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into result from public.profiles where id = uid;
  if found then
    return result;
  end if;

  select
    coalesce(
      u.raw_user_meta_data ->> 'name',
      nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
      'Pea'
    ),
    coalesce(u.email, '')
  into user_name, user_email
  from auth.users u
  where u.id = uid;

  if not found then
    raise exception 'Auth user not found. Sign out and sign in again.';
  end if;

  insert into public.profiles (id, name, email)
  values (uid, user_name, user_email)
  on conflict (id) do update
    set email = excluded.email
  returning * into result;

  return result;
end;
$$;

grant execute on function public.ensure_my_profile() to authenticated;
