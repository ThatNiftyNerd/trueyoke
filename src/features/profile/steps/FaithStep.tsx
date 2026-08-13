import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepShell } from "./StepShell";
import { updateOwnProfile, type OnboardingProfile } from "../api";
import { faithSchema, emptyToNull, type FaithValues } from "../schemas";
import { SPIRITUALITY_MARKERS, CHURCH_DESIGNATIONS, CHURCH_DESIGNATION_OTHER } from "../logic";
import { CHURCH_AFFILIATIONS, CHURCH_AFFILIATION_DEFAULT } from "../constants";

/** Free-text escape hatch appended to the affiliation dropdown. */
const CHURCH_AFFILIATION_OTHER = "Other";

interface Props {
  profile: OnboardingProfile;
  onSaved: (patch: Partial<OnboardingProfile>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

/** Stored value -> (dropdown choice, free-text). Unknown values mean "Other". */
function splitDesignation(stored: string | null): { choice: string; other: string } {
  if (!stored) return { choice: "", other: "" };
  if (CHURCH_DESIGNATIONS.includes(stored)) return { choice: stored, other: "" };
  return { choice: CHURCH_DESIGNATION_OTHER, other: stored };
}

/**
 * Stored affiliation -> (dropdown choice, free-text). Empty means a new
 * profile, which defaults to CHURCH_AFFILIATION_DEFAULT; legacy free text
 * falls back to "Other" with the value prefilled.
 */
function splitAffiliation(stored: string | null): { choice: string; other: string } {
  if (!stored || !stored.trim()) return { choice: CHURCH_AFFILIATION_DEFAULT, other: "" };
  if ((CHURCH_AFFILIATIONS as readonly string[]).includes(stored)) {
    return { choice: stored, other: "" };
  }
  return { choice: CHURCH_AFFILIATION_OTHER, other: stored };
}

export function FaithStep({ profile, onSaved, onNext, onBack, canGoBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const initial = splitDesignation(profile.church_designation);
  const initialAffiliation = splitAffiliation(profile.church_affiliation);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FaithValues>({
    resolver: zodResolver(faithSchema),
    defaultValues: {
      congregation: profile.congregation ?? "",
      spirituality_markers: profile.spirituality_markers ?? [],
      church_designation_choice: initial.choice,
      church_designation_other: initial.other,
      church_affiliation_choice: initialAffiliation.choice,
      church_affiliation_other: initialAffiliation.other,
    },
  });
  const markers = watch("spirituality_markers") ?? [];
  const choice = watch("church_designation_choice");
  const isOther = choice === CHURCH_DESIGNATION_OTHER;
  const affiliationChoice = watch("church_affiliation_choice");
  const isAffiliationOther = affiliationChoice === CHURCH_AFFILIATION_OTHER;

  const toggle = (marker: string, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...markers, marker]))
      : markers.filter((m) => m !== marker);
    setValue("spirituality_markers", next, { shouldDirty: true });
  };

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const {
        church_designation_choice,
        church_designation_other,
        church_affiliation_choice,
        church_affiliation_other,
        ...rest
      } = values;
      const affiliation =
        church_affiliation_choice === CHURCH_AFFILIATION_OTHER
          ? church_affiliation_other.trim()
          : church_affiliation_choice.trim();
      const patch = {
        ...(emptyToNull(rest) as Partial<OnboardingProfile>),
        church_designation:
          church_designation_choice === CHURCH_DESIGNATION_OTHER
            ? church_designation_other.trim()
            : church_designation_choice,
        church_affiliation: affiliation || null,
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
          <Label className="text-app-ink">Official church designation</Label>
          <Select
            value={choice || undefined}
            onValueChange={(v) =>
              setValue("church_designation_choice", v, { shouldValidate: true, shouldDirty: true })
            }
          >
            <SelectTrigger aria-label="Official church designation">
              <SelectValue placeholder="Select a designation" />
            </SelectTrigger>
            <SelectContent>
              {[...CHURCH_DESIGNATIONS, CHURCH_DESIGNATION_OTHER].map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.church_designation_choice ? (
            <p className="text-xs text-app-warn">{errors.church_designation_choice.message}</p>
          ) : null}
        </div>
        {isOther ? (
          <div className="space-y-1">
            <Label className="text-app-ink">Please specify</Label>
            <Input
              placeholder="Your church designation"
              maxLength={120}
              {...register("church_designation_other")}
            />
            {errors.church_designation_other ? (
              <p className="text-xs text-app-warn">{errors.church_designation_other.message}</p>
            ) : null}
          </div>
        ) : null}
        <div className="space-y-1">
          <Label className="text-app-ink">Church affiliation</Label>
          <Select
            value={affiliationChoice || undefined}
            onValueChange={(v) =>
              setValue("church_affiliation_choice", v, { shouldValidate: true, shouldDirty: true })
            }
          >
            <SelectTrigger aria-label="Church affiliation">
              <SelectValue placeholder="Select an affiliation" />
            </SelectTrigger>
            <SelectContent>
              {[...CHURCH_AFFILIATIONS, CHURCH_AFFILIATION_OTHER].map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.church_affiliation_choice ? (
            <p className="text-xs text-app-warn">{errors.church_affiliation_choice.message}</p>
          ) : null}
        </div>
        {isAffiliationOther ? (
          <div className="space-y-1">
            <Label className="text-app-ink">Please specify</Label>
            <Input
              placeholder="Your church affiliation"
              maxLength={120}
              {...register("church_affiliation_other")}
            />
            {errors.church_affiliation_other ? (
              <p className="text-xs text-app-warn">{errors.church_affiliation_other.message}</p>
            ) : null}
          </div>
        ) : null}
        <div className="space-y-1">
          <Label className="text-app-ink">Congregation</Label>
          <Input placeholder="Congregation name" {...register("congregation")} />
        </div>
        <div className="space-y-2">
          <Label className="text-app-ink">Spirituality markers</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SPIRITUALITY_MARKERS.map((m) => {
              const checked = markers.includes(m);
              return (
                <label
                  key={m}
                  className="flex items-center gap-2 rounded-md border border-app-ink/10 bg-card/60 px-3 py-2 text-sm text-app-ink"
                >
                  <Checkbox checked={checked} onCheckedChange={(v) => toggle(m, v === true)} />
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
