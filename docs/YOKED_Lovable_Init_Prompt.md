# Lovable Initialization Prompt — paste as the first message when creating the project

This is Sprint 0 only: scaffolding, architecture, theme, and empty routed screens. It deliberately does **not** ask Lovable to build feature logic in one shot (per the anti-slop rules in `YOKED_Build_Directives_v2.md` §2.1) — that comes in small, scoped follow-up prompts per feature.

---

```
Initialize a new project called "TrueYoke" — a faith-centered relationship/marriage app for Church of Christ
and conservative Christian communities. This first message is SCAFFOLDING ONLY: set up architecture, theme,
navigation, and empty screens. Do not implement any feature logic yet — I will send small, scoped prompts
for each feature afterward. Do not take creative liberties beyond what's specified below; if something is
ambiguous, leave a clearly marked TODO comment instead of inventing behavior.

CONTEXT / TARGET PLATFORM
This web app will be wrapped in Capacitor and shipped as an installable Android APK (min Android 11 / API 30),
not used as a marketing site. Design and build accordingly:
- Mobile-first, single-column, touch-first layouts. No hover-dependent interactions.
- Avoid browser-only APIs that Capacitor can't bridge (no reliance on desktop-only File System Access API, etc.).
- Bottom tab navigation for the main app (Discover / Matches / Profile), not a desktop-style top nav.

TECH STACK
- React + TypeScript + Vite + Tailwind CSS + shadcn/ui (your standard stack).
- Supabase for Auth, Postgres, Realtime, and Storage.
- IMPORTANT: Do NOT auto-generate or infer a database schema from this description. I already have a
  hand-designed schema with Row-Level Security and business-rule triggers that I will run myself in the
  Supabase SQL editor. Connect to Supabase and treat the following tables as already existing; generate a
  typed Supabase client and typed query functions against them, but do not create or alter tables yourself:
  - profiles (account_type: 'match'|'mentor', display_name, age, gender, location/lat/long, blood_group,
    genotype, nationality, qualification, occupation, bio, marriage_intentions, church_affiliation,
    congregation, spirituality_markers[], life_verse, voice_intro_url, id_verification_status,
    church_verified, mentor_role, profile_complete [generated], created_at, updated_at)
  - photos (profile_id, storage_path, position)
  - swipes (swiper_id, swipee_id, direction: 'like'|'pass')
  - matches (user_a_id, user_b_id, status: 'active'|'expired'|'closed', last_activity_at)
  - messages (match_id, sender_id, body, created_at)
  - reports (reporter_id, reported_id, reason)
  - blocks (blocker_id, blocked_id)
  - vouchers (match_user_id, mentor_id, invitee_email, endorsement, status) — schema only, no UI yet
  Two business rules are already enforced by DB triggers, not the client: a hard cap of 3 active matches
  per user, and a 72-hour no-activity auto-expiry on matches. Do not reimplement these rules client-side
  as the source of truth — the client only reflects state the DB already enforces.

DESIGN SYSTEM — "Grounded Growth" palette (single-sourced, no exceptions)
- Burgundy / Deep Wine `#6B1724` — primary: headers, nav, primary buttons/text.
- Sage Green `#87A987` — accent: verification badges, Life Verse frame, highlights.
- Linen `#F4F1EA` — canvas/background.
- Muted Terracotta `#C97B5A` — functional only: chat-cap indicators and 72h expiry warnings. Never use it
  decoratively.
Add these as named Tailwind theme colors (e.g. `brand-burgundy`, `brand-sage`, `brand-linen`,
`brand-terracotta`) and as a single `src/theme/colors.ts` export. Every component must reference these
tokens — no raw hex codes anywhere else in the codebase.

CODE ARCHITECTURE (enforced, not optional)
Use a feature-folder structure:
  src/
    features/
      auth/
      profile/
      discovery/
      matches/
      chat/
      safety/
    lib/
      supabase.ts        (the ONLY place the Supabase client is instantiated)
    components/ui/       (shared, presentational only)
    theme/
    types/
Rules:
- No component file over ~200 lines — decompose into subcomponents/hooks instead.
- No business logic inline in JSX/render functions — logic lives in `features/*/logic.ts`, imported in.
- No direct `supabase.from(...)` calls inside components — route all data access through typed functions
  in each feature's own `api.ts`, built on the single client in `lib/supabase.ts`.
- Strict TypeScript: no `any`, no implicit any. Generate types from the Supabase schema rather than
  hand-typing rows.
- No hardcoded copy/pricing/business constants scattered across files — shared constants (e.g. the 3-chat
  cap, the 72h expiry window) live in one named-constants file even though the DB is the source of truth.

SCREENS TO SCAFFOLD (empty/placeholder content, routed and navigable — no working logic yet)
1. Auth: Sign up / Log in (email + Google button placeholder), and an account-type picker (Match vs Mentor).
2. Onboarding: multi-step profile builder shell with steps for demographics, photos, bio & marriage
   intentions, church affiliation & spirituality markers, Life Verse, and a 15-second voice intro step.
   Just the step shell and navigation between steps — no data persistence yet.
3. Discover: swipe-deck screen shell (empty state is fine) with placeholder distance/compatibility filter UI.
4. Matches: list screen with an "Active" and "Expired" section, and a placeholder chat-cap indicator using
   the terracotta token.
5. Chat: empty 1:1 conversation screen shell.
6. Profile: view/edit own profile shell.
7. Safety: report/block confirmation modal shells, reachable from a profile.
8. ID verification: a simple upload-stub screen that says "Pending review" after a placeholder upload.

MONETIZATION (context only — do not build any of this yet)
Tiers are Free ($0), Premium ($9.99/mo), Verified+ ($14.99/mo), Concierge ($99+/mo). This is out of scope
for the MVP; do not add payment UI, paywalls, or subscription logic in this pass.

OUT OF SCOPE FOR THIS ENTIRE PROJECT (do not build, even later, unless I explicitly ask)
Mentor voucher ledger UI, admin moderation dashboard, automated image/UGC moderation, push notifications,
iOS-specific anything, Apple Sign-In, any payment integration.

When you're done with this scaffolding pass, stop and summarize exactly what you created — don't proceed
to wire up real logic or Supabase queries beyond the read-only typed client setup described above.
```
