/**
 * Auth data access. All Supabase auth calls for the app funnel through here.
 * No component may call `supabase.auth.*` directly.
 */
import { supabase } from "@/lib/supabase";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { ACCOUNT_TYPES, type AccountType } from "@/lib/constants";
import { peekSession, restoreSession, setCachedSession } from "./session";
import { upsertMarketingConsent } from "@/features/marketing/api";

/**
 * Deep link the OAuth provider redirects back to on Android. This is an
 * Android App Link (https), not a custom URI scheme: the auth redirect
 * allow-list already covers `https://trueyoke.app/**`, whereas custom schemes
 * cannot be added there. Verified via
 * `public/.well-known/assetlinks.json` + the `autoVerify` intent-filter on
 * MainActivity.
 */
export const NATIVE_OAUTH_REDIRECT_URL = "https://trueyoke.app/auth";

/** Version stamped on `profiles.privacy_policy_version` at consent time. */
export const PRIVACY_POLICY_VERSION = "v1";

export interface SignUpInput {
  email: string;
  password: string;
  accountType: AccountType;
  displayName: string;
  privacyAcceptedAt: string;
  privacyPolicyVersion: string;
  /** Optional, opt-in marketing email consent. Separate from privacy consent. */
  marketingConsent?: boolean;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface EnsureProfileInput {
  accountType: AccountType;
  displayName: string;
}

export interface OAuthConsentInput {
  privacyAcceptedAt: string;
  privacyPolicyVersion: string;
  /** Chosen on /choose-type and threaded through the OAuth redirect URL,
   *  because Google's own claims can never carry it. */
  accountType?: AccountType | null;
  /** Optional, opt-in marketing email consent. Separate from privacy consent. */
  marketingConsent?: boolean;
}

export async function getCurrentUserId(): Promise<string | null> {
  // Wait for the persisted session to be rehydrated before hitting the auth
  // server, otherwise a cold start sends an unauthenticated request.
  await restoreSession();

  // Right after a fresh sign-in the client can still be mid-way through
  // attaching the new session (the restore promise may have resolved `null`
  // before the sign-in happened). A single `getUser()` therefore sometimes
  // comes back empty and the caller surfaces a false "Not authenticated".
  // Re-read via getSession() and, if still empty, retry once after a tick.
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data } = await supabase.auth.getUser();
    if (data.user?.id) return data.user.id;

    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUserId = sessionData.session?.user.id;
    if (sessionUserId) {
      setCachedSession(sessionData.session ?? null);
      return sessionUserId;
    }

    const cached = peekSession()?.user.id;
    if (cached) return cached;

    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return null;
}

export async function getCurrentSession(): Promise<Session | null> {
  await restoreSession();
  // After the initial restore the cache is kept current by onAuthStateChange.
  return peekSession();
}

export async function signUpWithEmail(input: SignUpInput): Promise<void> {
  const native = Capacitor.isNativePlatform();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: native ? NATIVE_OAUTH_REDIRECT_URL : `${window.location.origin}/onboarding`,
      // Stored on the auth.users row, so these survive the email-confirmation
      // round trip and are available to the profile bootstrap afterwards.
      data: {
        account_type: input.accountType,
        display_name: input.displayName,
        marketing_consent: input.marketingConsent === true,
      },
    },
  });
  if (error) throw error;

  // Populate the session cache synchronously from the response so route
  // guards (which read peekSession()) see it before the async
  // onAuthStateChange listener fires. Without this, navigation races ahead
  // of the event and guards bounce the user back to /auth.
  setCachedSession(data.session ?? null);

  // Only when a session came back immediately (email confirmation is off) do
  // we have an authenticated auth.uid() to satisfy the RLS insert policy.
  if (data.session && data.user) {
    const { error: upsertErr } = await supabase.from("profiles").upsert({
      id: data.user.id,
      account_type: input.accountType,
      display_name: input.displayName,
      privacy_accepted_at: input.privacyAcceptedAt,
      privacy_policy_version: input.privacyPolicyVersion,
    });
    if (upsertErr) throw new Error(upsertErr.message);

    // Optional, additional consent — recorded alongside the privacy stamp.
    await upsertMarketingConsent({
      profileId: data.user.id,
      email: input.email,
      consented: input.marketingConsent === true,
      source: "signup",
    });
  }
}

