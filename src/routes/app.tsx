import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomTabs } from "@/components/app/BottomTabs";

/**
 * Main app shell with mobile bottom-tab navigation.
 *
 * TODO: Once auth is wired, protect this subtree. On Lovable Cloud the
 * integration-managed `_authenticated` layout is preferred; when we add
 * sign-in logic we'll either move these children under `_authenticated/`
 * or add a `beforeLoad` session check here.
 */
export const Route = createFileRoute("/app")({
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
