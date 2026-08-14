import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StepShell } from "./StepShell";
import { updateOwnProfile, type OnboardingProfile } from "../api";
import { lifeVerseSchema, LIFE_VERSE_MAX, type LifeVerseValues } from "../schemas";

interface Props {
  profile: OnboardingProfile;
  onSaved: (patch: Partial<OnboardingProfile>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function LifeVerseStep({ profile, onSaved, onNext, onBack, canGoBack }: Props) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LifeVerseValues>({
    resolver: zodResolver(lifeVerseSchema),
    defaultValues: { life_verse: profile.life_verse ?? "" },
  });
  const len = watch("life_verse")?.length ?? 0;

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
            <Label className="text-app-ink">Life verse</Label>
            <span className="text-xs text-app-ink/60">
              {len}/{LIFE_VERSE_MAX}
            </span>
          </div>

          <Textarea
            rows={5}
            maxLength={LIFE_VERSE_MAX}
            placeholder="John 3:16 — For God so loved the world…"
            {...register("life_verse")}
          />
          <p className="text-xs text-app-ink/60">
            Include the reference and, if you like, the verse text.
          </p>

          {errors.life_verse?.message ? (
            <p className="text-xs text-app-warn">{errors.life_verse.message}</p>
          ) : null}
        </div>
      </StepShell>
    </form>
  );
}
