DROP POLICY IF EXISTS "Signed-in users can view post images" ON storage.objects;

CREATE POLICY "Members can view visible post images" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'post-images'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.image_url = storage.objects.name
        AND (p.club_id IS NULL OR private.can_view_club(p.club_id))
    )
  )
);