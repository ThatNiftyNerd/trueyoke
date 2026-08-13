import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepShell } from "./StepShell";
import { updateOwnProfile, type OnboardingProfile } from "../api";
import { credentialsSchema, type CredentialsValues } from "../schemas";
import { MENTOR_ROLES } from "../logic";

interface Props {
  profile: OnboardingProfile;
  onSaved: (patch: Partial<OnboardingProfile>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

/**
 * Mentor-only step: official leadership role + verified congregation.
 * These two fields are the whole of a mentor's faith profile (PRD Rev 8 §3.2).
 */
export function CredentialsStep({ profile, onSaved, onNext, onBack, canGoBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CredentialsValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      mentor_role: profile.mentor_role ?? "",
      congregation: profile.congregation ?? "",
    },
  });
  const role = watch("mentor_role");

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const patch = {
        mentor_role: values.mentor_role,
        congregation: values.congregation.trim(),
      };
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
          <Label className="text-app-ink">Official role</Label>
          <Select
            value={role || undefined}
            onValueChange={(v) => setValue("mentor_role", v, { shouldValidate: true })}
          >
            <SelectTrigger aria-label="Official role">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {MENTOR_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.mentor_role ? (
            <p className="text-xs text-app-warn">{errors.mentor_role.message}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <Label className="text-app-ink">Congregation</Label>
          <Input
            placeholder="e.g. Ikeja Church of Christ"
            maxLength={120}
            {...register("congregation")}
          />
          <p className="text-xs text-app-ink/60">
            The congregation where you serve. Shown to members requesting your endorsement.
          </p>
          {errors.congregation ? (
            <p className="text-xs text-app-warn">{errors.congregation.message}</p>
          ) : null}
        </div>
      </StepShell>
    </form>
  );
}
