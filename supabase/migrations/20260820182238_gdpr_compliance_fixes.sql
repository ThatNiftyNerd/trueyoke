-- ============================================================================
-- GDPR / global data-protection sweep fixes (Linear TRU-29, TRU-30, TRU-32,
-- TRU-34). See TrueYoke-Compliance-Governance-Record v1.17 Section 9 for the
-- full multi-jurisdiction rating that motivated this migration.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- TRU-29: dedicated, explicit consent for special-category data (genotype,
-- blood group, church affiliation, congregation, spirituality markers, life
-- verse — GDPR Art. 9 / LGPD "dados sensíveis" / POPIA "special personal
-- information"). Captured as its own onboarding step, separate from the
-- general privacy-policy consent already recorded in privacy_accepted_at.
--
-- Follows the same restricted-read pattern already established for
-- privacy_accepted_at / privacy_policy_version (see
-- 20260819000000_own_profile_rpc_and_column_grants.sql): no direct SELECT
-- grant to anon/authenticated, since profiles has no table-wide SELECT grant
-- for those roles (it was replaced by an explicit per-column allowlist).
-- Self-read goes through get_own_profile_full(), which already does
-- `select *` and therefore returns these columns with no changes needed.
-- INSERT/UPDATE are granted directly since the caller only ever writes their
-- own row (enforced by the profiles_update / profiles_insert RLS policies).
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists special_category_consented_at timestamptz,
  add column if not exists special_category_consent_version text;

grant insert (special_category_consented_at, special_category_consent_version)
  on public.profiles to anon, authenticated;
grant update (special_category_consented_at, special_category_consent_version)
  on public.profiles to anon, authenticated;

-- ---------------------------------------------------------------------------
-- TRU-32: age was enforced client-side only (zod schema + HTML min/max),
-- with no DB-level backstop, while the Privacy Policy/Terms claimed
-- enforcement "cannot be bypassed." Verified live (2026-08-20) that no
-- existing row violates this range before adding the constraint.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add constraint profiles_age_range check (age is null or (age >= 18 and age <= 99));

-- ---------------------------------------------------------------------------
-- TRU-34: marketing consent wasn't version-stamped like privacy consent,
-- weakening the evidentiary record required under GDPR Art. 7(1). No extra
-- grants needed — marketing_consents already has table-wide SELECT/INSERT/
-- UPDATE grants for anon/authenticated (verified live), unlike profiles.
-- ---------------------------------------------------------------------------
alter table public.marketing_consents
  add column if not exists consent_version text;

-- ---------------------------------------------------------------------------
-- TRU-30 (partial — the redaction-sensitive half): reports/blocks RLS today
-- only lets the reporter/blocker read their own filed reports/blocks
-- (reports_read: reporter_id = auth.uid(); blocks_owner: blocker_id =
-- auth.uid()). A complete GDPR Art. 15 access right also covers data about
-- the user where they are the SUBJECT of someone else's report/block — but
-- exposing that via a plain RLS SELECT policy would also hand back the
-- other party's identity (reporter_id) and internal moderation notes
-- (resolution_notes, resolved_by), which Art. 15(4) allows withholding where
-- it would adversely affect another person's rights (here: retaliation risk
-- against whoever filed a safety report). These two SECURITY DEFINER RPCs
-- return only a redacted, non-identifying column set for the caller's own
-- "received" rows — never the other party's id.
-- ---------------------------------------------------------------------------
create or replace function public.get_own_reports_received()
returns table(id uuid, reason text, status text, created_at timestamptz)
language sql
stable
security definer
set search_path to 'public'
as $$
  select id, reason, status, created_at
  from public.reports
  where reported_id = auth.uid();
$$;

revoke all on function public.get_own_reports_received() from public;
grant execute on function public.get_own_reports_received() to authenticated;

create or replace function public.get_own_blocks_received()
returns table(id uuid, created_at timestamptz)
language sql
stable
security definer
set search_path to 'public'
as $$
  select id, created_at
  from public.blocks
  where blocked_id = auth.uid();
$$;

revoke all on function public.get_own_blocks_received() from public;
grant execute on function public.get_own_blocks_received() to authenticated;
