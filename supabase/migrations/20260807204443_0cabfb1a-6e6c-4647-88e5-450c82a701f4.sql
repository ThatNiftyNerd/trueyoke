ALTER TABLE public.vouchers
  ADD COLUMN IF NOT EXISTS request_note text,
  ADD COLUMN IF NOT EXISTS mentor_confirmed boolean NOT NULL DEFAULT false;

ALTER TABLE public.vouchers
  ADD CONSTRAINT vouchers_request_note_len CHECK (request_note IS NULL OR length(request_note) <= 250),
  ADD CONSTRAINT vouchers_endorsement_len CHECK (endorsement IS NULL OR length(endorsement) <= 250),
  ADD CONSTRAINT vouchers_approved_requires_confirmation CHECK (
    status <> 'approved'
    OR (mentor_confirmed = true AND endorsement IS NOT NULL AND length(trim(endorsement)) > 0)
  );

CREATE POLICY vouchers_public_approved_read
  ON public.vouchers
  FOR SELECT
  TO authenticated
  USING (status = 'approved' AND NOT public.is_blocked(match_user_id));