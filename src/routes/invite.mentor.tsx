import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getCurrentSession } from "@/features/auth/api";
import { getOwnProfile } from "@/features/profile/api";
import { claimMentorInvite } from "@/features/vouchers/api";

/**
 * Persisted so the token survives the signup -> email-confirmation ->
 * first-sign-in round trip on the same device (mirrors the general shape of
 * the account_type/display_name-at-signup problem this codebase already
 * solves elsewhere, but via localStorage rather than user_metadata since
 * this route -- unlike the auth screen -- is reachable before any account
 * exists at all). Read by the router's global auth listener, which attempts
 * the claim as soon as a session appears; also read directly here so a
 * visitor who is *already* signed in as a Mentor can claim immediately
 * without a round trip through signup at all.
 */
export const INVITE_TOKEN_STORAGE_KEY = "ty_pending_mentor_invite";

type InviteSearch = { token?: string };

export const Route = createFileRoute("/invite/mentor")({
  validateSearch: (search: Record<string, unknown>): InviteSearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Mentor invitation — TrueYoke" },
      { name: "description", content: "Accept an invitation to mentor on TrueYoke." },
      { property: "og:title", content: "Mentor invitation — TrueYoke" },
      {
        property: "og:description",
        content: "Accept an invitation to mentor on TrueYoke.",
      },
    ],
  }),
  component: MentorInviteScreen,
});

type ViewState = "checking" | "signed-out" | "wrong-account" | "claiming" | "claimed" | "error";

function MentorInviteScreen() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<ViewState>("checking");
  const [error, setError] = useState<string | null>(null);

  // Stash the token immediately so it's available even if the visitor leaves
  // this tab (e.g. to open their email client) before finishing signup.
  useEffect(() => {
    if (!token) return;
    try {
      localStorage.setItem(INVITE_TOKEN_STORAGE_KEY, token);
    } catch {
      // Private browsing / storage disabled -- claiming still works as long
      // as they finish signup in this same tab (session appears, token is
      // still in the `token` search param, the effect below runs).
    }
  }, [token]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const session = await getCurrentSession();
      if (!alive) return;

      if (!session) {
        setState("signed-out");
        return;
      }

      const profile = await getOwnProfile();
      if (!alive) return;

      if (!profile || profile.account_type !== "mentor") {
        setState("wrong-account");
        return;
      }

      if (!token) {
        setError("This invite link is missing its token.");
        setState("error");
        return;
      }

      setState("claiming");
      try {
        await claimMentorInvite(token);
        try {
          localStorage.removeItem(INVITE_TOKEN_STORAGE_KEY);
        } catch {
          /* noop */
        }
        if (alive) setState("claimed");
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Could not accept this invite.");
        setState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <main
      className="flex min-h-[100dvh] flex-col justify-center bg-app-canvas px-6 py-10"
      style={{ paddingTop: "max(2.5rem, calc(env(safe-area-inset-top) + 1.5rem))" }}
    >
      <div className="mx-auto w-full max-w-sm text-center">
        <h1 className="font-serif text-2xl text-app-ink">Mentor invitation</h1>

        {state === "checking" || state === "claiming" ? (
          <p className="mt-4 text-sm text-app-ink/60">
            {state === "claiming" ? "Accepting your invite…" : "Checking your invite…"}
          </p>
        ) : null}

        {state === "signed-out" ? (
          <>
            <p className="mt-4 text-sm text-app-ink/70">
              Someone on TrueYoke is asking you to be their mentor. Create a free Mentor account to
              see their request.
            </p>
            <div className="mt-6 space-y-3">
              <Button
                asChild
                className="w-full bg-app-primary text-app-on-primary hover:bg-app-primary/90"
              >
                <Link to="/auth" search={{ type: "mentor", mode: "signup" }}>
                  Create my Mentor account
                </Link>
              </Button>
              <Link
                to="/auth"
                search={{ type: "mentor", mode: "signin" }}
                className="block text-sm text-app-ink underline"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </>
        ) : null}

        {state === "wrong-account" ? (
          <p className="mt-4 text-sm text-app-ink/70">
            This invite is for a Mentor account, and you&apos;re signed in as a Match. Sign out and
            create a Mentor account with the email this invite was sent to, then open this link
            again.
          </p>
        ) : null}

        {state === "claimed" ? (
          <>
            <p className="mt-4 text-sm text-app-ink/70">
              You&apos;re all set. The request is waiting for you in your Discover ledger.
            </p>
            <Button
              asChild
              className="mt-6 w-full bg-app-primary text-app-on-primary hover:bg-app-primary/90"
            >
              <Link to="/app/discover">Go to my requests</Link>
            </Button>
          </>
        ) : null}

        {state === "error" ? (
          <p role="alert" className="mt-4 text-sm text-app-warn">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
