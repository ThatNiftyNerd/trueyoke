import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { onAuthChange } from "@/features/auth/api";
import { markRecoveryRedirect } from "@/features/auth/recovery-detect";
import { restoreSession, startForegroundSessionRefresh } from "@/features/auth/session";
import { SplashScreen } from "@/features/auth/SplashScreen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Async auth guards resolve behind the same splash instead of flashing a
    // partially-rendered screen.
    defaultPendingComponent: SplashScreen,
    defaultPendingMs: 150,
    defaultPendingMinMs: 300,
  });

  // Single, app-wide auth listener. A session change invalidates the router so
  // route `beforeLoad` guards re-run against the fresh session.
  //
  // Two rules matter here, both learned from the email-confirmation crash:
  //
  // 1. Only invalidate when the *identity* changed. Supabase also emits
  //    INITIAL_SESSION and TOKEN_REFRESHED for the same user; invalidating on
  //    those churns navigations for no reason.
  // 2. Never invalidate while a navigation is in flight. Invalidating mid-load
  //    recomputes matches whose `loadPromise` has already been cleared, and
  //    the router's match renderer then throws `undefined` during the commit
  //    phase. That escapes every route-level error boundary and unmounts the
  //    entire React tree — the blank `/auth` screen after confirming an email.
  let lastUserId: string | null | undefined;

  const invalidateLater = () => {
    // Yield a macrotask so React has committed the current render before we
    // recompute matches; invalidating inside the commit phase is what threw
    // `undefined` out of the router's match renderer.
    window.setTimeout(() => {
      const pending = router.latestLoadPromise;
      if (pending) {
        void pending.then(invalidateLater);
        return;
      }
      void router.invalidate();
    }, 0);
  };

  const invalidateWhenIdle = () => {
    const pending = router.latestLoadPromise;
    if (pending) {
      // A guard redirect starts a follow-up load; re-check after it settles.
      void pending.then(invalidateLater);
      return;
    }
    invalidateLater();
  };

  onAuthChange((session, event) => {
    // Fires whenever Supabase establishes a recovery session, regardless of
    // whether it arrived as a web hash fragment or a native deep-link code
    // exchange (see recovery-detect.ts). The current route may be anything
    // — the app could be mid-session on /app/discover when a recovery link
    // is tapped on native — so this force-navigates to /auth rather than
    // relying on a component that may not even be mounted to notice.
    if (event === "PASSWORD_RECOVERY") {
      markRecoveryRedirect();
      void router.navigate({ to: "/auth" });
    }

    const userId = session?.user.id ?? null;
    if (userId === lastUserId) return;
    lastUserId = userId;
    invalidateWhenIdle();
  });

  // Kick off session rehydration immediately so the first `beforeLoad` guard
  // resolves against the restored session instead of a null one.
  void restoreSession();
  startForegroundSessionRefresh();

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
