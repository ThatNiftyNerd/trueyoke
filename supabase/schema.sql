-- ============================================================================
-- TRUEYOKE MVP — Supabase / Postgres schema
-- Run in the Supabase SQL editor (or `supabase db push`).
-- Implements the core-loop data model + Intentionality Circuit Breaker.
-- ============================================================================

-- ---------- enums ----------------------------------------------------------
create type account_type   as enum ('match', 'mentor');
create type gender_type     as enum ('male', 'female');
create type swipe_direction as enum ('like', 'pass');
create type match_status    as enum ('active', 'expired', 'closed');
create type id_status        as enum ('none', 'pending', 'verified', 'rejected');

-- ---------- profiles (1:1 with auth.users) ---------------------------------
create table public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  account_type         account_type not null default 'match',

  -- core demographics (PRD 3.2)
  display_name         text not null,
  age                  int  check (age between 18 and 99),
  gender               gender_type,
  location_label       text,
  latitude             double precision,
  longitude            double precision,
  blood_group          text,
  genotype             text,
  nationality          text,
  qualification        text,
  occupation           text,

  -- values & faith
  bio                  text,
  marriage_intentions  text,
  church_affiliation   text,
  congregation         text,
  spirituality_markers text[] default '{}',
  life_verse           text,                 -- mandatory for completion (PRD 3.2)

  -- media
  voice_intro_url      text,                 -- 15s snippet (PRD 3.4)

  -- verification (PRD 3.2). id_verification_status/id_document_path moved
  -- to their own id_verifications table (see below) -- RLS is row-level
  -- only, so keeping them on `profiles` meant any authenticated user could
  -- select another user's id_document_path via the existing profiles_read
  -- policy. church_verified stays here but is admin/staff-only, same as
  -- is_admin -- both have table-wide client INSERT/UPDATE revoked below.
  church_verified        boolean   not null default false,
  is_admin                boolean  not null default false,

  -- mentor-only (deferred UI, schema forward-compatible)
  mentor_role          text,                 -- elder | preacher | deacon

  -- NDPA 2023 consent (explicit consent captured before profile creation)
  privacy_accepted_at    timestamptz,
  privacy_policy_version text,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Completeness is account-type specific (PRD Rev 8 §3.2): mentors only need
-- identity + leadership credentials; matches need the full dating profile.
alter table public.profiles
  add column profile_complete boolean
  generated always as (
    case
      when account_type = 'mentor' then
        display_name is not null
        and full_name is not null
        and mentor_role is not null
        and congregation is not null
      else
        display_name is not null
        and age is not null
        and gender is not null
        and life_verse is not null
        and bio is not null
    end
  ) stored;

-- ---------- photos ---------------------------------------------------------
create table public.photos (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  position    int  not null default 0,
  created_at  timestamptz not null default now()
);
create index on public.photos (profile_id);

-- ---------- swipes ---------------------------------------------------------
create table public.swipes (
  id          uuid primary key default gen_random_uuid(),
  swiper_id   uuid not null references public.profiles (id) on delete cascade,
  swipee_id   uuid not null references public.profiles (id) on delete cascade,
  direction   swipe_direction not null,
  created_at  timestamptz not null default now(),
  unique (swiper_id, swipee_id)
);
create index on public.swipes (swipee_id, direction);

-- ---------- matches --------------------------------------------------------
-- user_a_id < user_b_id is enforced so each pair is unique and order-independent.
create table public.matches (
  id              uuid primary key default gen_random_uuid(),
  user_a_id       uuid not null references public.profiles (id) on delete cascade,
  user_b_id       uuid not null references public.profiles (id) on delete cascade,
  status          match_status not null default 'active',
  last_activity_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  check (user_a_id < user_b_id),
  unique (user_a_id, user_b_id)
);
create index on public.matches (user_a_id);
create index on public.matches (user_b_id);
create index on public.matches (status, last_activity_at);

-- ---------- messages -------------------------------------------------------
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);
create index on public.messages (match_id, created_at);

-- ---------- safety: reports & blocks --------------------------------------
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  reason      text,
  created_at  timestamptz not null default now()
);

create table public.blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references public.profiles (id) on delete cascade,
  blocked_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

