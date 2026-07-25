import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { BottomTabs } from "@/components/app/BottomTabs";
import { getCurrentSession } from "@/features/auth/api";
import { getOwnProfile } from "@/features/profile/api";

/**
 * Main app shell with mobile bottom-tab navigation.
 *
 * Guards the entire /app/* subtree: requires a session AND a completed
 * profile. Missing session → /auth. Session but incomplete profile →
 * /onboarding.
 */
export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const session = await getCurrentSession();
    if (!session) throw redirect({ to: "/auth" });
    const profile = await getOwnProfile();
    if (!profile || !profile.profile_complete) {
      throw redirect({ to: "/onboarding" });
    }
  },
  component: AppShell,
});

function AppShell() {
  return (
    <div className="min-h-[100dvh] bg-brand-linen">
      <div className="mx-auto max-w-md pb-24">
        <Outlet />
      </div>
      <BottomTabs />
    </div>
  );
}
