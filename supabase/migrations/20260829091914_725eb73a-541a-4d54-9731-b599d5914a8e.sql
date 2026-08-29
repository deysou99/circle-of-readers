-- Public profile view enforces the querying user's own permissions
create or replace view public.public_profiles
with (security_invoker = on) as
  select id, user_id, username, display_name, avatar_url, bio, created_at
  from public.profiles;

revoke all on public.public_profiles from anon, public;
grant select on public.public_profiles to authenticated, service_role;

-- Signed-in users may see profile rows, but column privileges limit them to
-- non-sensitive fields; email/phone/goodreads data stays owner/server only.
create policy "Signed-in users can read public profile fields"
on public.profiles for select to authenticated
using (true);

revoke select on public.profiles from authenticated;
grant select (id, user_id, username, display_name, avatar_url, bio, created_at)
  on public.profiles to authenticated;
grant insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

drop policy if exists "Users can view own profile" on public.profiles;

-- get_my_profile reads sensitive own-row fields; server code uses the admin
-- client for that instead, so remove the exposed RPC entirely.
drop function if exists public.get_my_profile();