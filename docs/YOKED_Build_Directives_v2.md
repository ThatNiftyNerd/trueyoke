# TRUEYOKE — Build Directives v2 (Lovable + Capacitor + GitHub CI/CD)

**Author:** Senior Mobile App Developer / Acting Agile PM
**Supersedes:** `YOKED_72hr_Build_Plan.md` (Expo/EAS version)
**Goal:** A signed, installable `.apk` that runs on **Android 11 (API 30) and newer**, built from a **Lovable**-authored codebase, synced through **GitHub** as the CI/CD system of record, within 72 hours — with hard guardrails against AI-generated slop and spaghetti architecture.

---

## 0. What Changed From v1, and Why

| Decision | v1 (superseded) | v2 (this document) |
|---|---|---|
| Frontend authoring | Hand/Claude-written Expo (React Native) | AI-authored in **Lovable** |
| App shell | Native Expo/RN | **React + Vite web app wrapped in Capacitor** |
| Android floor | 15+ | **11+ (API 30)** |
| CI/CD | EAS Build (manual) | **GitHub Actions**, triggered by Lovable's GitHub sync |
| Supabase access | N/A | **BYO Supabase project**, connected to Lovable as an external backend — not Lovable Cloud. Dashboard, SQL editor, service-role key, and Auth provider config stay in your hands. |
| Native Android build | EAS cloud build | **GitHub Actions (`android-build.yml`) or Android Studio locally** — never inside Lovable's sandbox, which has no Android SDK/Gradle/emulator. Lovable's scope stops at producing a verified static, Capacitor-syncable web build. |

**Why the frontend architecture changed:** Lovable generates React DOM (Vite) web apps — it cannot author or edit React Native/Expo code, and it cannot compile a native APK directly. To honor "build it in Lovable" and still ship an installable `.apk`, the app is built as a Lovable web app and wrapped with **Capacitor**, which packages a static, WebView-hosted build into a real Android project buildable by Gradle. This is a real architectural trade: native modules (voice recording, camera, geolocation) go through Capacitor plugins instead of Expo modules, and the app runs in a WebView rather than as a fully native UI. Accept this trade knowingly — it's what makes "Lovable + installable APK" possible at all.

**Framework note (resolved at Sprint 0):** Lovable initially scaffolded this project on **TanStack Start** with SSR, on a template that force-pins its Nitro server to a `cloudflare-module` preset. That preset cannot run under a local/Node preview server, which blocked TanStack Start's own SPA-mode prerender step from ever producing a static `dist/client/index.html` — the file Capacitor needs to load in the WebView. Rather than fight the Cloudflare-Worker runtime mismatch, the project was **migrated off TanStack Start to plain Vite + React + TanStack Router** (standalone, client-side-only router — same file-based routing, `<Link>`, loaders; existing route files under `src/routes/` carried over unchanged). This is now the final frontend stack: **Vite + React + TypeScript + TanStack Router + Tailwind + shadcn/ui**, zero server runtime, `vite build` emits a plain `dist/index.html` + `dist/assets/*` that Capacitor syncs directly. No SPA-mode flag, no prerender step, no Nitro/Cloudflare layer to fight — this class of problem cannot recur.

**Lovable's scope stops at the static bundle.** Lovable's own sandbox has no Android SDK, Java/Gradle toolchain, or emulator, so it cannot run `./gradlew assembleDebug` or produce an installable APK itself. Its job is: static Vite build confirmed, `cap init`/`cap add android`/`cap sync` run, output verified as landing in `android/app/src/main/assets/public`. The actual native compile — the real Sprint 0 gate ("blank Capacitor-wrapped app installs and opens on Android 11") — happens in **GitHub Actions (`android-build.yml`) or Android Studio locally**, never inside Lovable. Do not treat Lovable's static-bundle confirmation as satisfying the gate; it isn't satisfied until an actual `.apk` has installed on a device or emulator.

