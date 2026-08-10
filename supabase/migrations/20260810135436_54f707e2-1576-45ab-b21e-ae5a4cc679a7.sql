ALTER TABLE public.profiles DROP COLUMN profile_complete;
ALTER TABLE public.profiles
  ADD COLUMN profile_complete boolean
  GENERATED ALWAYS AS (
    display_name IS NOT NULL
    AND age IS NOT NULL
    AND gender IS NOT NULL
    AND life_verse IS NOT NULL
    AND bio IS NOT NULL
    AND (account_type <> 'mentor'::account_type OR full_name IS NOT NULL)
  ) STORED;