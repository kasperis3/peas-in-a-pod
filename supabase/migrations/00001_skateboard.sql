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
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  );
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

-- Profiles
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

create policy profiles_select_pod_mates on public.profiles
  for select using (
    exists (
      select 1
      from public.memberships m1
      join public.memberships m2 on m1.pod_id = m2.pod_id
      where m1.user_id = auth.uid()
        and m2.user_id = profiles.id
        and m1.status = 'active'
        and m2.status = 'active'
    )
  );

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

-- Pods
create policy pods_insert on public.pods
  for insert with check (auth.uid() = leader_id);

create policy pods_select on public.pods
  for select using (
    leader_id = auth.uid()
    or exists (
      select 1 from public.memberships m
      where m.pod_id = pods.id
        and m.user_id = auth.uid()
        and m.status in ('active', 'pending')
    )
  );

create policy pods_update_leader on public.pods
  for update using (leader_id = auth.uid());

-- Memberships
create policy memberships_select on public.memberships
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.pods p
      where p.id = memberships.pod_id and p.leader_id = auth.uid()
    )
  );

create policy memberships_insert_self on public.memberships
  for insert with check (user_id = auth.uid());

create policy memberships_update_leader on public.memberships
  for update using (
    exists (
      select 1 from public.pods p
      where p.id = memberships.pod_id and p.leader_id = auth.uid()
    )
  );

-- Check-ins
create policy check_ins_insert_active on public.check_ins
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.memberships m
      where m.pod_id = check_ins.pod_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

create policy check_ins_select_pod on public.check_ins
  for select using (
    exists (
      select 1 from public.memberships m
      where m.pod_id = check_ins.pod_id
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );

-- Invite codes
create policy invite_codes_leader on public.invite_codes
  for all using (
    exists (
      select 1 from public.pods p
      where p.id = invite_codes.pod_id and p.leader_id = auth.uid()
    )
  );

create policy invite_codes_validate on public.invite_codes
  for select using (active = true and expires_at > now());
