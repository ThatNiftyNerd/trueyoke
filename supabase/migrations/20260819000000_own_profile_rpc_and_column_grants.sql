-- ============================================================================
-- Restrict column-level SELECT on public.profiles for peer reads, while
-- preserving self-read access to sensitive columns via a SECURITY DEFINER RPC.
--
-- Root issue (codebase improvement report, 2026-08-18/19): anon and
-- authenticated held table-wide SELECT on profiles, including email,
-- is_admin, privacy_accepted_at, privacy_policy_version, status_changed_at,
-- and status_changed_by. RLS restricts which ROWS are visible (non-blocked
-- profiles), but grants are not row-aware, so any authenticated caller could
-- read another visible profile's email or admin flag via a crafted
-- select= parameter, even though the app's own queries never request those
-- columns.
--
-- account_status is deliberately NOT restricted here: the separate Admin Hub
-- project reads it directly via the authenticated role (src/lib/profiles.ts
-- fetchProfiles(), used across its moderation/reports/matches/vouchers list
-- views) and that table has no admin-vs-regular-user distinction at the
-- Postgres role level. Restricting it would require routing those Admin Hub
-- reads through an RPC too — out of scope for this pass; flagged as a
-- follow-up.
-- ============================================================================

-- Step 1 (additive, safe to run standalone): self-only RPC returning the
-- full profiles row for the caller's own id. Used by the three code paths
-- that legitimately need columns being restricted below, for the CALLER'S
-- OWN row only — never accepts a profile id parameter, so it can never read
-- someone else's row.
create or replace function public.get_own_profile_full()
returns public.profiles
language sql
stable
security definer
set search_path to 'public'
as $$
  select * from public.profiles where id = auth.uid();
$$;

revoke all on function public.get_own_profile_full() from public;
grant execute on function public.get_own_profile_full() to authenticated;

-- Step 2 (the actual fix — apply ONLY after app code that used to read these
-- columns directly has been deployed to use get_own_profile_full() instead;
-- see src/features/profile/api.ts getOnboardingProfile/isCurrentUserAdmin/
-- exportOwnData in the paired PR). Applying this before that deploy lands
-- will break onboarding, the admin self-check, and the NDPA data-export
-- feature for every user.
revoke select (email, is_admin, privacy_accepted_at, privacy_policy_version,
  status_changed_at, status_changed_by) on public.profiles from anon, authenticated;
