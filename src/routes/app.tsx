import { requireCompleteProfile } from "@/features/auth/guards";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomTabs } from "@/components/app/BottomTabs";

/**
 * Main app shell with mobile bottom-tab navigation.
 *
 * Guards the entire /app/* subtree: requires a session AND a completed
 * profile. Missing session → /auth. Session but incomplete profile →
 * /onboarding.
 */
export const Route = createFileRoute("/app")({
  beforeLoad: requireCompleteProfile,
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
