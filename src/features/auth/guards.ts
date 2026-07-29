/**
 * Route-protection guards. Every route's `beforeLoad` delegates here so the
 * auth rules live in exactly one place.
 *
 * State comes straight from the Supabase client (via `features/auth/api` and
 * the session auto-restore module) — no extra auth context provider.
 */
import { redirect } from "@tanstack/react-router";
import { getCurrentSession } from "./api";
import { getOwnProfile } from "@/features/profile/api";

/** Where a signed-in user belongs, based on how far onboarding got. */
export async function signedInLandingPath(): Promise<"/app/discover" | "/onboarding"> {
  const profile = await getOwnProfile();
  return profile?.profile_complete ? "/app/discover" : "/onboarding";
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
  if (!profile || !profile.profile_complete) {
    throw redirect({ to: "/onboarding" });
  }
}

/**
 * Public entry points (welcome screen, auth screen, onboarding). Signed-in
 * users are moved straight along: to Discovery once onboarding is done.
 */
export async function redirectIfSignedIn(options?: { allowOnboarding?: boolean }): Promise<void> {
  const session = await getCurrentSession();
  if (!session) return;
  const target = await signedInLandingPath();
  if (options?.allowOnboarding && target === "/onboarding") return;
  throw redirect({ to: target });
}
