import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { StepShell } from "./StepShell";
import { LifeVerseLookup } from "./LifeVerseLookup";
import { updateOwnProfile, type OnboardingProfile } from "../api";
import { lifeVerseSchema, LIFE_VERSE_MAX, type LifeVerseValues } from "../schemas";

interface Props {
  profile: OnboardingProfile;
  onSaved: (patch: Partial<OnboardingProfile>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

type EntryMode = "manual" | "lookup";

export function LifeVerseStep({ profile, onSaved, onNext, onBack, canGoBack }: Props) {
  const [mode, setMode] = useState<EntryMode>("manual");
  const [error, setError] = useState<string | null>(null);
  const [lookupValue, setLookupValue] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LifeVerseValues>({
    resolver: zodResolver(lifeVerseSchema),
    defaultValues: { life_verse: profile.life_verse ?? "" },
  });
  const len = watch("life_verse")?.length ?? 0;

  function handleResolved(saved: string) {
    setLookupValue(saved);
    setValue("life_verse", saved.slice(0, LIFE_VERSE_MAX), { shouldValidate: true });
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await updateOwnProfile(values);
      onSaved(values);
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col">
      <StepShell onBack={onBack} canGoBack={canGoBack} submitting={isSubmitting} error={error}>
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <Label className="text-brand-burgundy">Life verse</Label>
            <span className="text-xs text-brand-burgundy/60">
              {len}/{LIFE_VERSE_MAX}
            </span>
          </div>

          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(v) => v && setMode(v as EntryMode)}
            className="justify-start"
          >
            <ToggleGroupItem value="manual" className="text-xs">
              Type manually
            </ToggleGroupItem>
            <ToggleGroupItem value="lookup" className="text-xs">
              Look up Scripture
            </ToggleGroupItem>
          </ToggleGroup>

          {mode === "manual" ? (
            <>
              <Textarea
                rows={5}
                maxLength={LIFE_VERSE_MAX}
                placeholder="John 3:16 — For God so loved the world…"
                {...register("life_verse")}
              />
              <p className="text-xs text-brand-burgundy/60">
                Include the reference and, if you like, the verse text.
              </p>
            </>
          ) : (
            <>
              <LifeVerseLookup onResolved={handleResolved} />
              {/* Hidden field keeps react-hook-form as the single source of truth for
                  validation/submit; LifeVerseLookup only ever writes into it via setValue. */}
              <input type="hidden" {...register("life_verse")} value={lookupValue} readOnly />
            </>
          )}

          {errors.life_verse?.message ? (
            <p className="text-xs text-brand-terracotta">{errors.life_verse.message}</p>
          ) : null}
        </div>
      </StepShell>
    </form>
  );
}
