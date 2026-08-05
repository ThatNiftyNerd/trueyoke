import { useState } from "react";
import { requireCompleteProfile } from "@/features/auth/guards";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { BottomTabs } from "@/components/app/BottomTabs";
import { NotificationsPane } from "@/features/notifications/NotificationsPane";
import type { ActivityItem } from "@/features/notifications/api";

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
  const [open, setOpen] = useState(false);
  const [badge, setBadge] = useState(0);

  return (
    <div className="min-h-[100dvh] bg-app-canvas">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-40 rounded-full bg-app-canvas/90 p-2 text-app-ink shadow-sm backdrop-blur hover:bg-app-primary/10"
      >
        <Bell className="h-5 w-5" />
        {badge > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-app-warn px-1 text-[10px] font-medium text-app-on-primary">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </button>

      <NotificationsPane
        open={open}
        onOpenChange={setOpen}
        onItemsChange={(items: ActivityItem[]) =>
          setBadge(
            items.filter(
              (i) =>
                i.kind === "unread_messages" ||
                i.kind === "voucher_request" ||
                i.kind === "photo_update_needed",
            ).length,
          )
        }
      />

      <div className="mx-auto max-w-md pb-24">
        <Outlet />
      </div>
      <BottomTabs />
    </div>
  );
}
