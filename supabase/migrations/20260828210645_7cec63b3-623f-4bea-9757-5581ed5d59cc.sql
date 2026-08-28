ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS goodreads_connected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS goodreads_profile text,
  ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.reader_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  curiosity_preferences text[] NOT NULL DEFAULT '{}',
  reading_locations text[] NOT NULL DEFAULT '{}',
  reading_interruptions text[] NOT NULL DEFAULT '{}',
  post_book_behaviour text[] NOT NULL DEFAULT '{}',
  conversation_style text[] NOT NULL DEFAULT '{}',
  community_motivations text[] NOT NULL DEFAULT '{}',
  traits jsonb NOT NULL DEFAULT '{}'::jsonb,
  personality_name text,
  personality_description text,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reader_profiles TO authenticated;
GRANT ALL ON public.reader_profiles TO service_role;

ALTER TABLE public.reader_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members manage their own reader profile" ON public.reader_profiles;
CREATE POLICY "Members manage their own reader profile"
ON public.reader_profiles FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_reader_profiles()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.touch_reader_profiles() FROM PUBLIC;

DROP TRIGGER IF EXISTS reader_profiles_touch ON public.reader_profiles;
CREATE TRIGGER reader_profiles_touch BEFORE UPDATE ON public.reader_profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_reader_profiles();