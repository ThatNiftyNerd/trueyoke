import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StepShell } from "./StepShell";
import { updateOwnProfile, type OnboardingProfile } from "../api";
import { bioSchema, BIO_MAX, INTENT_MAX, emptyToNull, type BioValues } from "../schemas";

interface Props {
  profile: OnboardingProfile;
  onSaved: (patch: Partial<OnboardingProfile>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function BioStep({ profile, onSaved, onNext, onBack, canGoBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BioValues>({
    resolver: zodResolver(bioSchema),
    defaultValues: {
      bio: profile.bio ?? "",
      marriage_intentions: profile.marriage_intentions ?? "",
    },
  });
  const bioLen = watch("bio")?.length ?? 0;
  const intentLen = watch("marriage_intentions")?.length ?? 0;

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const patch = emptyToNull(values) as Partial<OnboardingProfile>;
      await updateOwnProfile(patch);
      onSaved(patch);
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col">
      <StepShell onBack={onBack} canGoBack={canGoBack} submitting={isSubmitting} error={error}>
        <div className="space-y-1">
          <div className="flex items-baseline justify-between">
            <Label className="text-brand-burgundy">About you</Label>
            <span className="text-xs text-brand-burgundy/60">
              {bioLen}/{BIO_MAX}
            </span>
          </div>
          <Textarea
            rows={5}
            maxLength={BIO_MAX}
            placeholder="Share who you are, what matters to you, and what you love."
            {...register("bio")}
          />
          {errors.bio?.message ? (
            <p className="text-xs text-brand-terracotta">{errors.bio.message}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <div className="flex items-baseline justify-between">
            <Label className="text-brand-burgundy">Marriage intentions (optional)</Label>
            <span className="text-xs text-brand-burgundy/60">
              {intentLen}/{INTENT_MAX}
            </span>
          </div>
          <Textarea
            rows={4}
            maxLength={INTENT_MAX}
            placeholder="What are you seeking in a spouse?"
            {...register("marriage_intentions")}
          />
        </div>
      </StepShell>
    </form>
  );
}
