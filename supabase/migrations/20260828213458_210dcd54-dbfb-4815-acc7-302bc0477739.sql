ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS goodreads_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS goodreads_user_id text,
  ADD COLUMN IF NOT EXISTS goodreads_last_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS goodreads_stats jsonb NOT NULL DEFAULT '{}'::jsonb;