-- id verification submissions -- one row per submission (resubmission after
-- a rejection creates a new row, preserving history for reviewers). Replaces
-- the old profiles.id_verification_status/id_document_path columns.
create table public.id_verifications (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null references public.profiles (id) on delete cascade,
  document_path     text not null,          -- Storage path in the id-verification bucket
  status            id_status not null default 'pending',
  reviewed_by       uuid references public.profiles (id) on delete set null,
  reviewed_at       timestamptz,
  rejection_reason  text,
  created_at        timestamptz not null default now()
);
create index on public.id_verifications (profile_id, created_at desc);

-- ---------- vouchers (PRD 3.5 — schema only, UI deferred) ------------------
create table public.vouchers (
  id           uuid primary key default gen_random_uuid(),
  match_user_id uuid not null references public.profiles (id) on delete cascade,
  mentor_id    uuid references public.profiles (id) on delete set null,
  invitee_email text not null,
  endorsement  text,                    -- one-sentence attestation
  status       text not null default 'pending', -- pending | submitted
  created_at   timestamptz not null default now()
);

-- ============================================================================
-- BUSINESS LOGIC — the Intentionality Circuit Breaker (PRD 3.3)
-- ============================================================================

-- (1) Create a match automatically when a like is mutual.
create or replace function public.handle_mutual_like()
returns trigger language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  reciprocal boolean;
  a uuid; b uuid;
begin
  if new.direction <> 'like' then
    return new;
  end if;

  select exists (
    select 1 from public.swipes s
    where s.swiper_id = new.swipee_id
      and s.swipee_id = new.swiper_id
      and s.direction = 'like'
  ) into reciprocal;

  if reciprocal then
    a := least(new.swiper_id, new.swipee_id);
    b := greatest(new.swiper_id, new.swipee_id);
    insert into public.matches (user_a_id, user_b_id)
    values (a, b)
    on conflict (user_a_id, user_b_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger trg_mutual_like
  after insert on public.swipes
  for each row execute function public.handle_mutual_like();

-- (2) Active-chat cap: reject a 4th ACTIVE conversation for either participant.
create or replace function public.enforce_active_chat_cap()
returns trigger language plpgsql
set search_path = public, pg_temp as $$
declare
  cap constant int := 3;
  count_a int; count_b int;
begin
  if new.status <> 'active' then
    return new;
  end if;

  select count(*) into count_a from public.matches
   where status = 'active' and (user_a_id = new.user_a_id or user_b_id = new.user_a_id);
  select count(*) into count_b from public.matches
   where status = 'active' and (user_a_id = new.user_b_id or user_b_id = new.user_b_id);

  if count_a >= cap or count_b >= cap then
    raise exception 'ACTIVE_CHAT_CAP_REACHED'
      using hint = 'A user may have at most 3 active conversations.';
  end if;

  return new;
end;
$$;

create trigger trg_active_chat_cap
  before insert on public.matches
  for each row execute function public.enforce_active_chat_cap();

-- (3) Touch last_activity_at on every new message (feeds the 72h expiry sweep).
create or replace function public.touch_match_activity()
returns trigger language plpgsql
set search_path = public, pg_temp as $$
begin
  update public.matches
     set last_activity_at = now()
   where id = new.match_id;
  return new;
end;
$$;

create trigger trg_touch_activity
  after insert on public.messages
  for each row execute function public.touch_match_activity();

-- (4) The 72h expiry sweep is run by the `expire-stale-chats` Edge Function
--     on a schedule. The query it executes:
--   update public.matches set status = 'expired'
--    where status = 'active' and last_activity_at < now() - interval '72 hours';

-- keep updated_at fresh on profiles
create or replace function public.touch_updated_at()
returns trigger language plpgsql
set search_path = public, pg_temp as $$
begin new.updated_at := now(); return new; end; $$;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.photos   enable row level security;
alter table public.swipes   enable row level security;
alter table public.matches  enable row level security;
alter table public.messages enable row level security;
alter table public.reports  enable row level security;
alter table public.blocks   enable row level security;
alter table public.vouchers enable row level security;
alter table public.id_verifications enable row level security;

-- Mutual-invisibility for blocks: neither party should see the other's
-- profile once a block exists in either direction. SECURITY DEFINER so the
-- lookup bypasses blocks_owner's RLS (which only lets a user read block rows
-- they created) — same pattern as handle_mutual_like().
create or replace function public.is_blocked(other_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.blocks b
    where (b.blocker_id = other_id and b.blocked_id = auth.uid())
       or (b.blocker_id = auth.uid() and b.blocked_id = other_id)
  );
$$;

revoke all on function public.is_blocked(uuid) from public;
grant execute on function public.is_blocked(uuid) to authenticated;

