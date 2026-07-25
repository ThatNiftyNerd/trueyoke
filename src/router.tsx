import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { onAuthChange } from "@/features/auth/api";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  // Single, app-wide auth listener. Every session change (sign-in, sign-out,
  // token refresh) invalidates the router so route `beforeLoad` guards re-run
  // against the fresh session — no scattered getSession() calls needed.
  onAuthChange(() => {
    router.invalidate();
  });

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
