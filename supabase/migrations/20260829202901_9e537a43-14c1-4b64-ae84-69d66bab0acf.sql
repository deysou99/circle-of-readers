CREATE TABLE IF NOT EXISTS public.search_recents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query text NOT NULL,
  filter text NOT NULL DEFAULT 'All',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, query, filter)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.search_recents TO authenticated;
GRANT ALL ON public.search_recents TO service_role;

ALTER TABLE public.search_recents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recent searches" ON public.search_recents
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_url text;

CREATE POLICY "Signed-in users can view post images" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'post-images');

CREATE POLICY "Users upload own post images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own post images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);