-- Admin check for the CALLING user only (never another user's row), so no
-- bypass of profiles_read's own-row branch is actually needed here -- kept
-- SECURITY DEFINER + pinned search_path anyway for defense in depth and to
-- match the is_blocked() pattern.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- profiles: anyone authed can read (discovery) EXCEPT a profile you've
-- blocked or that has blocked you; you may only edit your own.
create policy "profiles_read"   on public.profiles for select to authenticated
  using (id = auth.uid() or not public.is_blocked(id));
create policy "profiles_insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update to authenticated using (auth.uid() = id);
-- ...but you must still be able to see the profiles YOU blocked, so the
-- "Blocked users" screen can list them (is_blocked() is symmetric and would
-- otherwise hide them from you too).
create policy "profiles_read_own_blocklist" on public.profiles for select to authenticated
  using (exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = profiles.id));

-- is_admin / church_verified must never be client-settable (only via direct
-- SQL/dashboard as postgres/service_role, which bypasses grants entirely).
-- A plain `revoke ... (is_admin) from authenticated` is NOT enough here --
-- the existing table-wide INSERT/UPDATE grant on profiles already covers
-- every column including future ones, and a column-specific revoke doesn't
-- override a table-wide grant in Postgres's ACL model. So: revoke the
-- table-wide grant entirely, then re-grant scoped to every column except
-- these two.
revoke insert, update on public.profiles from authenticated, anon;

grant insert (
  id, account_type, display_name, age, gender, location_label, latitude, longitude,
  blood_group, genotype, nationality, qualification, occupation, bio,
  marriage_intentions, church_affiliation, congregation, spirituality_markers,
  life_verse, voice_intro_url, mentor_role, created_at, updated_at, profile_complete,
  privacy_accepted_at, privacy_policy_version
) on public.profiles to authenticated, anon;

grant update (
  id, account_type, display_name, age, gender, location_label, latitude, longitude,
  blood_group, genotype, nationality, qualification, occupation, bio,
  marriage_intentions, church_affiliation, congregation, spirituality_markers,
  life_verse, voice_intro_url, mentor_role, created_at, updated_at, profile_complete,
  privacy_accepted_at, privacy_policy_version
) on public.profiles to authenticated, anon;

-- photos: readable by any authenticated user EXCEPT for a profile involved in
-- a block with you (mirrors profiles_read), write only your own.
create policy "photos_read"   on public.photos for select to authenticated
  using (profile_id = auth.uid() or not public.is_blocked(profile_id));
create policy "photos_read_own_blocklist" on public.photos for select to authenticated
  using (exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = photos.profile_id));
create policy "photos_write"  on public.photos for all    to authenticated
  using (exists (select 1 from public.profiles p where p.id = photos.profile_id and p.id = auth.uid()))
  with check (exists (select 1 from public.profiles p where p.id = photos.profile_id and p.id = auth.uid()));

-- swipes: you can only see/create your own swipes (never read who passed you).
create policy "swipes_owner" on public.swipes for all to authenticated
  using (auth.uid() = swiper_id) with check (auth.uid() = swiper_id);

-- matches: visible only to its two participants.
create policy "matches_participant" on public.matches for select to authenticated
  using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- messages: read/write only within a match you belong to.
create policy "messages_read" on public.messages for select to authenticated
  using (exists (
    select 1 from public.matches m
    where m.id = messages.match_id and (auth.uid() = m.user_a_id or auth.uid() = m.user_b_id)));
create policy "messages_send" on public.messages for insert to authenticated
  with check (
    auth.uid() = sender_id and exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and m.status = 'active'
        and (auth.uid() = m.user_a_id or auth.uid() = m.user_b_id)
        -- a block in either direction also cuts off new messages, not just
        -- profile visibility.
        and not public.is_blocked(
          case when m.user_a_id = auth.uid() then m.user_b_id else m.user_a_id end
        )));

-- reports / blocks: insert-only by the acting user; read only your own.
create policy "reports_insert" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
create policy "reports_read"   on public.reports for select to authenticated using (auth.uid() = reporter_id);
-- moderators read every report for the safety queue.
create policy "reports_admin_read" on public.reports for select to authenticated using (public.is_admin());
create policy "blocks_owner"   on public.blocks  for all    to authenticated
  using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- id_verifications: owner can submit + read their own history; admins can
-- read/update (approve/reject) anyone's. reviewed_by is set by app code to
-- the calling admin's own id -- RLS can't itself force that column's value,
-- so this is an app-level discipline point (documented in the feature spec).
create policy "id_verifications_owner_read" on public.id_verifications
  for select to authenticated using (auth.uid() = profile_id);
