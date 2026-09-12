import { useEffect, useState } from "react";
import { requireCompleteProfile } from "@/features/auth/guards";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { MotionConfig, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { BottomTabs } from "@/components/app/BottomTabs";
import { Button } from "@/components/ui/button";
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
  const pathname = useRouterState({ select: (state) => state.location.pathname });

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
    <MotionConfig reducedMotion="user">
      <div className="min-h-[100dvh] bg-app-canvas">
        <header
          className="app-glass fixed inset-x-0 top-0 z-40 border-x-0 border-t-0"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="app-shell-width flex h-14 items-center justify-between px-4">
            <span className="font-serif text-lg text-app-ink">TrueYoke</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              onClick={() => setOpen(true)}
              className="relative rounded-full text-app-ink hover:bg-app-primary/10"
            >
              <Bell className="h-5 w-5" />
              {badge > 0 ? (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-app-warn px-1 text-[10px] font-medium text-app-on-primary">
                  {badge > 9 ? "9+" : badge}
                </span>
              ) : null}
            </Button>
          </div>
        </header>

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

        <div
          className="app-shell-width pb-[calc(6.5rem+env(safe-area-inset-bottom))]"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 4.5rem)" }}
        >
          <UpdateBanner />
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.main>
        </div>
        <BottomTabs accountType={accountType} />
      </div>
    </MotionConfig>
  );
}
