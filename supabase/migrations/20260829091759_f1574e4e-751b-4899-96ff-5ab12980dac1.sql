-- 1) Move the club-visibility helper out of the API-exposed schema
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.can_view_club(_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  SELECT EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE c.id = _club_id
      AND (
        COALESCE(c.is_private, false) = false
        OR c.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.club_memberships m WHERE m.club_id = c.id AND m.user_id = auth.uid())
      )
  );
$$;
revoke all on function private.can_view_club(uuid) from public, anon;
grant execute on function private.can_view_club(uuid) to authenticated, service_role;

drop policy if exists "Posts readable by signed-in users" on public.posts;
create policy "Posts readable by signed-in users"
on public.posts for select to authenticated
using (club_id is null or private.can_view_club(club_id));

drop policy if exists "Comments readable by signed-in users" on public.comments;
create policy "Comments readable by signed-in users"
on public.comments for select to authenticated
using (exists (
  select 1 from public.posts p
  where p.id = comments.post_id
    and (p.club_id is null or private.can_view_club(p.club_id))
));

drop function if exists public.can_view_club(uuid);

-- 2) get_my_profile no longer needs elevated rights, and anon must not call it
create or replace function public.get_my_profile()
returns public.profiles
language sql
stable
security invoker
set search_path = public
as $$
  SELECT * FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;
revoke all on function public.get_my_profile() from public, anon;
grant execute on function public.get_my_profile() to authenticated, service_role;

-- 3) Profiles: no more full-table PII reads by any signed-in user
drop policy if exists "Profiles are readable by signed-in users" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select to authenticated
using (user_id = auth.uid());

create or replace view public.public_profiles
with (security_invoker = off) as
  select id, user_id, username, display_name, avatar_url, bio, created_at
  from public.profiles;

revoke all on public.public_profiles from anon, public;
grant select on public.public_profiles to authenticated, service_role;