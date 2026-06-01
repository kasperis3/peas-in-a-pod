-- Run this ONLY if you already ran 00001_skateboard.sql before profiles_insert_own was added
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);
