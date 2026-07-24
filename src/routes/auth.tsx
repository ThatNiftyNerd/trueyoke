import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACCOUNT_TYPES, type AccountType } from "@/lib/constants";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Yoked" },
      { name: "description", content: "Sign in or create your Yoked account." },
      { property: "og:title", content: "Sign in — Yoked" },
      { property: "og:description", content: "Sign in or create your Yoked account." },
    ],
  }),
  component: AuthScreen,
});

type Mode = "signin" | "signup";

function AuthScreen() {
  const [mode, setMode] = useState<Mode>("signup");
  const [accountType, setAccountType] = useState<AccountType>("match");

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

      <form
        className="mx-auto flex w-full max-w-sm flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: wire to features/auth/api.ts (signUpWithEmail / signInWithEmail)
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" required />
        </div>
        <Button
          type="submit"
          className="bg-brand-burgundy text-brand-linen hover:bg-brand-burgundy/90"
        >
          {mode === "signup" ? "Create account" : "Sign in"}
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
            // TODO: wire to lovable.auth.signInWithOAuth("google", ...)
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
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
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
