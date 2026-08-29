CREATE TABLE public.search_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query text NOT NULL DEFAULT '',
  filter text NOT NULL DEFAULT 'All',
  event_type text NOT NULL,
  result_count integer,
  result_type text,
  result_id text,
  position integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.search_events TO authenticated;
GRANT ALL ON public.search_events TO service_role;

ALTER TABLE public.search_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can log their own search events"
ON public.search_events FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own search events"
ON public.search_events FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE INDEX search_events_user_created_idx ON public.search_events (user_id, created_at DESC);