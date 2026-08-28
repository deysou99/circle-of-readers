
-- helper: can current user see a club
CREATE OR REPLACE FUNCTION public.can_view_club(_club_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
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
REVOKE EXECUTE ON FUNCTION public.can_view_club(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_club(uuid) TO authenticated, anon, service_role;

-- clubs: hide private clubs from non-members
DROP POLICY IF EXISTS "Clubs are readable by everyone" ON public.clubs;
CREATE POLICY "Public clubs readable, private clubs members only"
ON public.clubs FOR SELECT TO anon, authenticated
USING (
  COALESCE(is_private, false) = false
  OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.club_memberships m WHERE m.club_id = clubs.id AND m.user_id = auth.uid())
);

-- posts: authenticated only + private club scoping
DROP POLICY IF EXISTS "Posts are readable by everyone" ON public.posts;
CREATE POLICY "Posts readable by signed-in users"
ON public.posts FOR SELECT TO authenticated
USING (club_id IS NULL OR public.can_view_club(club_id));
REVOKE SELECT ON public.posts FROM anon;

-- comments: authenticated only + follow post visibility
DROP POLICY IF EXISTS "Comments are readable by everyone" ON public.comments;
CREATE POLICY "Comments readable by signed-in users"
ON public.comments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = comments.post_id
      AND (p.club_id IS NULL OR public.can_view_club(p.club_id))
  )
);
REVOKE SELECT ON public.comments FROM anon;

-- profiles: only public columns visible to other signed-in users
REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, user_id, username, display_name, avatar_url, bio, created_at) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS public.profiles LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated, service_role;
