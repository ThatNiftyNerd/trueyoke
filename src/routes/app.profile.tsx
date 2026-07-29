import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DisplaySettingsPanel } from "@/components/app/DisplaySettingsPanel";

import { isCurrentUserAdmin } from "@/features/profile/api";
import { getCurrentSession, signOut } from "@/features/auth/api";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Yoked" },
      { name: "description", content: "View and edit your Yoked profile." },
      { property: "og:title", content: "Your profile — Yoked" },
      { property: "og:description", content: "View and edit your Yoked profile." },
    ],
  }),
  component: ProfileScreen,
});

function ProfileScreen() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    isCurrentUserAdmin()
      .then((v) => alive && setIsAdmin(v))
      .catch(() => undefined);
    getCurrentSession()
      .then((s) => alive && setEmail(s?.user.email ?? null))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  async function handleSignOut() {
    setError(null);
    setSigningOut(true);
    try {
      await signOut();
      navigate({ to: "/auth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign out. Please try again.");
      setSigningOut(false);
    }
  }

  return (
    <section className="flex flex-col px-4 pt-6">
      <header className="mb-6 text-center">
        <div className="mx-auto h-24 w-24 rounded-full bg-brand-sage/20" aria-hidden="true" />
        <h1 className="mt-3 font-serif text-2xl text-brand-burgundy">Your profile</h1>
        {/* TODO: display church-verified sage badge when profile.church_verified */}
        {email ? <p className="mt-1 text-sm text-brand-burgundy/70">{email}</p> : null}
        <p className="mt-1 text-sm text-brand-burgundy/60">Not yet complete</p>
      </header>

      <div className="space-y-3">
        <Button className="w-full bg-brand-burgundy text-brand-linen hover:bg-brand-burgundy/90">
          Edit profile
        </Button>
        <Link
          to="/verify-id"
          className="block rounded-md border border-brand-sage bg-brand-sage/10 px-4 py-3 text-center text-sm font-medium text-brand-burgundy"
        >
          Verify your ID
        </Link>
        <Link
          to="/app/blocked"
          className="block rounded-md border border-brand-burgundy/20 px-4 py-3 text-center text-sm font-medium text-brand-burgundy"
        >
          Manage blocked users
        </Link>
        {isAdmin ? (
          <Link
            to="/app/admin-review"
            className="block rounded-md border border-brand-burgundy/20 px-4 py-3 text-center text-sm font-medium text-brand-burgundy"
          >
            ID review
          </Link>
        ) : null}
        <Link
          to="/diagnostics"
          className="block rounded-md border border-brand-burgundy/20 px-4 py-3 text-center text-sm font-medium text-brand-burgundy"
        >
          Connection diagnostics
        </Link>
        <DisplaySettingsPanel />
        {error ? (
          <p
            role="alert"
            className="rounded-md border border-brand-terracotta/40 bg-brand-terracotta/10 px-3 py-2 text-sm text-brand-terracotta"
          >
            {error}
          </p>
        ) : null}
        <Button
          variant="outline"
          disabled={signingOut}
          onClick={handleSignOut}
          className="w-full border-brand-burgundy/30 text-brand-burgundy"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>

      <p className="mt-8 text-center text-xs text-brand-burgundy/60">
        Yoked is a product of House603 Digital Solutions.
      </p>
    </section>
  );
}
