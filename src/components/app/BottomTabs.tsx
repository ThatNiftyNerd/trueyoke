/**
 * Mobile-first bottom tab bar for the main app shell.
 *
 * Touch-first (no hover-only interactions). Renders three tabs:
 * Discover / Matches / Profile.
 */
import { Link } from "@tanstack/react-router";
import { Compass, Heart, User } from "lucide-react";
import type { ComponentType } from "react";

interface TabDef {
  to: "/app/discover" | "/app/matches" | "/app/profile";
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const TABS: readonly TabDef[] = [
  { to: "/app/discover", label: "Discover", icon: Compass },
  { to: "/app/matches", label: "Matches", icon: Heart },
  { to: "/app/profile", label: "Profile", icon: User },
];

export function BottomTabs() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-app-ink/10 bg-app-canvas"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((tab) => {
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