export async function signInWithEmail(input: SignInInput): Promise<void> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) throw error;

  // Populate the session cache synchronously from the response so route
  // guards see it before the async onAuthStateChange listener fires.
  setCachedSession(data.session ?? null);
}

/**
 * Idempotent: inserts a profiles row only if one doesn't already exist for
 * the current user. Used after sign-in to cover the email-confirmation flow
 * where signUp couldn't create the row (no session at that point).
 */
export async function ensureProfileExists(input: EnsureProfileInput): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { data: existing, error: selErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);
  if (existing) return;

  const { error: insErr } = await supabase.from("profiles").insert({
    id: userId,
    account_type: input.accountType,
    display_name: input.displayName,
  });
  if (insErr) throw new Error(insErr.message);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Sends the branded recovery email. The redirect lands on `/auth`, which is
 * covered by the verified Android App Link intent-filter, so the existing
 * deep-link handler completes the PKCE exchange with no native changes.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const native = Capacitor.isNativePlatform();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: native ? NATIVE_OAUTH_REDIRECT_URL : `${window.location.origin}/auth`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/**
 * True when the current session's account has a verified TOTP factor.
 *
 * This app has no MFA enrollment UI of its own -- but this project's
 * Supabase auth.users pool is shared with the separate "TrueYoke Admin Hub"
 * app, which *does* require and enroll TOTP for every admin account. If
 * someone with an admin account (e.g. the founder's own email) goes through
 * this app's "forgot password" flow, the recovery-link session Supabase
 * hands back is only AAL1, and `supabase.auth.updateUser({ password })`
 * fails with `insufficient_aal` ("AAL2 session is required to update email
 * or password when MFA is enabled") -- Supabase requires an MFA-verified
 * (AAL2) session before allowing a password change on an MFA-enabled
 * account, regardless of which app initiated the recovery. We can't avoid
 * that requirement (nor would we want to -- it's Supabase protecting a
 * security-sensitive account), so instead we detect it and prompt for the
 * TOTP code inline before retrying the update.
 */
export async function listVerifiedTotpFactorId(): Promise<string | null> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  const factor = data.totp.find((f) => f.status === "verified");
  return factor?.id ?? null;
}

/**
 * Elevates the current session to AAL2 by verifying a TOTP code against the
 * given factor. `challengeAndVerify` is used (rather than separate
 * `challenge()` + `verify()` calls) so there's no intermediate challenge id
 * to track or expire across a retry.
 */
export async function challengeAndVerifyTotp(factorId: string, code: string): Promise<void> {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) throw error;
}

/**
 * Subscribe to auth state changes. Returns an unsubscribe function.
 * Used exactly once at the router layer to invalidate route guards.
 */
export function onAuthChange(
  cb: (session: Session | null, event: AuthChangeEvent) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    setCachedSession(session);
    cb(session, event);
  });
  return () => data.subscription.unsubscribe();
}

/**
 * Google OAuth.
 *
 * The Supabase client is created with the default PKCE flow and
 * `detectSessionInUrl: true` (see `src/lib/supabase.ts`), so:
 *  - on web we simply hand the browser to the provider and supabase-js picks
 *    the `?code=` back up on return;
 *  - on native we must keep control of the browser (`skipBrowserRedirect`),
 *    open the system browser ourselves, and complete the PKCE exchange from
 *    the `appUrlOpen` deep link (see `features/auth/deep-link.ts`).
 */
export async function signInWithGoogle(accountType?: AccountType | null): Promise<void> {
  const native = Capacitor.isNativePlatform();
  const base = native ? NATIVE_OAUTH_REDIRECT_URL : `${window.location.origin}/auth`;
  // Google's identity claims can't carry our account type, so it rides back on
  // the redirect URL and is read from `search.type` on /auth.
  const redirectTo = accountType ? `${base}?type=${encodeURIComponent(accountType)}` : base;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: native,
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error("Google sign-in is unavailable right now. Please try again.");

  if (native) {
    await Browser.open({ url: data.url });
  } else {
    window.location.href = data.url;
  }
}

