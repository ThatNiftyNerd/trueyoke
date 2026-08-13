ALTER TABLE public.profiles DROP COLUMN profile_complete;

ALTER TABLE public.profiles
  ADD COLUMN profile_complete boolean
  GENERATED ALWAYS AS (
    CASE
      WHEN account_type = 'mentor' THEN
        display_name IS NOT NULL
        AND full_name IS NOT NULL
        AND mentor_role IS NOT NULL
        AND congregation IS NOT NULL
      ELSE
        display_name IS NOT NULL
        AND age IS NOT NULL
        AND gender IS NOT NULL
        AND life_verse IS NOT NULL
        AND bio IS NOT NULL
    END
  ) STORED;

GRANT SELECT (profile_complete) ON public.profiles TO authenticated, anon;