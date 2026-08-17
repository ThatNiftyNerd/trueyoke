-- Church affiliation verification (Level 2 badge), manual admin review.
-- Mirrors the existing id_verifications pattern exactly: a private evidence
-- bucket, an append-only submissions table, owner-only insert/read RLS, and
-- admin review gated by the same `verification.review` /
-- `verification.reveal_document` permissions already used for ID review.
-- profiles.church_verified already exists (added in an earlier revision but
-- never wired to anything real) -- this migration is what finally sets it.

create type public.church_verification_status as enum ('pending', 'verified', 'rejected');

create table public.church_verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  evidence_path text not null,
  status public.church_verification_status not null default 'pending',
  reviewed_by uuid references public.admin_users(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

alter table public.church_verifications enable row level security;

create policy church_verifications_owner_insert
  on public.church_verifications for insert to authenticated
  with check (auth.uid() = profile_id);

create policy church_verifications_owner_read
  on public.church_verifications for select to authenticated
  using (auth.uid() = profile_id);

create policy church_verifications_admin_read
  on public.church_verifications for select
  using (has_admin_permission('verification.review'));

create policy church_verifications_admin_update
  on public.church_verifications for update
  using (has_admin_permission('verification.review'))
  with check (has_admin_permission('verification.review'));

-- Server-authoritative sync: only an approved review flips the profile-level
-- badge flag, and only via this trigger -- never a direct client write to
-- profiles.church_verified (there is deliberately no RLS grant for that
-- column to anon/authenticated; see the follow-up REVOKE below).
create or replace function public.sync_church_verified()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'verified' and old.status is distinct from new.status then
    update public.profiles set church_verified = true where id = new.profile_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_church_verified on public.church_verifications;
create trigger trg_sync_church_verified
  after update on public.church_verifications
  for each row execute function public.sync_church_verified();

-- profiles.church_verified must only ever be set by the trigger above (which
-- runs as SECURITY DEFINER and bypasses this), never directly by a client.
revoke update (church_verified) on public.profiles from authenticated, anon;

-- Private evidence bucket, same shape as id-verification.
insert into storage.buckets (id, name, public)
values ('church-verification', 'church-verification', false)
on conflict (id) do nothing;

create policy church_doc_storage_insert_own
  on storage.objects for insert to authenticated
  with check (bucket_id = 'church-verification' and (storage.foldername(name))[1] = auth.uid()::text);

create policy church_doc_storage_select_own
  on storage.objects for select
  using (bucket_id = 'church-verification' and (storage.foldername(name))[1] = auth.uid()::text);

create policy church_doc_storage_select_admin
  on storage.objects for select
  using (bucket_id = 'church-verification' and has_admin_permission('verification.reveal_document'));

create policy church_doc_storage_update_own
  on storage.objects for update to authenticated
  using (bucket_id = 'church-verification' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'church-verification' and (storage.foldername(name))[1] = auth.uid()::text);

create policy church_doc_storage_delete_own
  on storage.objects for delete to authenticated
  using (bucket_id = 'church-verification' and (storage.foldername(name))[1] = auth.uid()::text);
