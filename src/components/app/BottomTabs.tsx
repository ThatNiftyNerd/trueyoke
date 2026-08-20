/**
 * Mobile-first bottom tab bar for the main app shell.
 *
 * Touch-first (no hover-only interactions). Tabs are account-type aware:
 * mentors get Discover + Profile only (no Matches), matches get all three.
 */
import { Link } from "@tanstack/react-router";
import { Compass, Heart, User } from "lucide-react";
import type { ComponentType } from "react";

interface TabDef {
  to: "/app/discover" | "/app/matches" | "/app/profile";
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const DISCOVER: TabDef = { to: "/app/discover", label: "Discover", icon: Compass };
const MATCHES: TabDef = { to: "/app/matches", label: "Matches", icon: Heart };
const PROFILE: TabDef = { to: "/app/profile", label: "Profile", icon: User };

export interface BottomTabsProps {
  /** Caller's own account type; undefined while it is still loading. */
  accountType?: "match" | "mentor" | null;
}

export function BottomTabs({ accountType }: BottomTabsProps) {
  const tabs: readonly TabDef[] =
    accountType === "mentor" ? [DISCOVER, PROFILE] : [DISCOVER, MATCHES, PROFILE];

  return (
    <nav
      className="app-glass fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="app-shell-width flex items-stretch justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <li key={tab.to} className="flex-1">
              <Link
                to={tab.to}
                className="flex flex-col items-center gap-1 py-2 text-xs text-app-ink/60"
                activeProps={{ className: "text-app-ink font-medium" }}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
