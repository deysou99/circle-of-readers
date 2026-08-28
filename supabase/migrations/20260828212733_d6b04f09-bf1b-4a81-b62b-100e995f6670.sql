CREATE TABLE public.onboarding_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  event_type text NOT NULL,
  stage_index integer,
  stage_key text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.onboarding_events TO authenticated;
GRANT ALL ON public.onboarding_events TO service_role;

ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own onboarding events"
ON public.onboarding_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own onboarding events"
ON public.onboarding_events FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX onboarding_events_user_created_idx ON public.onboarding_events (user_id, created_at DESC);
CREATE INDEX onboarding_events_type_idx ON public.onboarding_events (event_type, stage_index);