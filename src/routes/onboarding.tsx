import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { requireAuth, redirectIfSignedIn } from "@/features/auth/guards";
import { getOnboardingProfile, type OnboardingProfile } from "@/features/profile/api";
import { STEPS, firstIncompleteStepIndex, missingStepTitles } from "@/features/profile/logic";
import { DemographicsStep } from "@/features/profile/steps/DemographicsStep";
import { PhotosStep } from "@/features/profile/steps/PhotosStep";
import { BioStep } from "@/features/profile/steps/BioStep";
import { FaithStep } from "@/features/profile/steps/FaithStep";
import { LifeVerseStep } from "@/features/profile/steps/LifeVerseStep";
import { VoiceIntroStep } from "@/features/profile/steps/VoiceIntroStep";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Build your profile — Yoked" },
      { name: "description", content: "Walk through your Yoked profile step by step." },
      { property: "og:title", content: "Build your profile — Yoked" },
      { property: "og:description", content: "Walk through your Yoked profile step by step." },
    ],
  }),
  beforeLoad: async () => {
    // Anonymous -> login. Signed in with a finished profile -> Discovery.
    await requireAuth();
    await redirectIfSignedIn({ allowOnboarding: true });
  },
  component: OnboardingWizard,
});

function OnboardingWizard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finishError, setFinishError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await getOnboardingProfile();
        setProfile(p);
        setIndex(firstIncompleteStepIndex(p));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const applyPatch = (patch: Partial<OnboardingProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const goNext = async () => {
    setFinishError(null);
    if (index < STEPS.length - 1) {
      setIndex(index + 1);
      return;
    }
    // Last step just saved — refetch to read the DB-generated profile_complete.
    const fresh = await getOnboardingProfile();
    setProfile(fresh);
    if (fresh?.profile_complete) {
      navigate({ to: "/app/discover" });
    } else {
      const missing = missingStepTitles(fresh);
      setFinishError(
        missing.length
          ? `Still needs: ${missing.join(", ")}.`
          : "Profile not marked complete yet — please try again.",
      );
    }
  };

  const goBack = () => setIndex((i) => Math.max(0, i - 1));

  if (loading || !profile) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-brand-linen">
        <p className="text-sm text-brand-burgundy/70">Loading…</p>
      </main>
    );
  }

  const step = STEPS[index];
  const canGoBack = index > 0;
  const commonProps = {
    profile,
    onSaved: applyPatch,
    onNext: goNext,
    onBack: goBack,
    canGoBack,
  };

  return (
    <main className="flex min-h-[100dvh] flex-col bg-brand-linen px-6 py-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-brand-sage">
          Step {index + 1} of {STEPS.length}
        </p>
        <h1 className="mt-1 font-serif text-2xl text-brand-burgundy">{step.title}</h1>
        <p className="mt-1 text-sm text-brand-burgundy/70">{step.description}</p>
      </header>

      {step.key === "demographics" && <DemographicsStep {...commonProps} />}
      {step.key === "photos" && (
        <PhotosStep onNext={goNext} onBack={goBack} canGoBack={canGoBack} />
      )}
      {step.key === "bio" && <BioStep {...commonProps} />}
      {step.key === "faith" && <FaithStep {...commonProps} />}
      {step.key === "life-verse" && <LifeVerseStep {...commonProps} />}
      {step.key === "voice" && <VoiceIntroStep {...commonProps} />}

      {finishError ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-brand-terracotta/40 bg-brand-terracotta/10 px-3 py-2 text-sm text-brand-terracotta"
        >
          {finishError}
        </p>
      ) : null}
    </main>
  );
}
