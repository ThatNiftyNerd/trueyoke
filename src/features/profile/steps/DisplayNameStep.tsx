import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepShell } from "./StepShell";
import { updateOwnProfile, type OnboardingProfile } from "../api";

interface Props {
  profile: OnboardingProfile;
  onSaved: (patch: Partial<OnboardingProfile>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

const MAX = 40;

/**
 * Standalone editor for the public/casual display name. Not part of the
 * onboarding wizard (it is captured at signup), but editable afterwards.
 */
export function DisplayNameStep({ profile, onSaved, onNext, onBack, canGoBack }: Props) {
  const [value, setValue] = useState(profile.display_name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setError("Enter a display name");
      return;
    }
    if (trimmed.length > MAX) {
      setError(`Keep it under ${MAX} characters`);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateOwnProfile({ display_name: trimmed });
      onSaved({ display_name: trimmed });
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your display name.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <StepShell
      submitType="button"
      onSubmitClick={handleSave}
      submitting={saving}
      onBack={onBack}
      canGoBack={canGoBack}
      error={error}
      submitLabel="Save"
    >
      <div className="space-y-2">
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          value={value}
          maxLength={MAX}
          onChange={(e) => setValue(e.target.value)}
          placeholder="How others see you"
        />
        <p className="text-xs text-app-ink/60">
          This is the casual name shown on your card. Your full name stays private.
        </p>
      </div>
    </StepShell>
  );
}
