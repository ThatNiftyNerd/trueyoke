# YOKED MVP: 72-Hour Prototype Delivery Plan

**Author:** Senior Mobile Developer / Acting Agile PM
**Goal:** A working, signed `.apk` that installs and runs on any Android 15+ device, demonstrating the Yoked core loop, within 72 hours.
**Stack (per project mandate):** React Native (Expo) + Supabase.
**Team:** 1 solo full-stack developer.

---

## 1. Scope Decision (read this first)

The PRD describes a full product. A 72-hour solo prototype cannot ship all of it, so this plan commits to the **Core Loop** and explicitly defers the rest. This is the single most important planning decision: it protects the deadline.

### In scope: "Must ship" (the demoable core loop)
| # | Feature | PRD ref |
|---|---------|---------|
| 1 | Email + Google auth, account-type selection (Match vs Mentor) | 3.1 |
| 2 | Match profile creation: demographics, photos, bio, marriage intentions, church affiliation, **Life Verse**, spirituality markers | 3.2 |
| 3 | Voice intro recording (15s) → "Completed Profile" status | 3.4 |
| 4 | Swipe discovery with distance/compatibility filters | 3.3 |
| 5 | Mutual-match → real-time 1:1 chat (Supabase Realtime) | 3.4 |
| 6 | **Intentionality Circuit Breaker**: 3 active-chat cap + 72h expiry | 3.3 |
| 7 | Report / block | 3.5 |
| 8 | Level-1 ID upload stub (stores doc, flags "pending review") | 3.2 |

### Deferred: documented, not built (post-prototype backlog)
Mentor voucher ledger & character-reference email flow (3.2/3.5), full admin moderation dashboard (3.5), automated image/UGC moderation (5.2), encryption-at-rest beyond Supabase defaults (5.2), payments / premium tiers / concierge (6), event access, push notifications, iOS build, Apple Sign-In.

> **Rationale:** Items 1–8 form the only loop that *demonstrates the product thesis*: intentional, verified, faith-aligned matching. Everything deferred is either a separate persona (Mentor), an ops surface (admin), or monetization, none of which a prototype needs to prove the concept.