create policy "id_verifications_owner_insert" on public.id_verifications
  for insert to authenticated with check (auth.uid() = profile_id);
create policy "id_verifications_admin_read" on public.id_verifications
  for select to authenticated using (public.is_admin());
create policy "id_verifications_admin_update" on public.id_verifications
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- vouchers: the match user manages their own voucher requests.
create policy "vouchers_owner" on public.vouchers for all to authenticated
  using (auth.uid() = match_user_id) with check (auth.uid() = match_user_id);
-- the nominated mentor reads and answers the voucher request addressed to them.
create policy "vouchers_mentor_read" on public.vouchers for select to authenticated
  using (mentor_id = auth.uid());
create policy "vouchers_mentor_update" on public.vouchers for update to authenticated
  using (mentor_id = auth.uid()) with check (mentor_id = auth.uid());

-- ============================================================================
-- STORAGE — photo and voice-intro buckets (PRD 3.2 / 3.4)
-- Applied directly against the project via the Supabase SQL editor; mirrored
-- here so a fresh environment can reproduce it. Both buckets are PRIVATE —
-- all access is mediated by the RLS policies below, not a public bucket flag.
-- Path convention: objects must live under `{auth.uid()}/...` so ownership
-- can be checked via storage.foldername(name)[1].
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos', 'photos', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('voice-intros', 'voice-intros', false, 3145728, array['audio/webm','audio/mp4','audio/mpeg','audio/wav','audio/ogg'])
on conflict (id) do nothing;

-- photos: any authenticated user may read (needed for discovery cards) unless
-- a block exists in either direction, and a user may only write/modify/delete
-- inside their own folder.
create policy "photos_storage_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or not public.is_blocked(((storage.foldername(name))[1])::uuid)
    ));

create policy "photos_storage_select_own_blocklist" on storage.objects for select to authenticated
  using (
    bucket_id = 'photos'
    and exists (
      select 1 from public.blocks b
      where b.blocker_id = auth.uid()
        and b.blocked_id = ((storage.foldername(objects.name))[1])::uuid
    ));

create policy "photos_storage_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos_storage_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "photos_storage_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- voice-intros: same pattern — readable by any authenticated user, writable
-- only within the uploader's own folder.
create policy "voice_storage_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'voice-intros'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or not public.is_blocked(((storage.foldername(name))[1])::uuid)
    ));

create policy "voice_storage_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'voice-intros' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "voice_storage_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'voice-intros' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'voice-intros' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "voice_storage_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'voice-intros' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- REALTIME — enable live updates for chat (PRD: Supabase Realtime)
-- Applied directly against the project; mirrored here so a fresh environment
-- reproduces it.
-- ============================================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.matches;

-- Full replica identity on matches so Realtime UPDATE payloads (status
-- flipping to 'expired', last_activity_at ticking) reliably include the
-- complete new row, not just the primary key. Not needed on messages, which
-- is only ever listened to for INSERT.
alter table public.matches replica identity full;

-- ============================================================================
-- STORAGE — ID verification documents (PRD 3.2)
-- Strictly private in every direction (unlike photos/voice-intros): this is
-- sensitive PII, so only the uploader OR an admin (is_admin()) may read a
-- given document. Admin review UI now exists (approve/reject writes to
-- id_verifications, see above).
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('id-verification', 'id-verification', false, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "id_doc_storage_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'id-verification' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "id_doc_storage_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'id-verification' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "id_doc_storage_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'id-verification' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'id-verification' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "id_doc_storage_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'id-verification' and (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can read (generate signed URLs for) ANY submitted document -- the
-- own-folder policy above only ever lets the uploader read their own, so
-- without this an admin review panel could show metadata but never the
-- actual image.
create policy "id_doc_storage_select_admin" on storage.objects for select to authenticated
  using (bucket_id = 'id-verification' and public.is_admin());

-- ============================================================================
-- EDGE FUNCTIONS
-- ============================================================================
-- expire-stale-chats : 72h Intentionality Circuit Breaker sweep (see above).
-- delete-account     : NDPA right to erasure. Authenticates the caller from
--                      their JWT, clears every object under `{auth.uid()}/`
--                      in the photos / voice-intros / id-verification buckets
--                      (Storage is not covered by DB cascade), then calls
--                      auth.admin.deleteUser(), which cascades every public
--                      table row via the FK on auth.users.