/**
 * Completes the PKCE exchange for an OAuth redirect that came back through a
 * native deep link. Scheme-agnostic: works for both the https App Link and the
 * legacy custom scheme, and reads `code` from the query string or the URL
 * fragment. Returns true when a session was established.
 */
export async function completeOAuthRedirect(url: string): Promise<boolean> {
  const parsed = new URL(url);
  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const code = parsed.searchParams.get("code") ?? hashParams.get("code");
  if (!code) return false;

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  setCachedSession(data.session ?? null);
  return Boolean(data.session);
}

/**
 * Best-effort display name, never empty. Prefers the display name we stamp on
 * `user_metadata` at email signup; otherwise falls back to the Google-shaped
 * provider identity fields.
 */
function displayNameFromSession(session: Session): string {
  const meta = session.user.user_metadata as Record<string, unknown> | null;
  const candidate =
    (typeof meta?.display_name === "string" && meta.display_name) ||
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    session.user.email?.split("@")[0];
  return (candidate || "Friend").trim().slice(0, 80);
}

/** Account type stamped at email signup, when present and valid. */
function accountTypeFromSession(session: Session): AccountType | null {
  const meta = session.user.user_metadata as Record<string, unknown> | null;
  const value = meta?.account_type;
  return typeof value === "string" && (ACCOUNT_TYPES as readonly string[]).includes(value)
    ? (value as AccountType)
    : null;
}

/** True when a `profiles` row already exists for the current session. */
export async function hasProfileRow(): Promise<boolean> {
  const session = await getCurrentSession();
  if (!session) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", session.user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

/**
 * First-time user bootstrap behind the "One last thing" interstitial. Shared
 * by two flows: Google OAuth sign-in, and email/password signup returning from
 * email confirmation. Idempotent: inserts a minimal `profiles` row only when
 * none exists. `account_type` and `display_name` are read from
 * `user_metadata` when we stamped them at signup; otherwise account type stays
 * deferred to onboarding and the name falls back to the provider identity.
 * The NDPA consent stamp is supplied by the interstitial.
 */
export async function ensureOAuthProfile(consent: OAuthConsentInput): Promise<void> {
  const session = await getCurrentSession();
  if (!session) return;

  const { data: existing, error: selErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", session.user.id)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);
  if (existing) return;

  const accountType = accountTypeFromSession(session) ?? consent.accountType ?? null;
  if (!accountType) {
    const err = new Error("Account type could not be determined.");
    (err as Error & { code?: string }).code = "ACCOUNT_TYPE_UNKNOWN";
    throw err;
  }

  const { error: insErr } = await supabase.from("profiles").insert({
    id: session.user.id,
    display_name: displayNameFromSession(session),
    account_type: accountType,
    privacy_accepted_at: consent.privacyAcceptedAt,
    privacy_policy_version: consent.privacyPolicyVersion,
  });
  if (insErr) throw new Error(insErr.message);

  // Optional marketing opt-in, captured on the same interstitial (Google) or
  // carried through email confirmation on `user_metadata`.
  const meta = session.user.user_metadata as Record<string, unknown> | null;
  const consented = consent.marketingConsent === true || meta?.marketing_consent === true;
  await upsertMarketingConsent({
    profileId: session.user.id,
    email: session.user.email ?? "",
    consented,
    source: "signup",
  });
}

/**
 * NDPA right to erasure. The Edge Function always acts on the authenticated
 * caller — no id is sent — then we drop the local session.
 */
export async function deleteOwnAccount(): Promise<void> {
  const { data, error } = await supabase.functions.invoke("delete-account", {
    method: "POST",
  });
  if (error) throw new Error(error.message);
  const payload = data as { ok?: boolean; error?: string } | null;
  if (payload?.error) throw new Error(payload.error);
  await signOut();
}
