-- Events -------------------------------------------------------------------
CREATE TABLE public.club_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  location text,
  book_id uuid REFERENCES public.books(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_events TO authenticated;
GRANT ALL ON public.club_events TO service_role;
ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events visible to circle viewers" ON public.club_events
  FOR SELECT TO authenticated USING (private.can_view_club(club_id));
CREATE POLICY "Event owners insert" ON public.club_events
  FOR INSERT TO authenticated WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND (c.created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM public.club_memberships m WHERE m.club_id = c.id AND m.user_id = auth.uid())))
  );
CREATE POLICY "Event owners update" ON public.club_events
  FOR UPDATE TO authenticated USING (
    created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.created_by = auth.uid())
  ) WITH CHECK (
    created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.created_by = auth.uid())
  );
CREATE POLICY "Event owners delete" ON public.club_events
  FOR DELETE TO authenticated USING (
    created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.created_by = auth.uid())
  );

CREATE INDEX club_events_club_starts_idx ON public.club_events(club_id, starts_at);

CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.club_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'going',
  reminder_enabled boolean NOT NULL DEFAULT true,
  reminder_minutes integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_rsvps TO authenticated;
GRANT ALL ON public.event_rsvps TO service_role;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RSVPs visible to event viewers" ON public.event_rsvps
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.club_events e WHERE e.id = event_id AND private.can_view_club(e.club_id))
  );
CREATE POLICY "Users manage own rsvps" ON public.event_rsvps
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX event_rsvps_user_idx ON public.event_rsvps(user_id);

-- Conversations --------------------------------------------------------------
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'direct',
  title text,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT to_timestamp(0),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_participants TO authenticated;
GRANT ALL ON public.conversation_participants TO service_role;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.is_conversation_member(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants p
    WHERE p.conversation_id = _conversation_id AND p.user_id = _user_id
  );
$$;
REVOKE ALL ON FUNCTION private.is_conversation_member(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE POLICY "Members read conversations" ON public.conversations
  FOR SELECT TO authenticated USING (private.is_conversation_member(id, auth.uid()));
CREATE POLICY "Users create conversations" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Members update conversations" ON public.conversations
  FOR UPDATE TO authenticated USING (private.is_conversation_member(id, auth.uid()))
  WITH CHECK (private.is_conversation_member(id, auth.uid()));

CREATE POLICY "Members read participants" ON public.conversation_participants
  FOR SELECT TO authenticated USING (private.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Creator or self adds participants" ON public.conversation_participants
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
  );
CREATE POLICY "Users update own participation" ON public.conversation_participants
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users leave conversations" ON public.conversation_participants
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Members read messages" ON public.messages
  FOR SELECT TO authenticated USING (private.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Members send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND private.is_conversation_member(conversation_id, auth.uid())
  );

CREATE INDEX messages_conversation_created_idx ON public.messages(conversation_id, created_at);
CREATE INDEX conversation_participants_user_idx ON public.conversation_participants(user_id);

CREATE OR REPLACE FUNCTION public.touch_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NULL;
END;
$$;
CREATE TRIGGER messages_touch_conversation
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.touch_conversation_on_message();

-- Notification preferences ---------------------------------------------------
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  likes boolean NOT NULL DEFAULT true,
  comments boolean NOT NULL DEFAULT true,
  follows boolean NOT NULL DEFAULT true,
  club_activity boolean NOT NULL DEFAULT true,
  event_reminders boolean NOT NULL DEFAULT true,
  direct_messages boolean NOT NULL DEFAULT true,
  group_messages boolean NOT NULL DEFAULT true,
  mentions boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notification preferences" ON public.notification_preferences
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER club_events_touch BEFORE UPDATE ON public.club_events
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER event_rsvps_touch BEFORE UPDATE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER notification_preferences_touch BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();