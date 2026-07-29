import { redirectIfSignedIn } from "@/features/auth/guards";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACCOUNT_TYPES, type AccountType } from "@/lib/constants";
import {
  signUpWithEmail,
  signInWithEmail,
  ensureProfileExists,
  getCurrentSession,
} from "@/features/auth/api";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Yoked" },
      { name: "description", content: "Sign in or create your Yoked account." },
      { property: "og:title", content: "Sign in — Yoked" },
      { property: "og:description", content: "Sign in or create your Yoked account." },
    ],
  }),
  beforeLoad: () => redirectIfSignedIn(),
  component: AuthScreen,
});

type Mode = "signin" | "signup";

function AuthScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signup");
  const [accountType, setAccountType] = useState<AccountType>("match");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        if (!displayName.trim()) {
          throw new Error("Please enter a display name.");
        }
        await signUpWithEmail({
          email,
          password,
          accountType,
          displayName: displayName.trim(),
        });
        const session = await getCurrentSession();
        if (session) {
          navigate({ to: "/onboarding" });
        } else {
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else {
        await signInWithEmail({ email, password });
        // Idempotent — only inserts if a profile row is missing (covers
        // accounts created under email-confirmation mode where signUp
        // couldn't insert). displayName may be empty for pure sign-in of an
        // existing account with a profile; ensureProfileExists no-ops in
        // that case.
        if (displayName.trim()) {
          await ensureProfileExists({
            accountType,
            displayName: displayName.trim(),
          });
        }
        const profile = await getOwnProfile();
        navigate({ to: profile?.profile_complete ? "/app/discover" : "/onboarding" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] flex-col bg-brand-linen px-6 py-10">
      <header className="mb-8 text-center">
        <p className="text-sm uppercase tracking-widest text-brand-sage">Yoked</p>
        <h1 className="mt-2 font-serif text-2xl text-brand-burgundy">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
      </header>

      {mode === "signup" && (
        <section className="mx-auto mb-6 w-full max-w-sm">
          <p className="mb-2 text-sm font-medium text-brand-burgundy">I am joining as</p>
          <div className="grid grid-cols-2 gap-2">
            {ACCOUNT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAccountType(type)}
                className={
                  accountType === type
                    ? "rounded-md border border-brand-burgundy bg-brand-burgundy px-3 py-2 text-sm text-brand-linen"
                    : "rounded-md border border-brand-burgundy/30 bg-transparent px-3 py-2 text-sm text-brand-burgundy"
                }
              >
                {type === "match" ? "Match" : "Mentor"}
              </button>
            ))}
          </div>
        </section>
      )}

      <form className="mx-auto flex w-full max-w-sm flex-col gap-4" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              type="text"
              autoComplete="name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-brand-terracotta/40 bg-brand-terracotta/10 px-3 py-2 text-sm text-brand-terracotta"
          >
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-md border border-brand-sage/40 bg-brand-sage/10 px-3 py-2 text-sm text-brand-burgundy">
            {notice}
          </p>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="bg-brand-burgundy text-brand-linen hover:bg-brand-burgundy/90"
        >
          {submitting ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </Button>

        <div className="my-2 flex items-center gap-3 text-xs text-brand-burgundy/50">
          <span className="h-px flex-1 bg-brand-burgundy/15" />
          or
          <span className="h-px flex-1 bg-brand-burgundy/15" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="border-brand-burgundy/30 text-brand-burgundy"
          onClick={() => {
            // TODO: Google sign-in requires a Capacitor-safe OAuth redirect
            // (custom URL scheme) that hasn't been configured yet. Leaving
            // this as an explicit notice rather than a silent no-op.
            setError(null);
            setNotice("Google sign-in isn't set up yet. Use email for now.");
          }}
        >
          Continue with Google
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-burgundy/70">
        {mode === "signup" ? "Already have an account?" : "New to Yoked?"}{" "}
        <button
          type="button"
          className="underline"
          onClick={() => {
            setError(null);
            setNotice(null);
            setMode(mode === "signup" ? "signin" : "signup");
          }}
        >
          {mode === "signup" ? "Sign in" : "Create one"}
        </button>
      </p>

      <p className="mt-8 text-center text-xs text-brand-burgundy/50">
        After signing up you'll continue to{" "}
        <Link to="/onboarding" className="underline">
          onboarding
        </Link>
        .
      </p>
    </main>
  );
}
