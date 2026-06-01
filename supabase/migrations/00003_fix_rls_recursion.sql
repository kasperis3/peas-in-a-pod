-- Fix: infinite recursion detected in policy for relation "memberships"
-- Cause: pods policies query memberships, memberships policies query pods.
-- Fix: security definer helpers bypass RLS for permission checks.

-- Helper functions (run as owner, no RLS recursion)
create or replace function public.is_pod_leader(p_pod_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.pods
    where id = p_pod_id
      and leader_id = (select auth.uid())
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
    select 1
    from public.memberships m
    where m.pod_id = p_pod_id
      and m.user_id = (select auth.uid())
      and (
        m.status = 'active'
        or (p_include_pending and m.status = 'pending')
      )
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

-- Drop policies that cause recursion
drop policy if exists profiles_select_pod_mates on public.profiles;
drop policy if exists pods_select on public.pods;
drop policy if exists memberships_select on public.memberships;
drop policy if exists memberships_update_leader on public.memberships;
drop policy if exists check_ins_insert_active on public.check_ins;
drop policy if exists check_ins_select_pod on public.check_ins;
drop policy if exists invite_codes_leader on public.invite_codes;

-- Profiles
create policy profiles_select_pod_mates on public.profiles
  for select using (public.shares_active_pod_with(id));

-- Pods
create policy pods_select on public.pods
  for select using (
    leader_id = (select auth.uid())
    or public.is_pod_member(id, true)
  );

-- Memberships
create policy memberships_select on public.memberships
  for select using (
    user_id = (select auth.uid())
    or public.is_pod_leader(pod_id)
  );

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
