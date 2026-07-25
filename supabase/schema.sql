-- ============================================================================
-- YOKED MVP — Supabase / Postgres schema
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

  -- verification (PRD 3.2)
  id_verification_status id_status not null default 'none',
  church_verified        boolean   not null default false,

  -- mentor-only (deferred UI, schema forward-compatible)
  mentor_role          text,                 -- elder | preacher | deacon

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- A profile is "complete" only when the mandatory MVP fields + voice intro exist.
alter table public.profiles
  add column profile_complete boolean
  generated always as (
    display_name is not null
    and age is not null
    and gender is not null
    and life_verse is not null
    and voice_intro_url is not null
    and bio is not null
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
returns trigger language plpgsql security definer as $$
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
returns trigger language plpgsql as $$
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
returns trigger language plpgsql as $$
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
returns trigger language plpgsql as $$
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

-- profiles: anyone authed can read (discovery); you may only edit your own.
create policy "profiles_read"   on public.profiles for select to authenticated using (true);
create policy "profiles_insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update to authenticated using (auth.uid() = id);

-- photos: read all (needed in discovery), write only your own.
create policy "photos_read"   on public.photos for select to authenticated using (true);
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
        and (auth.uid() = m.user_a_id or auth.uid() = m.user_b_id)));

-- reports / blocks: insert-only by the acting user; read only your own.
create policy "reports_insert" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
create policy "reports_read"   on public.reports for select to authenticated using (auth.uid() = reporter_id);
create policy "blocks_owner"   on public.blocks  for all    to authenticated
  using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- vouchers: the match user manages their own voucher requests.
create policy "vouchers_owner" on public.vouchers for all to authenticated
  using (auth.uid() = match_user_id) with check (auth.uid() = match_user_id);
