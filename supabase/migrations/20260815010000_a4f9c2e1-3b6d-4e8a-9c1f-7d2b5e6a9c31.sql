-- Multi-mentor endorsements: cap a match account at 7 concurrently active
-- (pending or approved) voucher requests. Declined requests do not count
-- against the cap, so a match can keep seeking endorsements from other
-- mentors after a decline (re-requesting the SAME mentor who declined is
-- still blocked by the existing vouchers_match_user_mentor_unique
-- constraint -- unchanged by this migration).

create or replace function public.enforce_voucher_request_cap()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  active_count integer;
begin
  select count(*) into active_count
  from public.vouchers
  where match_user_id = new.match_user_id
    and status in ('pending', 'approved');

  if active_count >= 7 then
    raise exception 'You have reached the maximum of 7 mentor requests.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_voucher_request_cap on public.vouchers;
create trigger trg_enforce_voucher_request_cap
  before insert on public.vouchers
  for each row execute function public.enforce_voucher_request_cap();
