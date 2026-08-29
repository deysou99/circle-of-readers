CREATE TABLE public.share_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('preview_view','copy_click','share_open','preview_tap')),
  surface text not null default 'profile_circle',
  tab text,
  query text,
  match_count integer,
  created_at timestamptz not null default now()
);
CREATE INDEX share_events_user_created_idx ON public.share_events (user_id, created_at DESC);
GRANT SELECT, INSERT ON public.share_events TO authenticated;
GRANT ALL ON public.share_events TO service_role;
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "share_events_select_own" ON public.share_events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "share_events_insert_own" ON public.share_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());