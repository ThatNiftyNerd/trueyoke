CREATE TABLE public.marketing_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  consented boolean NOT NULL DEFAULT false,
  consented_at timestamptz,
  consent_source text NOT NULL DEFAULT 'signup' CHECK (consent_source IN ('signup','login','settings')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.marketing_consents TO authenticated;
GRANT ALL ON public.marketing_consents TO service_role;

ALTER TABLE public.marketing_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own marketing consent"
  ON public.marketing_consents FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own marketing consent"
  ON public.marketing_consents FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own marketing consent"
  ON public.marketing_consents FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admins can view marketing consents"
  ON public.marketing_consents FOR SELECT TO authenticated
  USING (public.has_admin_permission('analytics.view') OR public.is_super_admin());

CREATE TRIGGER trg_marketing_consents_updated
  BEFORE UPDATE ON public.marketing_consents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();