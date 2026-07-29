import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { onAuthChange } from "@/features/auth/api";
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

  // Single, app-wide auth listener. Every session change (sign-in, sign-out,
  // token refresh) invalidates the router so route `beforeLoad` guards re-run
  // against the fresh session — no scattered getSession() calls needed.
  onAuthChange(() => {
    router.invalidate();
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
