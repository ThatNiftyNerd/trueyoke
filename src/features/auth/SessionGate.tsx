/**
 * Blocks the entire app tree until session auto-restore has settled, so no
 * signed-in or signed-out UI is ever rendered against an unknown auth state.
 */
import { useEffect, useState, type ReactNode } from "react";
import { hasRestored, restoreSession } from "./session";
import { SplashScreen } from "./SplashScreen";

export function SessionGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState<boolean>(hasRestored);

  useEffect(() => {
    let active = true;
    void restoreSession().finally(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) return <SplashScreen />;
  return <>{children}</>;
}