**Why Android 11 as the floor:** API 30 covers a materially larger device population than API 35 while still supporting scoped storage, runtime permissions, and every Capacitor plugin this app needs. `minSdkVersion = 30`, `compileSdkVersion` = latest stable, `targetSdkVersion` = latest stable Capacitor supports (verify against Capacitor's own release compatibility table at build time — don't hardcode a number here, it will be stale by the time you build). Note: Google Play itself now requires **targetSdkVersion 36 (Android 16)** for new-app submissions as of Aug 31, 2026 — irrelevant for a sideloaded prototype `.apk`, but write it down now so it isn't a surprise if this ever goes to the Play Store.

**Backend is unchanged, and it is a BYO Supabase project — not Lovable Cloud.** `supabase/schema.sql` (RLS, the mutual-like trigger, the 3-active-chat cap trigger, the 72h expiry sweep) is framework-agnostic and stays exactly as-is. Supabase is still the entire backend: Auth, Postgres, Realtime, Storage, one Edge Function.

**Why BYO Supabase, not Lovable Cloud:** Lovable Cloud is Lovable's managed Supabase wrapper — zero-config, but it does not expose the underlying Supabase dashboard (no SQL editor, no project settings, no service-role key, no DB password). Schema changes go through Lovable's migration tool, reviewed and approved per change. That's a real problem for this project specifically:
- The `expire-stale-chats` Edge Function needs elevated (service-role) privileges to flip other users' matches on a schedule — a "must ship" item (§1, item 6) that Lovable Cloud likely can't reliably deploy/schedule without dashboard/CLI access.
- Google OAuth (§1, item 1, "must ship") needs client ID/secret + redirect URI configuration that normally lives in the Supabase Auth dashboard.
- Every future schema tweak (a fixed RLS policy, an added column) has to round-trip through chat approval instead of a direct SQL edit — added latency inside a 72-hour build.

**Directive:** create your own Supabase project (Sprint 0, same as the original plan) and connect Lovable to it as an external Supabase project. Disable/skip Lovable Cloud. You keep the dashboard, the SQL editor, the service-role key, and Auth provider config. Lovable still gets a typed client and can still propose schema changes in chat — you just run them yourself in the SQL editor rather than through Lovable's managed migration path.

---

## 1. Scope (unchanged from v1 — still the contract that protects the deadline)

**Must ship (core loop):**
1. Email + Google auth, account-type selection (Match vs Mentor)
2. Match profile: demographics, photos, bio, marriage intentions, church affiliation, **Life Verse**, spirituality markers
3. 15s voice intro → "Completed Profile" status
4. Swipe discovery with distance/compatibility filters
5. Mutual-match → real-time 1:1 chat (Supabase Realtime)
6. Intentionality Circuit Breaker: 3-active-chat cap + 72h expiry
7. Report / block
8. Level-1 ID upload stub (stores doc, flags "pending review")

**Deferred (documented, not built):** Mentor voucher ledger + character-reference flow, admin moderation dashboard, automated UGC moderation, payments/premium tiers, event access, push notifications, iOS build, Apple Sign-In. Anything not gated by hour 68 moves here — never past the deadline.

---

## 2. Anti-Slop Guardrails (the core of this document)

These are **non-negotiable, CI-enforced rules**, not style suggestions. Their purpose is to stop an AI code generator from producing a codebase that "looks done" in the Lovable preview but is unmaintainable, insecure, or unbuildable outside it.

