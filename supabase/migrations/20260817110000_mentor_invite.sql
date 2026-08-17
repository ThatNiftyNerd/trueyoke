-- Mentor invite by email: lets a Match invite someone who isn't yet on the
-- platform to join as a Mentor and pick up the endorsement request. Builds
-- directly on the existing `vouchers` table rather than a parallel table --
-- `vouchers.mentor_id` was already nullable and `invitee_email` already
-- existed (see 20260805144055), so an "invite" is simply a vouchers row with
-- mentor_id = NULL and invitee_email set. This means the existing
-- `enforce_voucher_request_cap()` trigger, the `vouchers_owner` RLS policy,
-- and the match-side ledger UI all already apply to invite rows with zero
-- changes -- an invite counts toward the same 7-request cap as a direct
-- request, by construction.
--
-- `invite_channel`/`invitee_phone` scaffold a future WhatsApp send path; only
-- 'email' is reachable from the client today (see WHATSAPP_INVITES_ENABLED
-- in src/features/vouchers/api.ts and the matching guard in the
-- invite-mentor Edge Function). Both stay inert until Meta Business
-- verification is complete and the API secret is added.

alter table public.vouchers
  add column if not exists invite_token text,
  add column if not exists invite_expires_at timestamptz,
  add column if not exists invite_channel text not null default 'email',
  add column if not exists invitee_phone text;

do $$ begin
  alter table public.vouchers
    add constraint vouchers_invite_channel_check
    check (invite_channel in ('email', 'whatsapp'));
exception when duplicate_object then null;
end $$;

-- A row must be either a direct request (mentor_id set) or an invite
-- (invitee_email set) -- never neither.
do $$ begin
  alter table public.vouchers
    add constraint vouchers_target_present
    check (mentor_id is not null or invitee_email is not null);
exception when duplicate_object then null;
end $$;

-- Tokens are unique across all rows (partial index so plain direct-request
-- rows, which never carry a token, don't need to participate).
create unique index if not exists vouchers_invite_token_key
  on public.vouchers (invite_token)
  where invite_token is not null;

-- One live pending invite per (match, email) at a time -- stops a match from
-- re-sending duplicate invites to the same address. Re-inviting after a
-- decline/expiry is allowed since this only matches status = 'pending'.
create unique index if not exists vouchers_pending_invite_email_unique
  on public.vouchers (match_user_id, lower(invitee_email))
  where mentor_id is null and status = 'pending';

-- Claim: called by a newly-authenticated Mentor account holding a valid
-- invite token (typically right after they finish signup). Verifies the
-- token, then attaches the row to their account by setting mentor_id --
-- from that moment on, the existing vouchers_mentor_read/_update policies
-- (mentor_id = auth.uid()) light up for this row exactly as they would for
-- any directly-requested voucher, and it appears in the Mentor's ledger
-- alongside everything else with no separate code path required.
--
-- SECURITY DEFINER is required: an unclaimed invite row has mentor_id IS
-- NULL, so the invitee has no RLS-visible relationship to it yet -- only the
-- match owner can see/touch it before this runs.
create or replace function public.claim_mentor_invite(p_token text)
returns public.vouchers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.vouchers;
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.profiles where id = v_caller and account_type = 'mentor'
  ) then
    raise exception 'Only a Mentor account can accept this invite' using errcode = '42501';
  end if;

  select * into v_row from public.vouchers where invite_token = p_token for update;

  if v_row is null then
    raise exception 'This invite link is invalid' using errcode = 'P0002';
  end if;
  if v_row.mentor_id is not null then
    raise exception 'This invite has already been accepted' using errcode = '22023';
  end if;
  if v_row.status <> 'pending' then
    raise exception 'This invite is no longer valid' using errcode = '22023';
  end if;
  if v_row.invite_expires_at is not null and v_row.invite_expires_at <= now() then
    raise exception 'This invite has expired' using errcode = '22023';
  end if;

  update public.vouchers
    set mentor_id = v_caller,
        invite_token = null
    where id = v_row.id
    returning * into v_row;

  return v_row;
exception
  when unique_violation then
    raise exception 'You already have a request with this member' using errcode = '23505';
end;
$$;

revoke all on function public.claim_mentor_invite(text) from public;
grant execute on function public.claim_mentor_invite(text) to authenticated;
