# Feature Prompt 1 — Auth + Account-Type Picker

Paste this into the same Lovable project (do not start a new project). This is feature prompt
1 of N following Sprint 0 scaffolding — scoped to auth only, per the anti-slop rule of one
feature per prompt.

---

```
FEATURE: Email/password auth, Google button placeholder, account-type picker, and route
protection. Wire this into the EXISTING scaffold — do not regenerate routes, the theme, or
the feature-folder structure. Do not touch supabase/schema.sql or any other .sql file; the
schema is already applied and is out of scope for you to alter.

FILES YOU SHOULD TOUCH
- src/features/auth/api.ts   (implement the TODOs already stubbed there)
- src/features/auth/logic.ts (session hook / helpers, if needed)
- src/routes/auth.tsx        (wire the existing form to api.ts; add the one missing field below)
- src/routes/app.tsx         (add the route guard described below)
- src/routes/onboarding.tsx  (add the route guard described below)
- src/routes/verify-id.tsx, src/routes/chat.$matchId.tsx (add the same guard)
- src/router.tsx             (only if a session-aware router context requires it — see below)
- New files only if a component would otherwise exceed ~200 lines (split into subcomponents
  under src/features/auth/ or src/components/app/ as needed) — do not add new top-level
  folders.

CURRENT STATE (read before writing anything)
- src/routes/auth.tsx already has email/password inputs, a mode toggle (sign up / sign in),
  a working account-type picker (Match / Mentor, from ACCOUNT_TYPES in src/lib/constants.ts),
  and a Google button — but the form's onSubmit and the Google button's onClick are both
  no-op TODOs.
- src/features/auth/api.ts already exports getCurrentUserId(); everything else is a TODO
  comment block. Do not delete the existing single-client-import pattern
  (`import { supabase } from "@/lib/supabase"`) — no component may call `supabase.auth.*`
  or `supabase.from(...)` directly; all of that goes through this file.
- profiles.id is a foreign key to auth.users.id, and display_name/account_type are NOT NULL
  on that table. There is no database trigger that creates a profiles row on signup — the
  client is responsible for creating it. Build this correctly, don't leave it as a TODO:

  1. signUpWithEmail({ email, password, accountType, displayName }): call
     supabase.auth.signUp(). If Supabase returns a session immediately (email confirmation
     is off), upsert a profiles row { id: user.id, account_type: accountType,
     display_name: displayName } in the same call. If no session comes back (confirmation
     required), do NOT attempt the insert — there's no authenticated auth.uid() yet, and
     the RLS insert policy would reject it anyway.
  2. signInWithEmail({ email, password }): call supabase.auth.signInWithPassword(), then
     call a small idempotent ensureProfileExists({ accountType, displayName }) that checks
     for an existing profiles row by id and inserts one only if missing. This is what
     actually creates the profile for anyone who signed up under email-confirmation mode —
     don't assume signUp always creates it.
  3. signOut(): supabase.auth.signOut().
  4. getCurrentSession(): wraps supabase.auth.getSession().
  5. Do NOT implement real Google OAuth in this pass. Leave the Google button visually
     present (per the original scaffolding scope) but wire its onClick to a no-op that
     shows a toast/disabled state with a TODO comment explaining that Google sign-in needs
     a Capacitor-safe OAuth redirect (custom URL scheme) that hasn't been configured yet.
     Do not silently leave it doing nothing with no explanation in the UI.

MISSING FIELD
- auth.tsx's signup form has no display name input, but display_name is required by the
  schema. Add a "Display name" text input to the signup form only (not sign-in), above or
  below the account-type picker — your call on placement, keep it visually consistent with
  the existing Input/Label components already used for email/password.

SESSION STATE + ROUTE PROTECTION (this is the architectural core of this prompt)
Do not scatter ad-hoc `supabase.auth.getSession()` calls across components. Use exactly one
pattern, consistently:
- Maintain session state once, at the top of the app (e.g. in src/router.tsx or a thin
  provider consumed by __root.tsx) using supabase.auth.onAuthStateChange, and call
  router.invalidate() whenever the session changes so route beforeLoad checks re-run.
- Add a `beforeLoad` to src/routes/app.tsx, onboarding.tsx, verify-id.tsx, and
  chat.$matchId.tsx that:
  - redirects to /auth if there is no session.
  - for /app/* specifically: if the session exists but the profile is missing or
    profile_complete is false, redirect to /onboarding instead of rendering the app shell.
- Add a `beforeLoad` to /auth that redirects away if already signed in: to /app/discover if
  profile_complete is true, otherwise to /onboarding.
- Fetch the profile's `profile_complete` flag through src/features/profile/api.ts (add a
  minimal getOwnProfile() there if it doesn't exist yet) — do not query it ad hoc from a
  route file.

ERROR / LOADING STATES
The form must disable its submit button while a request is in flight and show an inline
error message (not a raw thrown error, not a browser alert) on failure — e.g. wrong
password, email already registered, weak password. Keep this simple; a single error-message
string in component state is enough, no toast library required unless one is already in use
elsewhere in the app.

STRICTLY OUT OF SCOPE FOR THIS PASS (do not build, even partially)
- Real Google/Apple OAuth.
- Onboarding step data persistence (that's the next feature prompt).
- ID verification upload logic.
- Password reset / forgot-password flow.
- Any change to supabase/schema.sql, RLS policies, or triggers.

When you're done, stop and summarize exactly what you changed, file by file — don't
continue on to onboarding or profile logic.
```

---

## Definition of done (verify before accepting the change)

- Sign up with a new email + password + display name + account type creates an auth user
  and a matching `profiles` row (check in the Supabase dashboard, not just "no errors in
  console").
- Signing in with an existing account and no `profiles` row yet (simulating the
  confirmation-required case) creates one on first successful sign-in.
- Visiting `/app/discover`, `/onboarding`, `/verify-id`, or `/chat/:id` while signed out
  redirects to `/auth`.
- Visiting `/auth` while already signed in with a complete profile redirects to
  `/app/discover`.
- Google button is visibly present but does not silently fail — TODO is explicit in code
  and in the UI.
- `bunx eslint .` and `bunx tsc --noEmit` still pass (CI is the real gate — don't just eyeball
  it).
