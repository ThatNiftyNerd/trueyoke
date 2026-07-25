-- Demo profiles so the Discover deck isn't empty during the prototype demo.
-- Run AFTER schema.sql. These insert into profiles only; in a real flow each
-- row would correspond to an auth.users record. For the demo, create matching
-- auth users first (or temporarily drop the FK), then run this.
--
-- Quick path for the demo: create 8 test users via the Supabase Auth dashboard,
-- collect their UUIDs, and substitute them below.

insert into public.profiles
  (id, account_type, display_name, age, gender, location_label, occupation,
   bio, marriage_intentions, church_affiliation, congregation, life_verse,
   spirituality_markers, voice_intro_url, church_verified, id_verification_status)
values
  ('00000000-0000-0000-0000-000000000001', 'match', 'Grace', 28, 'female', 'Lagos', 'Nurse',
   'Worship leader, lover of hospitality, ready to build a Christ-centered home.',
   'Marriage within 12–18 months.', 'Church of Christ', 'Ikeja congregation', 'Proverbs 31:30',
   '{"A cappella worship","Weekly communion","Active in ministry"}', 'placeholder://voice', true, 'verified'),
  ('00000000-0000-0000-0000-000000000002', 'match', 'Daniel', 31, 'male', 'Abuja', 'Software Engineer',
   'Quietly devoted, deacon-in-training, values intentional courtship.',
   'Seeking marriage, no rush but purposeful.', 'Church of Christ', 'Garki congregation', 'Joshua 24:15',
   '{"Bible as sole authority","Daily personal study"}', 'placeholder://voice', true, 'pending')
on conflict (id) do nothing;
