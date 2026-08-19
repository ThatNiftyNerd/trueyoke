import { redirectIfSignedIn, signedInLandingPath } from "@/features/auth/guards";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AccountType } from "@/lib/constants";
import { PrivacyConsentCheckbox } from "@/components/app/PrivacyConsentCheckbox";
import { MarketingConsentCheckbox } from "@/components/app/MarketingConsentCheckbox";
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
  listVerifiedTotpFactorId,
  challengeAndVerifyTotp,
} from "@/features/auth/api";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { isRecoveryRedirect, clearRecoveryRedirect } from "@/features/auth/recovery-detect";
import { PasswordInput } from "@/components/ui/password-input";
import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

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
  component: AuthScreenBoundary,
});

type Mode = "signin" | "signup" | "forgot";

/**
 * Defence in depth: any future throw inside AuthScreen renders a readable
 * "something went wrong" screen instead of a blank page.
 */
function AuthScreenBoundary() {
  return (
    <ErrorBoundary name="auth_route">
      <AuthScreen />
    </ErrorBoundary>
  );
}

function AuthScreen() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<Mode>(search.mode ?? "signup");
  const [accountType] = useState<AccountType | null>(search.type ?? null);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  // Optional, additional consent — never pre-checked.
  const [marketingConsent, setMarketingConsent] = useState(false);
  // Google has no form step, so a brand-new OAuth user (session but no
  // profiles row) gets a one-time consent interstitial before bootstrap.
  const [oauthConsentPending, setOauthConsentPending] = useState(false);
  const [oauthConsent, setOauthConsent] = useState(false);
  // A recovery link establishes a real session; we must intercept it and ask
  // for a new password instead of navigating into the app.
  const [recoveryPending, setRecoveryPending] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Some recovery sessions belong to accounts with MFA enrolled elsewhere
  // (see listVerifiedTotpFactorId doc comment) and must be stepped up to
  // AAL2 with a TOTP code before Supabase will allow the password update.
  // `mfaFactorId === undefined` means "still checking"; `null` means "no
  // MFA on this account, proceed straight to the password form".
  const [mfaFactorId, setMfaFactorId] = useState<string | null | undefined>(undefined);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  // A confirmed-email or Google session can land here either from the web
  // redirect back to /auth or from the native deep-link exchange. Either way,
  // bootstrap the profile row once and then hand off to the shared landing
  // rule.
  //
  // The session frequently lands *before* this effect subscribes (supabase-js
  // parses the URL fragment during module init, so SIGNED_IN can fire while
  // the router is still redirecting /onboarding → /auth). Subscribing alone
  // would therefore miss it and leave the signup form on screen until a
  // manual reload, so we also resolve whatever session already exists at
  // mount. `handled` keeps the two paths from racing each other.
  useEffect(() => {
    let handled = false;

    const resolve = (session: Session | null, event?: AuthChangeEvent) => {
      if (!session || handled) return;
      handled = true;
      // event is only present on live auth-state changes (not the initial
      // getCurrentSession() resolve below), but that's fine: on native the
      // app-wide listener in router.tsx already called markRecoveryRedirect()
      // before navigating here, so isRecoveryRedirect() covers that case too.
      if (event === "PASSWORD_RECOVERY" || isRecoveryRedirect()) {
        setRecoveryPending(true);
        void (async () => {
          try {
            setMfaFactorId(await listVerifiedTotpFactorId());
          } catch {
            // If the factor lookup itself fails, fall back to the plain
            // password form -- updatePassword() will surface the AAL2
            // error there if it turns out to be needed, which is still a
            // strictly better outcome than getting stuck on a spinner.
            setMfaFactorId(null);
          }
        })();
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
          handled = false;
          setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
        } finally {
          setSubmitting(false);
        }
      })();
    };

    const unsubscribe = onAuthChange(resolve);
    void getCurrentSession().then((session) => resolve(session));
    return unsubscribe;
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
      clearRecoveryRedirect();
      setRecoveryPending(false);
      navigate({ to: await signedInLandingPath() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyTotp() {
    setError(null);
    if (totpCode.length !== 6 || !mfaFactorId) return;
    setSubmitting(true);
    try {
      await challengeAndVerifyTotp(mfaFactorId, totpCode);
      setMfaVerified(true);
    } catch (err) {
      setTotpCode("");
      setError(err instanceof Error ? err.message : "Incorrect code. Please try again.");
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
        accountType: search.type ?? null,
        marketingConsent,
      });
      setOauthConsentPending(false);
      navigate({ to: await signedInLandingPath() });
    } catch (err) {
      if (
        err instanceof Error &&
        (err as Error & { code?: string }).code === "ACCOUNT_TYPE_UNKNOWN"
      ) {
        navigate({ to: "/choose-type" });
        return;
      }
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setNotice(null);
    if (!accountType) {
      setError("Please choose whether you're joining as a Match or a Mentor first.");
      return;
    }
    setSubmitting(true);
    try {
      await signInWithGoogle(accountType);
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
        if (!accountType) {
          throw new Error("Please choose whether you're joining as a Match or a Mentor first.");
        }
        await signUpWithEmail({
          email,
          password,
          accountType,
          displayName: displayName.trim(),
          privacyAcceptedAt: new Date().toISOString(),
          privacyPolicyVersion: PRIVACY_POLICY_VERSION,
          marketingConsent,
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
          if (!accountType) {
            throw new Error("Please choose whether you're joining as a Match or a Mentor first.");
          }
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
    // Still resolving whether this account has MFA enrolled -- keep this
    // window brief and unobtrusive rather than flashing the password form
    // first for accounts that are about to need the step-up screen.
    if (mfaFactorId === undefined) {
      return (
        <main
          className="flex min-h-[100dvh] flex-col items-center justify-center bg-app-canvas px-6 py-10"
          style={{ paddingTop: "max(2.5rem, calc(env(safe-area-inset-top) + 1.5rem))" }}
        >
          <p className="text-sm text-app-ink/60">Yoking…</p>
        </main>
      );
    }

    if (mfaFactorId && !mfaVerified) {
      return (
        <main
          className="flex min-h-[100dvh] flex-col justify-center bg-app-canvas px-6 py-10"
          style={{ paddingTop: "max(2.5rem, calc(env(safe-area-inset-top) + 1.5rem))" }}
        >
          <div className="mx-auto w-full max-w-sm">
            <h1 className="font-serif text-2xl text-app-ink">Verify it's you</h1>
            <p className="mt-2 text-sm text-app-ink/70">
              This account has two-factor authentication enabled. Enter the 6-digit code from your
              authenticator app to continue.
            </p>
            <div className="mt-6 flex justify-center">
              <InputOTP
                maxLength={6}
                value={totpCode}
                onChange={(value) => {
                  setTotpCode(value);
                  setError(null);
                }}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
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
              disabled={submitting || totpCode.length !== 6}
              onClick={handleVerifyTotp}
            >
              {submitting ? "Verifying…" : "Verify code"}
            </Button>
          </div>
        </main>
      );
    }

    return (
      <main
        className="flex min-h-[100dvh] flex-col justify-center bg-app-canvas px-6 py-10"
        style={{ paddingTop: "max(2.5rem, calc(env(safe-area-inset-top) + 1.5rem))" }}
      >
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
      <main
        className="flex min-h-[100dvh] flex-col justify-center bg-app-canvas px-6 py-10"
        style={{ paddingTop: "max(2.5rem, calc(env(safe-area-inset-top) + 1.5rem))" }}
      >
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
      <main
        className="flex min-h-[100dvh] flex-col justify-center bg-app-canvas px-6 py-10"
        style={{ paddingTop: "max(2.5rem, calc(env(safe-area-inset-top) + 1.5rem))" }}
      >
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-serif text-2xl text-app-ink">One last thing</h1>
          <p className="mt-2 text-sm text-app-ink/70">
            Before we create your TrueYoke profile, please review and accept how we handle your
            data.
          </p>
          <div className="mt-6 space-y-3">
            <PrivacyConsentCheckbox
              id="privacy-consent-oauth"
              checked={oauthConsent}
              onCheckedChange={setOauthConsent}
              disabled={submitting}
            />
            <MarketingConsentCheckbox
              id="marketing-consent-oauth"
              checked={marketingConsent}
              onCheckedChange={setMarketingConsent}
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
          <div className="space-y-3">
            <PrivacyConsentCheckbox
              checked={privacyAccepted}
              onCheckedChange={setPrivacyAccepted}
              disabled={submitting}
            />
            <MarketingConsentCheckbox
              checked={marketingConsent}
              onCheckedChange={setMarketingConsent}
              disabled={submitting}
            />
          </div>
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
