alter table public.profiles
  add column if not exists full_name text,
  add column if not exists church_designation text;

grant insert (full_name, church_designation) on public.profiles to authenticated, anon;
grant update (full_name, church_designation) on public.profiles to authenticated, anon;

alter table public.profiles drop column if exists profile_complete;
alter table public.profiles
  add column profile_complete boolean
  generated always as (
    display_name is not null
    and age is not null
    and gender is not null
    and life_verse is not null
    and voice_intro_url is not null
    and bio is not null
    and (account_type <> 'mentor'::account_type or full_name is not null)
  ) stored;
