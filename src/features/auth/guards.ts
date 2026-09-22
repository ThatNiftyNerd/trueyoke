/**
 * Route-protection guards. Every route's `beforeLoad` delegates here so the
 * auth rules live in exactly one place.
 *
 * State comes straight from the Supabase client (via `features/auth/api` and
 * the session auto-restore module) — no extra auth context provider.
 */
import { redirect } from "@tanstack/react-router";
import { Capacitor } from "@capacitor/core";
import { getCurrentSession } from "./api";
import { isRecoveryRedirect } from "./recovery-detect";
import { getOwnProfile } from "@/features/profile/api";

/**
 * Where a signed-in user belongs, including the pre-profile consent state.
 * A missing row is deliberately different from an incomplete row: `/auth`
 * owns consent and profile bootstrap, while `/onboarding` edits an existing
 * profile.
 */
export async function signedInLandingPath(): Promise<"/auth" | "/app/discover" | "/onboarding"> {
  const profile = await getOwnProfile();
  if (!profile) return "/auth";
  return profile.profile_complete ? "/app/discover" : "/onboarding";
}

/**
 * Protected routes: anonymous visitors are sent back to the welcome/login
 * screen instead of seeing internal pages.
 */
export async function requireAuth(): Promise<void> {
  const session = await getCurrentSession();
  if (!session) throw redirect({ to: "/auth" });
}

/**
 * Protected + onboarded routes (Discovery, Matches, Chat, Profile). Anonymous
 * users go to login; signed-in users with an unfinished profile go finish it.
 */
export async function requireCompleteProfile(): Promise<void> {
  await requireAuth();
  const profile = await getOwnProfile();
  if (!profile) {
    throw redirect({ to: "/auth" });
  }
  if (!profile.profile_complete) {
    throw redirect({ to: "/onboarding" });
  }
}

/**
 * Native-only: "/" is TrueYoke's public marketing/welcome page, shared
 * verbatim with the trueyoke.app website (same bundle, same route). That's
 * the right default for a browser tab, but an installed APK has no reason
 * to ever show marketing copy, an APK download button, or outbound social
 * links to someone who already has the app open — it reads as "this app
 * just wraps the website" instead of a standalone product. A signed-out
 * native visitor is sent straight to sign-in/sign-up instead; a signed-in
 * native visitor is unaffected (redirectIfSignedIn already moves them
 * along). Web (browser) visitors never hit this — Capacitor.isNativePlatform()
 * is false there — so trueyoke.app's own landing page is untouched.
 */
export async function redirectNativeAnonymousToAuth(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const session = await getCurrentSession();
  if (!session) throw redirect({ to: "/auth" });
}

/**
 * Public entry points (welcome screen, auth screen, onboarding). Signed-in
 * users are moved straight along: to Discovery once onboarding is done.
 */
export async function redirectIfSignedIn(options?: {
  allowAuth?: boolean;
  allowOnboarding?: boolean;
}): Promise<void> {
  if (isRecoveryRedirect()) return;
  const session = await getCurrentSession();
  if (!session) return;
  const target = await signedInLandingPath();
  if (options?.allowAuth && target === "/auth") return;
  if (options?.allowOnboarding && target === "/onboarding") return;
  throw redirect({ to: target });
}
