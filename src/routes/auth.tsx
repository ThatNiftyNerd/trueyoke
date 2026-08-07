import { redirectIfSignedIn, signedInLandingPath } from "@/features/auth/guards";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AccountType } from "@/lib/constants";
import { PrivacyConsentCheckbox } from "@/components/app/PrivacyConsentCheckbox";
import {
  PRIVACY_POLICY_VERSION,
  hasProfileRow,
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  ensureProfileExists,
  ensureOAuthProfile,
  getCurrentSession,
  onAuthChange,
  requestPasswordReset,
  updatePassword,
} from "@/features/auth/api";
import { isRecoveryRedirect } from "@/features/auth/recovery-detect";
import { PasswordInput } from "@/components/ui/password-input";

type AuthSearch = {
  type?: AccountType;
  mode?: "signin" | "signup";
};

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    const type = search.type;
    const mode = search.mode;
    return {
      type: type === "match" || type === "mentor" ? type : undefined,
      mode: mode === "signin" || mode === "signup" ? mode : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Sign in — TrueYoke" },
      { name: "description", content: "Sign in or create your TrueYoke account." },
      { property: "og:title", content: "Sign in — TrueYoke" },
      { property: "og:description", content: "Sign in or create your TrueYoke account." },
    ],
  }),
  // A signed-in user with no profile must be allowed to render this route:
  // AuthScreen owns the required consent interstitial and profile bootstrap.
  beforeLoad: () => redirectIfSignedIn({ allowAuth: true }),
  component: AuthScreen,
});

type Mode = "signin" | "signup" | "forgot";

function AuthScreen() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<Mode>(search.mode ?? "signup");
  const [accountType] = useState<AccountType>(search.type ?? "match");

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  // Google has no form step, so a brand-new OAuth user (session but no
  // profiles row) gets a one-time consent interstitial before bootstrap.
  const [oauthConsentPending, setOauthConsentPending] = useState(false);
  const [oauthConsent, setOauthConsent] = useState(false);
  // A recovery link establishes a real session; we must intercept it and ask
  // for a new password instead of navigating into the app.
  const [recoveryPending, setRecoveryPending] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // A Google session can land here either from the web redirect back to
  // /auth or from the native deep-link exchange. Either way, bootstrap the
  // profile row once and then hand off to the shared landing rule.
  useEffect(() => {
    return onAuthChange((session) => {
      if (!session) return;
      if (isRecoveryRedirect) {
        setRecoveryPending(true);
        return;
      }
      void (async () => {
        try {
          // Returning users already consented, only ask brand-new ones.
          if (await hasProfileRow()) {
            navigate({ to: await signedInLandingPath() });
            return;
          }
          setOauthConsentPending(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
        } finally {
          setSubmitting(false);
        }
      })();
    });
  }, [navigate]);

  async function handleUpdatePassword() {
    setError(null);
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(newPassword);
      setRecoveryPending(false);
      navigate({ to: await signedInLandingPath() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setNotice("If an account exists for that email, we've sent a password reset link.");
      setMode("signin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOAuthConsent() {
    setError(null);
    setSubmitting(true);
    try {
      await ensureOAuthProfile({
        privacyAcceptedAt: new Date().toISOString(),
        privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      });
      setOauthConsentPending(false);
      navigate({ to: await signedInLandingPath() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

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
        if (!privacyAccepted) {
          throw new Error("Please accept the Privacy Policy to continue.");
        }
        await signUpWithEmail({
          email,
          password,
          accountType,
          displayName: displayName.trim(),
          privacyAcceptedAt: new Date().toISOString(),
          privacyPolicyVersion: PRIVACY_POLICY_VERSION,
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

  if (recoveryPending) {
    return (
      <main className="flex min-h-[100dvh] flex-col justify-center bg-app-canvas px-6 py-10">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-serif text-2xl text-app-ink">Set new password</h1>
          <p className="mt-2 text-sm text-app-ink/70">
            Choose a new password for your TrueYoke account.
          </p>
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-md border border-app-warn/40 bg-app-warn/10 px-3 py-2 text-sm text-app-warn"
            >
              {error}
            </p>
          )}
          <Button
            className="mt-6 w-full bg-app-primary text-app-on-primary hover:bg-app-primary/90"
            disabled={submitting}
            onClick={handleUpdatePassword}
          >
            {submitting ? "Please wait…" : "Update password"}
          </Button>
        </div>
      </main>
    );
  }

  if (mode === "forgot") {
    return (
      <main className="flex min-h-[100dvh] flex-col justify-center bg-app-canvas px-6 py-10">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-serif text-2xl text-app-ink">Reset your password</h1>
          <p className="mt-2 text-sm text-app-ink/70">
            Enter your email and we'll send you a link to set a new password.
          </p>
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleForgotPassword}>
            <div className="space-y-1.5">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <Button
              type="submit"
              disabled={submitting}
              className="bg-app-primary text-app-on-primary hover:bg-app-primary/90"
            >
              {submitting ? "Please wait…" : "Send reset link"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-app-ink/70">
            <button
              type="button"
              className="underline"
              onClick={() => {
                setError(null);
                setNotice(null);
                setMode("signin");
              }}
            >
              Back to sign in
            </button>
          </p>
        </div>
      </main>
    );
  }

  if (oauthConsentPending) {
    return (
      <main className="flex min-h-[100dvh] flex-col justify-center bg-app-canvas px-6 py-10">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-serif text-2xl text-app-ink">One last thing</h1>
          <p className="mt-2 text-sm text-app-ink/70">
            Before we create your TrueYoke profile, please review and accept how we handle your
            data.
          </p>
          <div className="mt-6">
            <PrivacyConsentCheckbox
              id="privacy-consent-oauth"
              checked={oauthConsent}
              onCheckedChange={setOauthConsent}
              disabled={submitting}
            />
          </div>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-md border border-app-warn/40 bg-app-warn/10 px-3 py-2 text-sm text-app-warn"
            >
              {error}
            </p>
          )}
          <Button
            className="mt-6 w-full bg-app-primary text-app-on-primary hover:bg-app-primary/90"
            disabled={submitting || !oauthConsent}
            onClick={handleOAuthConsent}
          >
            {submitting ? "Please wait…" : "Agree and continue"}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] flex-col bg-app-canvas px-6 py-10">
      <header className="mb-8 text-center">
        <p className="text-sm uppercase tracking-widest text-app-on-accent">TrueYoke</p>
        <h1 className="mt-2 font-serif text-2xl text-app-ink">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
      </header>

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
          <PasswordInput
            id="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {mode === "signin" && (
          <button
            type="button"
            className="self-start text-sm text-app-ink/70 underline"
            onClick={() => {
              setError(null);
              setNotice(null);
              setMode("forgot");
            }}
          >
            Forgot password?
          </button>
        )}

        {mode === "signup" && (
          <PrivacyConsentCheckbox
            checked={privacyAccepted}
            onCheckedChange={setPrivacyAccepted}
            disabled={submitting}
          />
        )}

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
          disabled={submitting || (mode === "signup" && !privacyAccepted)}
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
            if (mode === "signup") {
              setMode("signin");
            } else {
              // Signup always needs an account type, so route through the picker.
              navigate({ to: "/choose-type" });
            }
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