### 2.1 Prompting discipline in Lovable
- **One scoped change per prompt.** Never prompt "build the whole app" or "build the matching feature" in one shot. Break every feature into the smallest prompt that produces one component, one hook, or one Supabase query at a time. Large single prompts are the single biggest cause of duplicated logic and god-components.
- **Read the diff before accepting.** Use `get_diff` after every `send_message` to Lovable. If the diff touches files you didn't ask it to touch, reject/redo the prompt narrower. Never accept a diff you haven't read.
- **Never let Lovable regenerate a whole file it already built correctly.** Prompt incremental edits ("add a loading state to X") not rewrites ("redo the discover screen").
- **No prompt may introduce a new state-management pattern, folder, or dependency without it being named explicitly in the prompt.** AI agents default to inventing new patterns per screen if not constrained; this is the #1 spaghetti generator.

### 2.2 Architecture rules (enforced by code review + CI lint rules, not vibes)
- **Feature-folder structure, not type-folder soup:**
  ```
  src/
    features/
      auth/            (screens, hooks, api calls for auth only)
      profile/
      discovery/
      matches/
      chat/
      safety/          (report/block)
    lib/
      supabase.ts      (single client instance, imported everywhere else)
      capacitor/       (native plugin wrappers: voice, camera, geolocation)
    components/ui/     (shared, dumb, presentational only — shadcn primitives)
    theme/             (Grounded Growth tokens — single source, see §5)
    types/
  ```
- **One Supabase client instance, one place.** No feature file may call `createClient()`. Every data access goes through `src/lib/supabase.ts` and typed query functions in that feature's `api.ts` — never inline `.from('table')` calls scattered across components.
- **No component over ~200 lines.** If a screen component grows past that, it must be decomposed into subcomponents/hooks. This is a CI-checkable line-count lint, not a suggestion.
- **No business logic in JSX.** Circuit-breaker cap checks, match-eligibility logic, and expiry logic live in `lib`/`features/*/logic.ts`, unit-tested, and are called from components — never inlined in a render function.
- **Business rules that can live in Postgres stay in Postgres.** The 3-chat cap and 72h expiry are DB triggers/Edge Functions, not client-side checks with a DB check as an afterthought. Client-side duplicates of these rules (if any, e.g. for optimistic UI) must be clearly commented as "UI-only optimism, source of truth is the DB trigger."
- **No `any`.** TypeScript strict mode on, `noImplicitAny`, `strictNullChecks`. A generated Supabase types file (`supabase gen types typescript`) is the only source of DB row types — never hand-typed duplicates that drift from the schema.
- **No dead/commented-out code merged to `main`.** If Lovable leaves scaffolding comments or stubbed functions, they're removed or turned into tracked TODOs with an issue link — not left floating.
- **Theme tokens only, no hardcoded hex.** Every color reference resolves to `theme/colors.ts` (Grounded Growth palette, §5). A hardcoded `#6B1724` anywhere outside that file is a review-blocking finding.

### 2.3 Mandatory review gate (human-in-the-loop, every merge)
Every PR — even AI-generated — requires a human pass before merge, checking:
1. Does the diff match what was prompted (no scope creep)?
2. Any duplicated logic that already exists elsewhere in the codebase?
3. Any new dependency added without justification in the PR description?
4. Any RLS-bypassing client code (e.g., a service-role key leaked into client bundle — this is an instant block, not a nitpick)?
5. Does it pass every CI gate in §3 before it's even eligible for review?

