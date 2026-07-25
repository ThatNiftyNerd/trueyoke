import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StepShell } from "./StepShell";
import { updateOwnProfile, type OnboardingProfile } from "../api";
import { faithSchema, type FaithValues } from "../schemas";
import { SPIRITUALITY_MARKERS } from "../logic";

interface Props {
  profile: OnboardingProfile;
  onSaved: (patch: Partial<OnboardingProfile>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function FaithStep({ profile, onSaved, onNext, onBack, canGoBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FaithValues>({
    resolver: zodResolver(faithSchema),
    defaultValues: {
      church_affiliation: profile.church_affiliation ?? "",
      congregation: profile.congregation ?? "",
      spirituality_markers: profile.spirituality_markers ?? [],
    },
  });
  const markers = watch("spirituality_markers") ?? [];

  const toggle = (marker: string, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...markers, marker]))
      : markers.filter((m) => m !== marker);
    setValue("spirituality_markers", next, { shouldDirty: true });
  };

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
        <div className="space-y-1">
          <Label className="text-brand-burgundy">Church affiliation</Label>
          <Input placeholder="Church of Christ" {...register("church_affiliation")} />
        </div>
        <div className="space-y-1">
          <Label className="text-brand-burgundy">Congregation</Label>
          <Input placeholder="Congregation name" {...register("congregation")} />
        </div>
        <div className="space-y-2">
          <Label className="text-brand-burgundy">Spirituality markers</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SPIRITUALITY_MARKERS.map((m) => {
              const checked = markers.includes(m);
              return (
                <label
                  key={m}
                  className="flex items-center gap-2 rounded-md border border-brand-burgundy/10 bg-white/60 px-3 py-2 text-sm text-brand-burgundy"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => toggle(m, v === true)}
                  />
                  {m}
                </label>
              );
            })}
          </div>
        </div>
      </StepShell>
    </form>
  );
}
