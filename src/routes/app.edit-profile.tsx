import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { getOnboardingProfile, type OnboardingProfile } from "@/features/profile/api";
import { DisplayNameStep } from "@/features/profile/steps/DisplayNameStep";
import { DemographicsStep } from "@/features/profile/steps/DemographicsStep";
import { PhotosStep } from "@/features/profile/steps/PhotosStep";
import { BioStep } from "@/features/profile/steps/BioStep";
import { FaithStep } from "@/features/profile/steps/FaithStep";
import { LifeVerseStep } from "@/features/profile/steps/LifeVerseStep";
import { VoiceIntroStep } from "@/features/profile/steps/VoiceIntroStep";
import { SelfieCapture } from "@/features/profile/SelfieCapture";

export const Route = createFileRoute("/app/edit-profile")({
  head: () => ({
    meta: [
      { title: "Edit your profile — TrueYoke" },
      { name: "description", content: "Update your TrueYoke profile details, photos, and faith." },
      { property: "og:title", content: "Edit your profile — TrueYoke" },
      {
        property: "og:description",
        content: "Update your TrueYoke profile details, photos, and faith.",
      },
    ],
  }),
  component: EditProfileScreen,
});

type SectionKey =
  | "name"
  | "demographics"
  | "photos"
  | "bio"
  | "faith"
  | "life-verse"
  | "voice"
  | "mentor-details";

interface SectionDef {
  key: SectionKey;
  title: string;
  description: string;
}

const SECTIONS: readonly SectionDef[] = [
  { key: "name", title: "Display name", description: "The casual name others see." },
  {
    key: "demographics",
    title: "Full name & details",
    description: "Full name, age, gender, location, background.",
  },
  { key: "photos", title: "Photos", description: "Add or remove your profile photos." },
  { key: "bio", title: "Bio & marriage intentions", description: "Who you are and what you seek." },
  {
    key: "faith",
    title: "Church affiliation & designation",
    description: "Congregation, official designation, spirituality markers.",
  },
  { key: "life-verse", title: "Life verse", description: "A verse that anchors you." },
  { key: "voice", title: "Voice intro", description: "Record or replace your spoken intro." },
];

const MENTOR_SECTIONS: readonly SectionDef[] = [
  {
    key: "mentor-details",
    title: "About you",
    description: "Full name, nationality, church affiliation, title, and email.",
  },
  { key: "photos", title: "Photos", description: "Add or remove your profile photos." },
];


function EditProfileScreen() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<SectionKey | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getOnboardingProfile();
        if (!cancelled) setProfile(p);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyPatch = (patch: Partial<OnboardingProfile>) =>
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));

  const closeSection = (title?: string) => {
    setSection(null);
    setSavedNote(title ? `${title} saved.` : null);
  };

  if (loading) {
    return (
      <section className="px-4 pt-6">
        <p className="text-sm text-app-ink/70">Loading…</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="px-4 pt-6">
        <p className="text-sm text-app-ink/70">
          We couldn&apos;t load your profile. Please reload and try again.
        </p>
      </section>
    );
  }

  const isMatch = profile.account_type === "match";
  const visible = SECTIONS.filter((s) => s.key !== "photos" || !isMatch);
  const active = visible.find((s) => s.key === section) ?? null;

  const stepProps = {
    profile,
    onSaved: applyPatch,
    onNext: () => closeSection(active?.title),
    onBack: () => closeSection(),
    canGoBack: true,
  };

  return (
    <section className="flex flex-col px-4 pt-6">
      <header className="mb-6">
        <h1 className="font-serif text-2xl text-app-ink">
          {active ? active.title : "Edit your profile"}
        </h1>
        <p className="mt-1 text-sm text-app-ink/70">
          {active ? active.description : "Everything from onboarding stays editable here."}
        </p>
      </header>

      {active ? (
        <>
          {active.key === "name" && <DisplayNameStep {...stepProps} />}
          {active.key === "demographics" && <DemographicsStep {...stepProps} />}
          {active.key === "photos" && (
            <PhotosStep
              onNext={() => closeSection(active.title)}
              onBack={() => closeSection()}
              canGoBack
            />
          )}
          {active.key === "bio" && <BioStep {...stepProps} />}
          {active.key === "faith" && <FaithStep {...stepProps} />}
          {active.key === "life-verse" && <LifeVerseStep {...stepProps} />}
          {active.key === "voice" && <VoiceIntroStep {...stepProps} />}
        </>
      ) : (
        <div className="space-y-3">
          {savedNote ? (
            <p
              role="status"
              className="rounded-md border border-app-accent/40 bg-app-accent/10 px-3 py-2 text-sm text-app-ink"
            >
              {savedNote}
            </p>
          ) : null}

          {visible.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                setSavedNote(null);
                setSection(s.key);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-md border border-app-ink/20 px-4 py-3 text-left"
            >
              <span>
                <span className="block text-sm font-medium text-app-ink">{s.title}</span>
                <span className="block text-xs text-app-ink/60">{s.description}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-app-ink/50" aria-hidden="true" />
            </button>
          ))}

          {isMatch ? (
            <div className="rounded-md border border-app-ink/20 p-4">
              <p className="mb-2 text-sm font-medium text-app-ink">Profile photo</p>
              <p className="mb-3 text-xs text-app-ink/60">
                Match accounts use a live selfie instead of a photo gallery.
              </p>
              <SelfieCapture />
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => navigate({ to: "/app/profile" })}
            className="block w-full rounded-md border border-app-ink/20 px-4 py-3 text-center text-sm font-medium text-app-ink"
          >
            Done
          </button>
        </div>
      )}
    </section>
  );
}