### 2.4 Definition of "slop" for this project (so it's not subjective)
Flag and fix on sight: duplicate fetch logic for the same table in two+ files; components that both fetch data AND render AND handle business rules in one file; magic numbers/strings instead of named constants (`3` for chat cap, `72` for expiry — these are named constants imported from one place); inconsistent error handling (some screens swallow errors, some don't); any secret (Supabase service key, OAuth client secret) committed to the repo or shipped in the client bundle.

---

## 3. GitHub as the CI/CD Pipeline

### 3.1 Repo setup
- One GitHub repo, Lovable's **GitHub sync** enabled (Settings → Connectors → GitHub in Lovable) so every AI-generated change lands as a real commit, not trapped in Lovable's own history.
- **Branch protection on `main`:** no direct pushes, PRs required, all required status checks below must pass, at least one human review approval required.
- Lovable syncs to a working branch (or `main` if you accept every AI change going live — not recommended); promote to `main` via PR so the review gate in §2.3 is unavoidable.

### 3.2 Required GitHub Actions workflows
**`ci.yml`** — runs on every push and PR:
- `npm ci`
- `npm run typecheck` (tsc `--noEmit`, strict mode — build fails on any `any`-related or type error)
- `npm run lint` (ESLint with the component-size and no-inline-supabase-call custom rules from §2.2)
- `npm test` (unit tests for `features/*/logic.ts` — circuit breaker, expiry, match-eligibility logic; these are the only pieces of client logic with real branching, so they're the only ones that must have tests before this deadline)
- `npm run build` (Vite production build — catches anything that only worked in Lovable's dev preview)

**`android-build.yml`** — runs on push to `main` (or manually dispatched). **This is where the native Android build actually happens** — Lovable's own sandbox has no Android SDK/Gradle/JDK/emulator and cannot produce an APK; its job ends at a verified static, Capacitor-syncable `dist/` (SPA mode on, no SSR — see §0). This workflow picks up from there:
- Checkout → `npm ci` (or `bun install`, matching whatever Lovable's TanStack Start scaffold uses) → `npm run build` (SPA-mode static build)
- `npx cap sync android`
- Set up JDK + Android SDK (via `android-actions/setup-android`)
- `./gradlew assembleDebug` always runs, producing `yoked-debug-apk`. `./gradlew assembleRelease` also runs whenever the `ANDROID_RELEASE_KEYSTORE_BASE64` secret is present, producing a properly signed `yoked-release-apk` — this is the artifact that should be distributed for testing/sideloading. If release secrets aren't configured on a fork, the release steps are skipped automatically and the debug build still succeeds.
- Upload the `.apk` as a workflow artifact (and optionally to a GitHub Release) so it's downloadable without a local build

This is the whole CI/CD system: **GitHub Actions is both your quality gate and your build server.** No separate build service needed. If you want a faster local smoke test before pushing, running the same `cap sync` → `./gradlew assembleDebug` steps in **Android Studio** is equivalent and fine — but the GitHub Actions run is the canonical, reproducible build of record.

### 3.3 Secrets

Supabase URL + anon key: fine as build-time env vars (anon key is public by design under RLS). Supabase **service-role** key: GitHub Actions Secrets only, never in `.env` committed to the repo, never referenced from client-side code.

**Android release signing (added August 11, 2026 — see §9):**
| Secret name | Value |
|---|---|
| `ANDROID_RELEASE_KEYSTORE_BASE64` | base64 of the `.keystore` file |
| `ANDROID_RELEASE_STORE_PASSWORD` | keystore password |
| `ANDROID_RELEASE_KEY_ALIAS` | `yoked-release` |
| `ANDROID_RELEASE_KEY_PASSWORD` | same as store password (PKCS12 requires they match) |

Set under GitHub repo → Settings → Secrets and variables → Actions. Never pasted into Lovable chat, committed to the repo, or logged in CI output. The keystore file itself is not in version control — see §9 for where the durable copy lives.

---

## 4. Android 11+ Compatibility Directives

- `minSdkVersion 30`, verify every Capacitor plugin used (camera, geolocation, filesystem for voice recording) explicitly supports API 30 in its own compatibility docs before adding it — don't discover this at build time.
- Runtime permissions (RECORD_AUDIO, CAMERA, ACCESS_FINE_LOCATION, READ_MEDIA_IMAGES) must be requested via the Capacitor permissions API with explicit rationale UI — scoped storage rules differ meaningfully between API 30 and later Android versions, so this is not "request once and forget."
- Test on a real or emulated **Android 11 device**, not just whatever the dev's physical phone happens to run — WebView version drift across Android 11–16 is the most likely source of "works on my phone, breaks on the demo device."
- Splash/adaptive icon and status bar theming must be verified against Capacitor's Android config (`capacitor.config.ts` + native `res/` overrides), not assumed to inherit from the web CSS.

---

## 5. "Grounded Growth" Design Tokens (unchanged, single-sourced)

| Token | Hex | Use |
|---|---|---|
| `burgundy` (primary) | `#6B1724` | Headers, nav, primary text/buttons |
| `sage` (accent) | `#87A987` | Verification badges, voucher/Life-Verse frames |
| `linen` (canvas) | `#F4F1EA` | App background |
| `terracotta` (functional) | `#C97B5A` | Circuit-breaker cap indicators, expiry warnings **only** |

Lives in `src/theme/colors.ts` and, since this is now a Tailwind project, also mapped into `tailwind.config` theme extension — no raw hex in component files (§2.2 CI-enforced).

---

## 6. The 72-Hour Schedule

### Sprint 0 — Hours 0–2, Foundation (do not skip)
- **Disconnect Lovable Cloud** (workspace admin: Cloud tab → Advanced → Disconnect — irreversible, do this before any real data exists).
- **Create your own Supabase project** — `schema.sql` applied via the SQL editor, `seed.sql` optionally, OAuth providers (Email + Google) enabled, Storage buckets (`photos`, `voice`, `id-docs`) created. Paste the Project URL + anon/publishable key back to Lovable so it can swap `.env` and `src/integrations/supabase/client.ts`.
- Confirm the frontend is plain **Vite + React + TanStack Router** (not TanStack Start/SSR — see §0) and `vite build` emits a plain `dist/index.html` + `dist/assets/*`.
- Lovable project created, GitHub sync turned on, repo cloned locally.
- `ci.yml` and `android-build.yml` committed and green on a trivial "hello world" screen **before any real feature work starts.**
- `npx cap add android`, `npx cap sync` (confirm it copies cleanly into `android/app/src/main/assets/public`), then confirm a debug `.apk` actually builds and installs — **via `android-build.yml` in GitHub Actions, or Android Studio locally.** Lovable cannot run this step itself (no Android SDK/Gradle in its sandbox); don't accept "the static bundle looks right" as satisfying this gate.
- **Gate:** blank Capacitor-wrapped app installs and opens on Android 11. If the build pipeline doesn't work now, it won't work at hour 70 — this is the highest-leverage two hours of the whole plan.

### Sprint 1 — Hours 2–26, Auth + Profile + Verification
- Auth screens, account-type picker, multi-step profile builder (demographics → photos → bio/intentions → church + spirituality markers → Life Verse → 15s voice intro via Capacitor's microphone plugin).
- Every screen built as small, reviewed Lovable prompts per §2.1 — not one mega-prompt for "the whole onboarding flow."
- **Gate:** new user signs up, completes a persisted profile, PR merged through the review gate.

### Sprint 2 — Hours 26–50, Discovery + Matching + Chat
- Swipe deck, distance/compatibility filters, mutual-match detection (DB trigger, unchanged), realtime 1:1 chat.
- Circuit breaker UI (terracotta warning) wired to the DB trigger's rejection, not a client-side reimplementation of the cap logic.
- **Gate:** two test accounts match and chat live; 4th chat attempt is blocked by the DB trigger with a correct UI message.

### Sprint 3 — Hours 50–68, Safety, Polish, Ship
- Report/block flows, `expire-stale-chats` Edge Function deployed and scheduled.
- Empty/loading/error states, palette QA against §5, app icon + splash from `TrueYoke official Logo.jpeg`.
- Seed demo profiles. Final signed release `.apk` (real release key, not debug-signed) built via `android-build.yml`, downloaded from the `yoked-release-apk` artifact, installed and smoke-tested on a real Android 11 device.
- **Gate:** signed APK installs clean, full loop runs end-to-end, CI is green on `main`.

### Hours 68–72: Buffer (unallocated by design)

---

## 7. Risk Register (updated for v2)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Capacitor WebView loses native fidelity (voice/camera feel laggy or plugin gaps) | Med | High | Pin plugin versions verified against API 30 in Sprint 0; fallback to "skip voice" if a plugin blocks, same as v1's mitigation. |
| Lovable produces broad, unscoped diffs (slop) | **High** | High | §2.1 prompting discipline + §2.3 mandatory diff review before every merge. |
| GitHub Actions Android build environment misconfigured (JDK/SDK versions) | Med | High | De-risk in Sprint 0, hours 0–2, exactly like the old EAS risk — same lesson, new tool. |
| Business logic duplicated client + DB, drifts apart | Med | Med | Circuit breaker/expiry logic stays DB-authoritative; client is UI-only optimism, explicitly commented. |
| Scope creep (Mentor/admin/payments) | High | High | §1 scope is contractual; deferred list is the pressure valve. |
| Play Store target API 36 requirement | Low (sideload prototype) | Low now / Med later | Documented in §0; irrelevant until/unless this goes to Play Store. |
| TanStack Start's Cloudflare-pinned Nitro preset blocked static export | Was High, resolved | High | Resolved by migrating off TanStack Start to plain Vite + React + TanStack Router (§0) — no server runtime, no SSR/prerender step to fight. |
| Lovable Cloud's missing dashboard/service-role access blocks OAuth config or the scheduled Edge Function | Was High, now avoided | High | Resolved by going BYO Supabase (§0) instead of Lovable Cloud. |
| Native Android build attempted inside Lovable's sandbox (no SDK/Gradle there) wastes a cycle | Med | Low (time) | §0/§3.2/§6 now state explicitly: Lovable's scope ends at a verified static bundle; the Gradle/APK build runs in GitHub Actions or Android Studio. |

---

## 8. Definition of Done (prototype)

A signed `.apk`, built via GitHub Actions from a Lovable+GitHub-synced repo, that on a clean Android 11+ device:
1. Installs and launches without a dev server.
2. Full core loop (§1, items 1–8) works end-to-end.
3. Every merge to `main` passed `ci.yml` (typecheck, lint, test, build) and a human review against §2.3.
4. No hardcoded secrets, no `any` types, no component over ~200 lines, no raw hex outside `theme/colors.ts`.
5. Renders in the Grounded Growth palette throughout.

---

## 9. Release Signing (added August 11, 2026)

The debug-signed APK (Android's well-known default debug keystore, `trueyoke-debug.keystore`) was flagged as malware by Windows Defender when downloaded — a common AV heuristic false positive for hybrid/Capacitor apps signed with the standard debug key, not an actual security issue with the app itself. It remained committed and in use for CI debug builds (App Links verification needs a stable fingerprint — see the comment in `android/app/build.gradle`), but is no longer what gets distributed.

**What changed:** a real, dedicated release signing key (`yoked-release`, RSA 2048, self-signed, 30-year validity) was generated and wired into `android/app/build.gradle` and `.github/workflows/android-build.yml` via environment variables sourced from GitHub Actions Secrets (§3.3) — never hardcoded, never committed. `public/.well-known/assetlinks.json` now lists both the debug and release SHA-256 fingerprints so Android App Links verification keeps working for both build types.

**Where the keystore lives:** the `.keystore` file and its password are not in version control (by design — a leaked signing key can never be rotated for an already-installed app without users reinstalling fresh). The durable copy is held by the project owner outside the repo. **Losing this keystore permanently blocks signing any future update to an already-distributed release build** — back it up somewhere durable (password manager attachment, encrypted archive, etc.), not just the one location it was generated into.

**CI behavior:** `android-build.yml` builds `assembleDebug` unconditionally and `assembleRelease` only when the release secrets are present, so the pipeline degrades gracefully (e.g. on forks) rather than failing outright.
