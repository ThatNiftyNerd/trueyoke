import { useEffect, useState } from "react";
import { requireCompleteProfile } from "@/features/auth/guards";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { BottomTabs } from "@/components/app/BottomTabs";
import { NotificationsPane } from "@/features/notifications/NotificationsPane";
import { UpdateBanner } from "@/features/updates/UpdateBanner";
import { getOwnProfile } from "@/features/profile/api";
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
  const [accountType, setAccountType] = useState<"match" | "mentor" | null>(null);

  useEffect(() => {
    let alive = true;
    getOwnProfile()
      .then((p) => {
        if (alive && p) setAccountType(p.account_type as "match" | "mentor");
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-[100dvh] bg-app-canvas">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen(true)}
        style={{ top: "max(1rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
        className="app-glass fixed right-4 z-40 rounded-full p-2 text-app-ink hover:bg-app-primary/10"
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

      {/* Single app-wide top-clearance contract: bell height + safe area, so
          individual screens never need ad-hoc top offsets. */}
      <div
        className="app-shell-width pb-[calc(6.5rem+env(safe-area-inset-bottom))]"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 3.25rem)" }}
      >
        <UpdateBanner />
        <Outlet />
      </div>
      <BottomTabs accountType={accountType} />
    </div>
  );
}
