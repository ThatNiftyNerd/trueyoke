import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StepShell } from "./StepShell";
import { updateOwnProfile, type OnboardingProfile } from "../api";
import { demographicsSchema, emptyToNull, type DemographicsValues } from "../schemas";

interface Props {
  profile: OnboardingProfile;
  onSaved: (patch: Partial<OnboardingProfile>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function DemographicsStep({ profile, onSaved, onNext, onBack, canGoBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DemographicsValues>({
    resolver: zodResolver(demographicsSchema),
    defaultValues: {
      age: profile.age ?? (undefined as unknown as number),
      gender: profile.gender ?? (undefined as unknown as "male" | "female"),
      location_label: profile.location_label ?? "",
      blood_group: profile.blood_group ?? "",
      genotype: profile.genotype ?? "",
      nationality: profile.nationality ?? "",
      qualification: profile.qualification ?? "",
      occupation: profile.occupation ?? "",
    },
  });
  const gender = watch("gender");

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
        <Field label="Age" error={errors.age?.message}>
          <Input
            type="number"
            inputMode="numeric"
            min={18}
            max={99}
            {...register("age", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Gender" error={errors.gender?.message}>
          <RadioGroup
            value={gender ?? ""}
            onValueChange={(v) =>
              setValue("gender", v as "male" | "female", { shouldValidate: true })
            }
            className="flex gap-6"
          >
            <label className="flex items-center gap-2 text-sm text-brand-burgundy">
              <RadioGroupItem value="male" /> Male
            </label>
            <label className="flex items-center gap-2 text-sm text-brand-burgundy">
              <RadioGroupItem value="female" /> Female
            </label>
          </RadioGroup>
        </Field>
        <Field label="Location (city, country)">
          <Input placeholder="Lagos, Nigeria" {...register("location_label")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Blood group">
            <Input {...register("blood_group")} />
          </Field>
          <Field label="Genotype">
            <Input {...register("genotype")} />
          </Field>
          <Field label="Nationality">
            <Input {...register("nationality")} />
          </Field>
          <Field label="Qualification">
            <Input {...register("qualification")} />
          </Field>
        </div>
        <Field label="Occupation">
          <Input {...register("occupation")} />
        </Field>
      </StepShell>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-brand-burgundy">{label}</Label>
      {children}
      {error ? <p className="text-xs text-brand-terracotta">{error}</p> : null}
    </div>
  );
}
