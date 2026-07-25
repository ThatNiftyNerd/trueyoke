import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VOICE_INTRO_MAX_SECONDS } from "@/lib/constants";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Build your profile — Yoked" },
      { name: "description", content: "Walk through your Yoked profile step by step." },
      { property: "og:title", content: "Build your profile — Yoked" },
      { property: "og:description", content: "Walk through your Yoked profile step by step." },
    ],
  }),
  component: OnboardingWizard,
});

interface Step {
  key: string;
  title: string;
  description: string;
}

const STEPS: readonly Step[] = [
  {
    key: "demographics",
    title: "Demographics",
    description: "Age, gender, location, and background.",
  },
  { key: "photos", title: "Photos", description: "Add photos so people can recognize you." },
  {
    key: "bio",
    title: "Bio & marriage intentions",
    description: "Share who you are and what you're seeking.",
  },
  {
    key: "faith",
    title: "Church affiliation & spirituality",
    description: "Your congregation and the markers of your walk.",
  },
  { key: "life-verse", title: "Life verse", description: "A verse that anchors you." },
  {
    key: "voice",
    title: "Voice intro",
    description: `Record a ${VOICE_INTRO_MAX_SECONDS}-second introduction.`,
  },
];

function OnboardingWizard() {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  return (
    <main className="flex min-h-[100dvh] flex-col bg-brand-linen px-6 py-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-brand-sage">
          Step {index + 1} of {STEPS.length}
        </p>
        <h1 className="mt-1 font-serif text-2xl text-brand-burgundy">{step.title}</h1>
        <p className="mt-1 text-sm text-brand-burgundy/70">{step.description}</p>
      </header>

      <section className="flex-1 rounded-lg border border-brand-burgundy/10 bg-white/50 p-4">
        {/* TODO: render step-specific fields for `{step.key}`. No persistence yet. */}
        <p className="text-sm text-brand-burgundy/60">Fields for this step will live here.</p>
      </section>

      <footer className="mt-6 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="border-brand-burgundy/30 text-brand-burgundy"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Back
        </Button>
        {isLast ? (
          <Link
            to="/app/discover"
            className="rounded-md bg-brand-burgundy px-4 py-2 text-sm font-medium text-brand-linen"
          >
            Finish
          </Link>
        ) : (
          <Button
            type="button"
            className="bg-brand-burgundy text-brand-linen hover:bg-brand-burgundy/90"
            onClick={() => setIndex((i) => Math.min(STEPS.length - 1, i + 1))}
          >
            Continue
          </Button>
        )}
      </footer>
    </main>
  );
}
