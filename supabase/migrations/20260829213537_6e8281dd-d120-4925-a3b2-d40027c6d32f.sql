CREATE TABLE public.timeline_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'all',
  range text NOT NULL DEFAULT 'all',
  club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timeline_presets TO authenticated;
GRANT ALL ON public.timeline_presets TO service_role;
ALTER TABLE public.timeline_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own timeline presets" ON public.timeline_presets FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER timeline_presets_touch BEFORE UPDATE ON public.timeline_presets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_timeline_presets_user ON public.timeline_presets(user_id, created_at DESC);

CREATE TABLE public.recommendation_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);
GRANT SELECT, INSERT, DELETE ON public.recommendation_dismissals TO authenticated;
GRANT ALL ON public.recommendation_dismissals TO service_role;
ALTER TABLE public.recommendation_dismissals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recommendation dismissals" ON public.recommendation_dismissals FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text,
  auth_key text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push subscriptions" ON public.push_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS seen_indicator_mode text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS push_enabled boolean NOT NULL DEFAULT false;