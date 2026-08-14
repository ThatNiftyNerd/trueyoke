import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepShell } from "./StepShell";
import { updateOwnProfile, type OnboardingProfile } from "../api";
import { getCurrentSession } from "@/features/auth/api";
import { mentorDetailsSchema, type MentorDetailsValues } from "../schemas";

interface Props {
  profile: OnboardingProfile;
  onSaved: (patch: Partial<OnboardingProfile>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

/**
 * Mentor-only step: the five details a match sees when requesting an
 * endorsement. All free-text — no dropdowns.
 */
export function MentorDetailsStep({ profile, onSaved, onNext, onBack, canGoBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MentorDetailsValues>({
    resolver: zodResolver(mentorDetailsSchema),
    defaultValues: {
      full_name: profile.full_name ?? "",
      nationality: profile.nationality ?? "",
      church_affiliation: profile.church_affiliation ?? "",
      mentor_role: profile.mentor_role ?? "",
      email: profile.email ?? "",
    },
  });

  // Prefill email from the authenticated session when the profile has none yet.
  useEffect(() => {
    if (profile.email) return;
    let cancelled = false;
    (async () => {
      const session = await getCurrentSession();
      const email = session?.user?.email;
      if (!cancelled && email) setValue("email", email, { shouldValidate: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [profile.email, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const patch = {
        full_name: values.full_name.trim(),
        nationality: values.nationality.trim(),
        church_affiliation: values.church_affiliation.trim(),
        mentor_role: values.mentor_role.trim(),
        email: values.email.trim(),
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
          <Label className="text-app-ink">Full name</Label>
          <Input placeholder="Your full name" maxLength={100} {...register("full_name")} />
          {errors.full_name ? (
            <p className="text-xs text-app-warn">{errors.full_name.message}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <Label className="text-app-ink">Nationality</Label>
          <Input placeholder="e.g. Nigerian" maxLength={120} {...register("nationality")} />
          {errors.nationality ? (
            <p className="text-xs text-app-warn">{errors.nationality.message}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <Label className="text-app-ink">Church affiliation</Label>
          <Input
            placeholder="e.g. Church of Christ"
            maxLength={120}
            {...register("church_affiliation")}
          />
          {errors.church_affiliation ? (
            <p className="text-xs text-app-warn">{errors.church_affiliation.message}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <Label className="text-app-ink">Title</Label>
          <Input
            placeholder="e.g. Elder, Preacher, Deacon, Bishop"
            maxLength={120}
            {...register("mentor_role")}
          />
          {errors.mentor_role ? (
            <p className="text-xs text-app-warn">{errors.mentor_role.message}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <Label className="text-app-ink">Email</Label>
          <Input type="email" placeholder="you@example.com" {...register("email")} />
          {errors.email ? <p className="text-xs text-app-warn">{errors.email.message}</p> : null}
        </div>
      </StepShell>
    </form>
  );
}