### Stack reconciliation (PRD vs. mandate)
The PRD §5.1 lists Node/Express + Firebase Auth + Socket.IO + GCP. The project mandate overrides this with **Supabase**, which is the correct call for a 72-hour build: Supabase replaces *four* PRD components at once: Postgres (the PRD's chosen DB), Auth (replaces Firebase), Realtime (replaces Socket.IO), and Storage (photos/voice/ID), with no server to write, deploy, or babysit. We keep PostgreSQL exactly as the PRD wants; we simply drop the bespoke API layer.

---

## 2. Architecture

```
┌──────────────────────────────────────────────┐
│  React Native app (Expo, TypeScript)         │
│  • expo-router navigation                    │
│  • Zustand (lightweight state)               │
│  • react-native-deck-swiper (discovery)      │
│  • expo-av (voice intro), expo-image-picker  │
│  • expo-location (distance filter)           │
└───────────────┬──────────────────────────────┘
                │ @supabase/supabase-js
┌───────────────▼──────────────────────────────┐
│  Supabase (managed)                          │
│  • Auth: email + Google OAuth                 │
│  • Postgres: all relational data + RLS        │
│  • Realtime: messages table subscriptions     │
│  • Storage: photos / voice intros / ID docs   │
│  • Edge Function (1): expire-stale-chats (cron)│
└──────────────────────────────────────────────┘
```

**Why no custom backend:** Row-Level Security pushes authorization into the database, so the client can talk to Postgres directly and safely. The single piece of server logic that can't live in RLS, the 72-hour chat expiry sweep, runs as one scheduled Edge Function. That is the whole backend.

---

## 3. Data Model (summary; full SQL in `supabase/schema.sql`)

- **profiles**: 1:1 with `auth.users`; `account_type` (`match` | `mentor`), demographics, `bio`, `marriage_intentions`, `church_affiliation`, `life_verse`, `spirituality_markers[]`, `voice_intro_url`, `profile_complete` (generated), `id_verification_status`, lat/long.
- **photos**: N per profile, ordered, Storage paths.
- **swipes**: `(swiper, swipee, direction)`; a mutual right-swipe creates a match (trigger).
- **matches**: pair + `status` (`active` | `expired`), `last_activity_at`.
- **messages**: match-scoped, Realtime-subscribed.
- **reports / blocks**: safety.
- **vouchers**: schema included but UI deferred (forward-compatible).

Two business rules enforced in the DB, not the client:
1. **Active-chat cap (3):** a `BEFORE INSERT` trigger on `matches` rejects a 4th active conversation.
2. **72h expiry:** `expire-stale-chats` Edge Function flips matches with `last_activity_at < now() - 72h` to `expired`.

RLS: every table is owner-or-participant scoped. Reports are insert-only for users; nobody can read another user's swipes.

---

## 4. The 72-Hour Schedule (Agile, 3 one-day sprints)

Solo cadence: ~10 focused hours/day, three sprints, each ending in a runnable build. Each sprint has a demo gate: if it doesn't run, fix before advancing.

### Sprint 0: Hours 0–2, Foundation (do not skip)
- Create Supabase project; run `schema.sql`; enable Google OAuth provider; create Storage buckets (`photos`, `voice`, `id-docs`).
- `npx create-expo-app`, install deps, wire `supabase.ts` client + `.env`.
- Confirm a throwaway EAS cloud build produces an installable `.apk` **on hour 2, not hour 70.** De-risking the build pipeline first is the highest-leverage move in the whole plan.
- **Gate:** blank app opens on an Android 15 device/emulator.

### Sprint 1: Hours 2–26, Auth + Profile + Verification
- Auth screens: sign up / log in / Google; account-type picker.
- Profile builder (multi-step): demographics → photos (Storage upload) → bio/intentions → church + spirituality markers → **Life Verse** → 15s voice intro.
- `profile_complete` gating; Level-1 ID upload stub.
- Theme system from the "Grounded Growth" palette (see §6).
- **Gate:** a new user signs up and creates a complete, persisted profile.

### Sprint 2: Hours 26–50, Discovery + Matching + Chat
- Discovery deck (`react-native-deck-swiper`) with distance + compatibility filters; swipes persisted.
- Mutual-match detection (DB trigger) → match list.
- Real-time 1:1 chat via Supabase Realtime; optimistic send.
- Circuit breaker: enforce 3-active-chat cap (terracotta warning UI), surface "Expired" folder.
- **Gate:** two test accounts match and exchange live messages; 4th chat is blocked with the correct nudge.

### Sprint 3: Hours 50–68, Safety, Polish, Ship
- Report/block flows; deploy `expire-stale-chats` (schedule every 6h).
- Empty/loading/error states; palette QA; app icon + splash from `Yoked official Logo.jpeg`.
- Seed 8–10 demo profiles for a live discovery feed.
- Final **production EAS APK build**, signed; install + smoke-test on a real Android 15 device.
- **Gate:** signed APK installs clean and runs the full loop end-to-end.

### Hours 68–72: Buffer
Reserved for the inevitable build-signing or device-compat surprise. **Unallocated by design**: if you're using this window for features, the plan failed earlier.

---

## 5. Duty Breakdown (solo, wearing each hat)

| Hat | Responsibilities |
|-----|------------------|
| **PM / Scrum** | Guard scope (§1), enforce sprint gates, move slips to the deferred list rather than the deadline. |
| **Backend** | Schema, RLS, triggers, Edge Function, Storage buckets, OAuth config. |
| **Frontend** | Expo app, navigation, screens, state, theming. |
| **QA / Release** | Per-sprint smoke tests, EAS build pipeline, on-device verification, signing. |

**Standing rule:** at each gate, anything not done is *cut to the backlog*, never allowed to push the 72h boundary.

---

## 6. "Grounded Growth" Design Tokens (PRD §5.3)

| Token | Hex | Use |
|-------|-----|-----|
| `burgundy` (primary) | `#6B1724` | Headers, nav, primary text/buttons |
| `sage` (accent) | `#87A987` | Verification badges, voucher/Life-Verse frames, highlights |
| `linen` (canvas) | `#F4F1EA` | App background |
| `terracotta` (functional) | `#C97B5A` | Circuit-breaker cap indicators, 72h expiry warnings **only** |

Shipped as `src/theme/colors.ts` so the palette is consistent and single-sourced.

---

## 7. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| APK build/signing fails late | Med | **High** | Build an installable APK in Sprint 0, hours 0–2. |
| Realtime chat complexity overruns | Med | High | Use Supabase Realtime (managed), not custom sockets; timebox to Sprint 2. |
| Voice recording native quirks on Android 15 | Med | Med | `expo-av`; test on-device early; degrade to "skip voice" if blocked. |
| Scope creep (vouchers/admin pull focus) | **High** | High | §1 scope is contractual; deferred list is the pressure valve. |
| Google OAuth redirect misconfig | Med | Med | Configure + verify in Sprint 0 alongside the build smoke test. |
| Solo fatigue over 72h | High | Med | Buffer (68–72h) unallocated; gates prevent late surprises. |

---

## 8. Definition of Done (prototype)

A signed `.apk` that, on a clean Android 15+ device:
1. Installs and launches without a dev server.
2. Lets a new user sign up (email or Google) and pick an account type.
3. Lets a Match build a complete profile incl. Life Verse + 15s voice intro.
4. Shows a swipe discovery feed with distance/compatibility filters.
5. Creates a match on mutual like and supports real-time chat.
6. Enforces the 3-active-chat cap and shows the Expired folder.
7. Supports report/block.
8. Renders in the Grounded Growth palette throughout.

---

## 9. Post-Prototype Backlog (next sprints, prioritized)

1. Mentor persona: voucher ledger + email character-reference flow (3.2/3.5).
2. Admin moderation dashboard + automated image moderation (3.5/5.2).
3. Payments + premium/Verified+/Concierge tiers (6).
4. Push notifications, iOS build + Apple Sign-In.
5. Church-affiliation automated verification (Level-2 badge).
6. Analytics for the PRD KPIs (MAU, premium conversion, match-to-message, verified ratio, retention).
