-- Peas in a Pod — Phase 1 skateboard schema

create extension if not exists "pgcrypto";

create type goal_type as enum ('completion', 'measurement');
create type cadence_type as enum ('daily', 'weekly', 'monthly', 'every_x_days', 'every_x_weeks');
create type membership_status as enum ('pending', 'active', 'rejected', 'left');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  avatar_url text,
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now()
);

create table public.pods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  leader_id uuid not null references public.profiles (id),
  goal_name text not null,
  goal_type goal_type not null default 'measurement',
  target_value numeric not null default 1,
  unit text not null default '',
  cadence_type cadence_type not null default 'daily',
  cadence_interval int,
  grace_misses_per_month int not null default 2,
  max_members int not null default 10,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pods (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status membership_status not null default 'pending',
  joined_at timestamptz not null default now(),
  approved_at timestamptz,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  grace_used_this_month int not null default 0,
  grace_month_key text not null default to_char(now(), 'YYYY-MM'),
  unique (pod_id, user_id)
);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  pod_id uuid not null references public.pods (id) on delete cascade,
  value numeric not null,
  note text,
  created_at timestamptz not null default now()
);

create index check_ins_pod_created on public.check_ins (pod_id, created_at desc);
create index memberships_pod_status on public.memberships (pod_id, status);

create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pods (id) on delete cascade,
  code text not null unique,
  expires_at timestamptz not null,
  active boolean not null default true,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

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
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.pods enable row level security;
alter table public.memberships enable row level security;
alter table public.check_ins enable row level security;
alter table public.invite_codes enable row level security;

-- RLS helpers (security definer — avoids pods <-> memberships recursion)
create or replace function public.is_pod_leader(p_pod_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.pods
    where id = p_pod_id and leader_id = (select auth.uid())
  );
$$;

create or replace function public.is_pod_member(p_pod_id uuid, p_include_pending boolean default true)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.pod_id = p_pod_id
      and m.user_id = (select auth.uid())
      and (m.status = 'active' or (p_include_pending and m.status = 'pending'))
  );
$$;

create or replace function public.is_active_pod_member(p_pod_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_pod_member(p_pod_id, false);
$$;

create or replace function public.shares_active_pod_with(p_other_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m1
    inner join public.memberships m2 on m1.pod_id = m2.pod_id
    where m1.user_id = (select auth.uid())
      and m2.user_id = p_other_user_id
      and m1.status = 'active'
      and m2.status = 'active'
  );
$$;

grant execute on function public.is_pod_leader(uuid) to authenticated;
grant execute on function public.is_pod_member(uuid, boolean) to authenticated;
grant execute on function public.is_active_pod_member(uuid) to authenticated;
grant execute on function public.shares_active_pod_with(uuid) to authenticated;

-- Profiles
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

create policy profiles_select_pod_mates on public.profiles
  for select using (public.shares_active_pod_with(id));

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

-- Pods
create policy pods_insert on public.pods
  for insert with check (auth.uid() = leader_id);

create policy pods_select on public.pods
  for select using (
    leader_id = (select auth.uid())
    or public.is_pod_member(id, true)
  );

create policy pods_update_leader on public.pods
  for update using (leader_id = auth.uid());

-- Memberships
create policy memberships_select on public.memberships
  for select using (
    user_id = (select auth.uid())
    or public.is_pod_leader(pod_id)
  );

create policy memberships_insert_self on public.memberships
  for insert with check (user_id = auth.uid());

create policy memberships_update_leader on public.memberships
  for update using (public.is_pod_leader(pod_id));

-- Check-ins
create policy check_ins_insert_active on public.check_ins
  for insert with check (
    user_id = (select auth.uid())
    and public.is_active_pod_member(pod_id)
  );

create policy check_ins_select_pod on public.check_ins
  for select using (public.is_active_pod_member(pod_id));

-- Invite codes
create policy invite_codes_leader on public.invite_codes
  for all using (public.is_pod_leader(pod_id));

create policy invite_codes_validate on public.invite_codes
  for select using (active = true and expires_at > now());
