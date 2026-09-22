-- ============================================================================
-- Church verification becomes a Mentor-only function (2026-09-22).
--
-- Product decision: a Mentor's endorsement of a Match already covers
-- verification in substance. Beyond what a Match already submits at
-- signup (the self-reported church_affiliation/congregation fields
-- collected during onboarding, see FaithStep.tsx), a Match should not
-- also go through document-based church verification. That flow is
-- unchanged for Mentors.
--
-- This migration tightens INSERT on church_verifications so only Mentor
-- accounts can create a new submission. Client-side routes
-- (verify-church.tsx, app.profile.tsx) already stop steering Match
-- accounts toward this flow as of the same release, but the database
-- constraint is what actually enforces it -- a client-side check alone
-- is not a security boundary.
--
-- Deliberately NOT touched:
--   - Read policies (church_verifications_owner_read,
--     church_verifications_admin_read) -- a Match account with a
--     pre-existing row (grandfathered, see below) can still read its
--     own row's status.
--   - Update policy (church_verifications_admin_update) -- unrelated to
--     who may insert.
--   - Storage bucket policies on `church-verification` -- unrelated to
--     who may insert a verification row; still owner + admin scoped
--     exactly as before.
--   - profiles.church_verified and any existing church_verifications
--     rows for Match accounts -- explicitly grandfathered per product
--     decision. Nothing here revokes an already-verified badge or
--     cancels a pending submission a Match account made before this
--     change; it only blocks new ones going forward.
--   - sync_church_verified() trigger -- still fires on admin approval
--     for any existing row regardless of account_type, so an
--     already-pending Match submission can still be approved/rejected
--     normally.
-- ============================================================================

drop policy if exists church_verifications_owner_insert on public.church_verifications;

create policy church_verifications_owner_insert
  on public.church_verifications for insert to authenticated
  with check (
    auth.uid() = profile_id
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'mentor'
    )
  );
