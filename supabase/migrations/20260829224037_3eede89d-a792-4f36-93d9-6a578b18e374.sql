CREATE OR REPLACE FUNCTION private.is_club_member(_club_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_memberships m
    WHERE m.club_id = _club_id AND m.user_id = _user_id
  );
$$;

REVOKE ALL ON FUNCTION private.is_club_member(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION private.is_club_member(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users can manage own memberships" ON public.club_memberships;
DROP POLICY IF EXISTS "Club owners can see members" ON public.club_memberships;

CREATE POLICY "Members and owners can view club rosters"
ON public.club_memberships
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR private.is_club_member(club_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE c.id = club_memberships.club_id AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Users can join clubs they may access"
ON public.club_memberships
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.clubs c
    WHERE c.id = club_memberships.club_id
      AND (
        COALESCE(c.is_private, false) = false
        OR c.created_by = auth.uid()
        OR private.is_club_member(c.id, auth.uid())
      )
  )
);

CREATE POLICY "Users can leave their own clubs"
ON public.club_memberships
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own membership"
ON public.club_memberships
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());