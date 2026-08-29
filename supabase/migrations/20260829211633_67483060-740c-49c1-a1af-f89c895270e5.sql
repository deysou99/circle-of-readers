CREATE TABLE public.search_saved (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  query text NOT NULL DEFAULT '',
  filter text NOT NULL DEFAULT 'All',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.search_saved TO authenticated;
GRANT ALL ON public.search_saved TO service_role;
ALTER TABLE public.search_saved ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved searches" ON public.search_saved
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER search_saved_touch BEFORE UPDATE ON public.search_saved
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX search_saved_user_idx ON public.search_saved (user_id, created_at DESC);

CREATE TABLE public.search_hidden (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('person','circle')),
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

GRANT SELECT, INSERT, DELETE ON public.search_hidden TO authenticated;
GRANT ALL ON public.search_hidden TO service_role;
ALTER TABLE public.search_hidden ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own hidden search results" ON public.search_hidden
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
