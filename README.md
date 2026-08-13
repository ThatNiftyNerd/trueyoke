# TrueYoke (MVP)

TrueYoke is a purpose-built relationship and marriage-oriented mobile application for members of the
Church of Christ and broader conservative Christian communities. It prioritizes spiritual alignment
and "marriage-mindedness" over casual dating mechanics: verified profiles, a mandatory Life Verse and
voice introduction, and an "Intentionality Circuit Breaker" (3-active-chat cap + 72h expiry) that keeps
the match pool high-intent.

Full product requirements: [`docs/YOKED prd.pdf`](docs/YOKED%20prd.pdf) and
[`docs/Yoked_FRD_MVP_Growth_Strategy.pdf`](docs/Yoked_FRD_MVP_Growth_Strategy.pdf).

## This is the live repo

This repo is connected to Lovable's GitHub sync — every AI-generated change in the Lovable project
lands here as a real commit. (Note: this repo was created by Lovable under the internal project label
"Faithful Union" and was renamed to `yoked` to match the product name at the time.)

Naming history, continued: the product was renamed again from **Yoked** to **TrueYoke** (final, locked in).
All user-facing copy, the Capacitor `appId` (`app.trueyoke.mobile`), and the Android app name now read
TrueYoke; older `YOKED_*` doc filenames and the archived `legacy/` prototype keep their historical names.

## Current build plan

The active plan is **[`docs/TrueYoke_Build_Directives_v2.md`](docs/TrueYoke_Build_Directives_v2.md)** — read this first.

- **Frontend:** authored in [Lovable](https://lovable.dev) — Vite + React 19 + TypeScript +
  TanStack Router (SPA, no SSR) + Tailwind v4 + shadcn/ui — wrapped in
  [Capacitor](https://capacitorjs.com) to produce an installable Android `.apk`. The native `android/`
  project is committed (Lovable manages it directly).
- **Backend:** [Supabase](https://supabase.com) — Auth, Postgres + RLS, Realtime, Storage, one Edge
  Function. **BYO Supabase, not Lovable Cloud** — schema lives in
  [`supabase/schema.sql`](supabase/schema.sql) and is framework-agnostic; run it directly in the
  Supabase SQL editor. Don't let Lovable auto-generate a competing schema.
- **CI/CD:** GitHub Actions — `ci.yml` (lint/typecheck/build) and `android-build.yml` (Capacitor sync +
  real `gradlew assembleDebug`, uploads the APK as a workflow artifact).
- **Target device floor:** Android 11 (API 30) and newer — `android/variables.gradle` sets
  `minSdkVersion = 30`.
- **Initial Lovable prompt:** [`docs/YOKED_Lovable_Init_Prompt.md`](docs/YOKED_Lovable_Init_Prompt.md).

## Repository layout

```
docs/                 PRD, FRD, build directives, Lovable init prompt — read these first
supabase/             schema.sql (tables, RLS, circuit-breaker triggers), seed.sql, config.toml,
                       expire-stale-chats Edge Function
src/                  the app itself (Lovable-synced)
android/              committed native Capacitor project (Lovable-managed)
assets/               brand logo + splash reference images
legacy/               superseded v1 (Expo/React Native + EAS) prototype — reference only
```

## Secrets

`.env` is gitignored — copy `.env.example`, fill in your Supabase project's URL and publishable
(anon) key. CI reads the same values from GitHub Actions Secrets (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`) — add those in Settings → Secrets and variables → Actions.

## Monetization (reference; not built in the MVP)

Free ($0) · Premium ($9.99/mo) · Verified+ ($14.99/mo) · Concierge ($99+/mo). Out of scope for this
prototype — see the build directives' scope section.

## Anti-slop guardrails

This project has explicit, CI-enforced rules against AI-generated spaghetti code (feature-folder
architecture, no god components, single Supabase client, no hardcoded secrets/colors, mandatory human
review on every merge). See §2 of `docs/TrueYoke_Build_Directives_v2.md` before opening a PR.
