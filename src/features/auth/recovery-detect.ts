/**
 * Tracks whether the current session should be treated as a password-recovery
 * session, rather than a normal sign-in.
 *
 * Two independent signals feed this, because a single one isn't reliable
 * across web and native:
 *
 * 1. A synchronous, boot-time read of `window.location` (the `initial`
 *    value below). This is correct on web, where a recovery link is a real
 *    page navigation to `/auth#...&type=recovery` and supabase-js parses the
 *    fragment during module init — before anything else can read it, since
 *    supabase-js strips it as an internal side effect.
 *
 * 2. `markRecoveryRedirect()`, called by the app-wide auth listener
 *    (`src/router.tsx`) whenever Supabase emits a `PASSWORD_RECOVERY` auth
 *    event. This is what actually fires on native: a recovery deep link
 *    arrives via Capacitor's `appUrlOpen` on an already-running app (no page
 *    load, so the boot-time read above never sees it), gets exchanged for a
 *    session in `completeOAuthRedirect`, and supabase-js emits
 *    `PASSWORD_RECOVERY` for that session change regardless of whether it
 *    came from a URL fragment or a PKCE code exchange. Relying on this event
 *    instead of re-parsing the deep-link URL means the detection works the
 *    same way on web and native, and doesn't depend on guessing which query
 *    param shape a given Supabase email template happens to use.
 */
const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
let recoveryFlag: boolean =
  hashParams.get("type") === "recovery" || window.location.search.includes("type=recovery");

export function isRecoveryRedirect(): boolean {
  return recoveryFlag;
}

/** Called by the app-wide auth listener on a `PASSWORD_RECOVERY` event. */
export function markRecoveryRedirect(): void {
  recoveryFlag = true;
}

/** Called once the recovery flow completes (password updated), so a later
 * ordinary sign-in in the same app session isn't misread as recovery. */
export function clearRecoveryRedirect(): void {
  recoveryFlag = false;
}
