# Yoked MVP: Expo + Supabase scaffold

Core-loop prototype scaffold for the Yoked Christian relationship app. Built to the
72-hour plan in [`YOKED_72hr_Build_Plan.md`](./YOKED_72hr_Build_Plan.md).

## Stack
- **React Native (Expo, TypeScript)** with `expo-router`
- **Supabase**: Auth, Postgres (+ RLS), Realtime (chat), Storage, one Edge Function
- **Zustand** for state, **react-native-deck-swiper** for discovery

## What's here
```
yoked-mvp/
├─ YOKED_72hr_Build_Plan.md      ← the delivery plan (read first)
├─ app/                          ← expo-router screens
│  ├─ _layout.tsx                ← auth + onboarding routing guard
│  ├─ (auth)/sign-in.tsx
│  ├─ (onboarding)/profile-setup.tsx
│  ├─ (tabs)/discover.tsx        ← swipe deck
│  ├─ (tabs)/matches.tsx         ← active/expired + chat-cap indicator
│  ├─ (tabs)/profile.tsx
│  └─ chat/[matchId].tsx         ← realtime chat
├─ src/
│  ├─ lib/supabase.ts            ← client
│  ├─ store/auth.ts              ← session + profile
│  ├─ theme/colors.ts            ← "Grounded Growth" palette
│  └─ types/models.ts
└─ supabase/
   ├─ schema.sql                 ← tables, triggers, RLS, circuit breaker
   ├─ seed.sql                   ← demo profiles
   └─ functions/expire-stale-chats/index.ts   ← 72h expiry sweep
```

## Setup (Sprint 0, target: installable APK in 2 hours)

1. **Supabase**
   - Create a project. In the SQL editor, run `supabase/schema.sql`.
   - Auth → Providers: enable Email and Google (add OAuth client IDs).
   - Storage: create buckets `photos`, `voice`, `id-docs`.
   - (Optional demo) run `supabase/seed.sql` after creating test auth users.
   - Deploy the Edge Function and schedule it every 6h:
     `supabase functions deploy expire-stale-chats`

2. **App**
   ```bash
   cd yoked-mvp
   cp .env.example .env        # paste your Supabase URL + anon key
   npm install
   npx expo start              # dev
   ```

3. **Add assets** (referenced by `app.json`): `assets/icon.png` and
   `assets/splash.png`, generated from `Yoked official Logo.jpeg`.

## Build the APK (Android 15+)
```bash
npm install -g eas-cli
eas login
eas build:configure
npm run build:apk            # eas build -p android --profile preview
```
EAS returns a download link to a signed, installable `.apk`. Targets
`targetSdkVersion 35` (Android 15) per `app.json`.

## Implemented vs. stubbed
**Working logic:** auth, routing guard, profile creation + completion gating,
swipe → swipe persistence, mutual-match trigger, realtime chat, active-chat-cap
UI + DB enforcement, expired folder, sign out.

**Stubbed for Sprint 1 (marked with comments in code):** Google OAuth call,
real photo/voice/ID uploads to Storage (currently placeholder URLs), PostGIS
distance filtering. See the plan's backlog (§9) for everything deferred.
