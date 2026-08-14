ALTER TABLE public.profiles ADD COLUMN email text;

UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE p.id = u.id AND p.email IS NULL;

ALTER TABLE public.profiles DROP COLUMN profile_complete;
ALTER TABLE public.profiles ADD COLUMN profile_complete boolean GENERATED ALWAYS AS (
  CASE
    WHEN account_type = 'mentor'::account_type THEN (
      display_name IS NOT NULL AND full_name IS NOT NULL AND nationality IS NOT NULL
      AND church_affiliation IS NOT NULL AND mentor_role IS NOT NULL AND email IS NOT NULL
    )
    ELSE (
      display_name IS NOT NULL AND age IS NOT NULL AND gender IS NOT NULL
      AND life_verse IS NOT NULL AND bio IS NOT NULL
    )
  END
) STORED;