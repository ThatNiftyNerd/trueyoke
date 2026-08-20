/**
 * Explicit, separate consent for the special-category data TrueYoke collects
 * during onboarding (GDPR Art. 9 / LGPD "dados sensíveis" / POPIA "special
 * personal information"): genotype and blood group (health-adjacent), and
 * church affiliation, congregation, spirituality markers, and life verse
 * (religious belief). This is deliberately its own step — separate from the
 * general Privacy Policy acceptance captured at sign-up — and always runs
 * first, before any of those fields are collected.
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Checkbox } from "@/components/ui/checkbox";
import { StepShell } from "./StepShell";
import { updateOwnProfile, type OnboardingProfile } from "../api";
import { SPECIAL_CATEGORY_CONSENT_VERSION } from "../logic";

interface Props {
  profile: OnboardingProfile;
  onSaved: (patch: Partial<OnboardingProfile>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function SpecialCategoryConsentStep({ profile, onSaved, onNext, onBack, canGoBack }: Props) {
  const [checked, setChecked] = useState(!!profile.special_category_consented_at);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onContinue = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const patch = {
        special_category_consented_at: new Date().toISOString(),
        special_category_consent_version: SPECIAL_CATEGORY_CONSENT_VERSION,
      };
      await updateOwnProfile(patch);
      onSaved(patch);
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your consent.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepShell
      submitLabel="Continue"
      submitType="button"
      submitting={submitting}
      disableSubmit={!checked}
      onSubmitClick={onContinue}
      onBack={onBack}
      canGoBack={canGoBack}
      error={error}
    >
      <p className="text-sm leading-snug text-app-ink/80">
        Before we ask for anything else, we need your explicit consent to collect a few categories
        of sensitive personal data central to how TrueYoke works:
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm leading-snug text-app-ink/80">
        <li>Genotype and blood group — health-adjacent data used for compatibility.</li>
        <li>
          Church affiliation, congregation, spirituality markers, and life verse — religious belief
          data used for matching within your faith community and for mentor endorsement.
        </li>
      </ul>
      <p className="text-sm leading-snug text-app-ink/80">
        This is separate from the general Privacy Policy you already agreed to. See the{" "}
        <Link to="/privacy" className="underline">
          Privacy Policy
        </Link>{" "}
        for how this data is used, retained, and can be deleted.
      </p>
      <div className="flex items-start gap-2 pt-1">
        <Checkbox
          id="special-category-consent"
          checked={checked}
          onCheckedChange={(value) => setChecked(value === true)}
          className="mt-0.5"
        />
        <label htmlFor="special-category-consent" className="text-sm leading-snug text-app-ink">
          I consent to TrueYoke collecting and processing this sensitive personal data for the
          purposes described above.
        </label>
      </div>
    </StepShell>
  );
}
