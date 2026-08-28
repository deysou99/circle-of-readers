CREATE POLICY "No direct client access to phone verifications"
  ON public.phone_verifications
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);