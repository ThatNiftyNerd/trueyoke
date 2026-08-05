ALTER TABLE public.vouchers ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.vouchers ALTER COLUMN invitee_email DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS vouchers_match_user_mentor_key ON public.vouchers (match_user_id, mentor_id);
ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_match_user_mentor_unique UNIQUE USING INDEX vouchers_match_user_mentor_key;