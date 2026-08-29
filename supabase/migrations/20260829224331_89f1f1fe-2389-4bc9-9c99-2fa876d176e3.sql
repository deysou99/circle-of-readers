-- role helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- club participation (member or owner)
CREATE OR REPLACE FUNCTION private.is_club_participant(_club_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _club_id IS NOT NULL AND _user_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.club_memberships m WHERE m.club_id = _club_id AND m.user_id = _user_id)
    OR EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = _club_id AND c.created_by = _user_id)
  );
$$;
REVOKE ALL ON FUNCTION private.is_club_participant(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION private.is_club_participant(uuid, uuid) TO authenticated, service_role;

-- conversation access: participant AND (not a club chat OR still a club participant)
CREATE OR REPLACE FUNCTION private.can_access_conversation(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = _conversation_id
      AND EXISTS (
        SELECT 1 FROM public.conversation_participants p
        WHERE p.conversation_id = c.id AND p.user_id = _user_id
      )
      AND (c.club_id IS NULL OR private.is_club_participant(c.club_id, _user_id))
  );
$$;
REVOKE ALL ON FUNCTION private.can_access_conversation(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION private.can_access_conversation(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Members read conversations" ON public.conversations;
CREATE POLICY "Members read conversations"
ON public.conversations FOR SELECT TO authenticated
USING (private.can_access_conversation(id, auth.uid()));

DROP POLICY IF EXISTS "Members update conversations" ON public.conversations;
CREATE POLICY "Members update conversations"
ON public.conversations FOR UPDATE TO authenticated
USING (private.can_access_conversation(id, auth.uid()))
WITH CHECK (private.can_access_conversation(id, auth.uid()));

DROP POLICY IF EXISTS "Users create conversations" ON public.conversations;
CREATE POLICY "Users create conversations"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (club_id IS NULL OR private.is_club_participant(club_id, auth.uid()))
);

DROP POLICY IF EXISTS "Members read messages" ON public.messages;
CREATE POLICY "Members read messages"
ON public.messages FOR SELECT TO authenticated
USING (private.can_access_conversation(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Members send messages" ON public.messages;
CREATE POLICY "Members send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND private.can_access_conversation(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Members read participants" ON public.conversation_participants;
CREATE POLICY "Members read participants"
ON public.conversation_participants FOR SELECT TO authenticated
USING (private.can_access_conversation(conversation_id, auth.uid()));

-- club post images: owner folder, visible non-club post, or club participant
DROP POLICY IF EXISTS "Members can view visible post images" ON storage.objects;
CREATE POLICY "Members can view visible post images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'post-images'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.image_url = objects.name
        AND (
          p.club_id IS NULL
          OR private.can_view_club(p.club_id)
          OR private.is_club_participant(p.club_id, auth.uid())
        )
    )
  )
);

-- roster access audit log
CREATE TABLE public.club_roster_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'club_roster',
  rows_returned integer NOT NULL DEFAULT 0,
  context text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.club_roster_access_log TO authenticated;
GRANT ALL ON public.club_roster_access_log TO service_role;
ALTER TABLE public.club_roster_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Viewers log their own roster views"
ON public.club_roster_access_log FOR INSERT TO authenticated
WITH CHECK (viewer_id = auth.uid());
CREATE POLICY "Viewers and admins read the roster log"
ON public.club_roster_access_log FOR SELECT TO authenticated
USING (viewer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX club_roster_access_log_created_idx ON public.club_roster_access_log (created_at DESC);

-- security scan alerts
CREATE TABLE public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id text NOT NULL,
  scanner text NOT NULL,
  title text NOT NULL,
  level text NOT NULL DEFAULT 'warn',
  detail text,
  status text NOT NULL DEFAULT 'open',
  occurrences integer NOT NULL DEFAULT 1,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scanner, finding_id)
);
GRANT SELECT, INSERT, UPDATE ON public.security_alerts TO authenticated;
GRANT ALL ON public.security_alerts TO service_role;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read security alerts"
ON public.security_alerts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update security alerts"
ON public.security_alerts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins record security alerts"
ON public.security_alerts FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER security_alerts_touch BEFORE UPDATE ON public.security_alerts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();