import { redirectIfSignedIn, signedInLandingPath } from "@/features/auth/guards";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACCOUNT_TYPES, type AccountType } from "@/lib/constants";
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  ensureProfileExists,
  ensureOAuthProfile,
  getCurrentSession,
  onAuthChange,
} from "@/features/auth/api";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TrueYoke" },
      { name: "description", content: "Sign in or create your TrueYoke account." },
      { property: "og:title", content: "Sign in — TrueYoke" },
      { property: "og:description", content: "Sign in or create your TrueYoke account." },
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

  // A Google session can land here either from the web redirect back to
  // /auth or from the native deep-link exchange. Either way, bootstrap the
  // profile row once and then hand off to the shared landing rule.
  useEffect(() => {
    return onAuthChange((session) => {
      if (!session) return;
      void (async () => {
        try {
          await ensureOAuthProfile();
          navigate({ to: await signedInLandingPath() });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
        } finally {
          setSubmitting(false);
        }
      })();
    });
  }, [navigate]);

  async function handleGoogle() {
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
      setSubmitting(false);
    }
  }

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
        navigate({ to: await signedInLandingPath() });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] flex-col bg-app-canvas px-6 py-10">
      <header className="mb-8 text-center">
        <p className="text-sm uppercase tracking-widest text-app-on-accent">TrueYoke</p>
        <h1 className="mt-2 font-serif text-2xl text-app-ink">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
      </header>

      {mode === "signup" && (
        <section className="mx-auto mb-6 w-full max-w-sm">
          <p className="mb-2 text-sm font-medium text-app-ink">I am joining as</p>
          <div className="grid grid-cols-2 gap-2">
            {ACCOUNT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAccountType(type)}
                className={
                  accountType === type
                    ? "rounded-md border border-app-ink bg-app-primary px-3 py-2 text-sm text-app-on-primary"
                    : "rounded-md border border-app-ink/30 bg-transparent px-3 py-2 text-sm text-app-ink"
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
            className="rounded-md border border-app-warn/40 bg-app-warn/10 px-3 py-2 text-sm text-app-warn"
          >
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-md border border-app-accent/40 bg-app-accent/10 px-3 py-2 text-sm text-app-ink">
            {notice}
          </p>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="bg-app-primary text-app-on-primary hover:bg-app-primary/90"
        >
          {submitting ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
        </Button>

        <div className="my-2 flex items-center gap-3 text-xs text-app-ink/50">
          <span className="h-px flex-1 bg-app-primary/15" />
          or
          <span className="h-px flex-1 bg-app-primary/15" />
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          className="border-app-ink/30 text-app-ink"
          onClick={handleGoogle}
        >
          Continue with Google
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-app-ink/70">
        {mode === "signup" ? "Already have an account?" : "New to TrueYoke?"}{" "}
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

      <p className="mt-8 text-center text-xs text-app-ink/50">
        After signing up you'll continue to{" "}
        <Link to="/onboarding" className="underline">
          onboarding
        </Link>
        .
      </p>
    </main>
  );
}
