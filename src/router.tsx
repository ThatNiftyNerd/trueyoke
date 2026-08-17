import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { onAuthChange } from "@/features/auth/api";
import { markRecoveryRedirect } from "@/features/auth/recovery-detect";
import { restoreSession, startForegroundSessionRefresh } from "@/features/auth/session";
import { SplashScreen } from "@/features/auth/SplashScreen";
import { INVITE_TOKEN_STORAGE_KEY } from "@/routes/invite.mentor";
import { claimMentorInvite } from "@/features/vouchers/api";

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

    // A pending mentor-invite token survives here in localStorage rather
    // than user_metadata because /invite/mentor is reachable before any
    // account exists — signup's post-confirmation redirect lands on
    // /onboarding or /auth, never back on /invite/mentor, so this is the
    // one place guaranteed to see every fresh sign-in regardless of which
    // screen it actually completed on. Gated on the real "SIGNED_IN" event
    // (never INITIAL_SESSION) so this never re-fires on an ordinary app
    // boot that restores an already-signed-in session. Best-effort: a
    // stale/foreign token (e.g. left over after the invite already
    // expired, or this is an unrelated sign-in) should never block or
    // surface an error here.
    if (event === "SIGNED_IN") {
      let pendingToken: string | null = null;
      try {
        pendingToken = localStorage.getItem(INVITE_TOKEN_STORAGE_KEY);
      } catch {
        pendingToken = null;
      }
      if (pendingToken) {
        try {
          localStorage.removeItem(INVITE_TOKEN_STORAGE_KEY);
        } catch {
          /* noop */
        }
        void claimMentorInvite(pendingToken).catch(() => {
          // Silent: /invite/mentor itself surfaces a real error message if
          // the visitor is looking at it when this fails; a background
          // attempt after an unrelated sign-in should not.
        });
      }
    }
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
