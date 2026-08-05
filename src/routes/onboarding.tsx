import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { requireAuth, redirectIfSignedIn } from "@/features/auth/guards";
import { getOnboardingProfile, type OnboardingProfile } from "@/features/profile/api";
import { stepsFor, firstIncompleteStepIndex, missingStepTitles } from "@/features/profile/logic";
import { DemographicsStep } from "@/features/profile/steps/DemographicsStep";
import { PhotosStep } from "@/features/profile/steps/PhotosStep";
import { BioStep } from "@/features/profile/steps/BioStep";
import { FaithStep } from "@/features/profile/steps/FaithStep";
import { LifeVerseStep } from "@/features/profile/steps/LifeVerseStep";
import { VoiceIntroStep } from "@/features/profile/steps/VoiceIntroStep";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Build your profile — TrueYoke" },
      { name: "description", content: "Walk through your TrueYoke profile step by step." },
      { property: "og:title", content: "Build your profile — TrueYoke" },
      { property: "og:description", content: "Walk through your TrueYoke profile step by step." },
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
    let cancelled = false;
    (async () => {
      try {
        const p = await getOnboardingProfile();
        if (cancelled) return;
        if (!p) {
          // Signed in but no `profiles` row yet — the consent step never ran.
          // /auth owns that flow (consent interstitial -> ensureOAuthProfile),
          // so send them there instead of spinning forever.
          navigate({ to: "/auth", replace: true });
          return;
        }
        setProfile(p);
        setIndex(firstIncompleteStepIndex(p));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

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
    if (!fresh) {
      navigate({ to: "/auth", replace: true });
      return;
    }
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
      <main className="flex min-h-[100dvh] items-center justify-center bg-app-canvas">
        <p className="text-sm text-app-ink/70">Loading…</p>
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
    <main className="flex min-h-[100dvh] flex-col bg-app-canvas px-6 py-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-app-on-accent">
          Step {index + 1} of {STEPS.length}
        </p>
        <h1 className="mt-1 font-serif text-2xl text-app-ink">{step.title}</h1>
        <p className="mt-1 text-sm text-app-ink/70">{step.description}</p>
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
          className="mt-4 rounded-md border border-app-warn/40 bg-app-warn/10 px-3 py-2 text-sm text-app-warn"
        >
          {finishError}
        </p>
      ) : null}
    </main>
  );
}
