/**
 * Explicit NDPA consent control. Used by both the email sign-up form and the
 * one-time Google interstitial so the wording and the recorded version stay
 * identical across both paths.
 */
import { Link } from "@tanstack/react-router";
import { Checkbox } from "@/components/ui/checkbox";

export interface PrivacyConsentCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export function PrivacyConsentCheckbox({
  checked,
  onCheckedChange,
  disabled,
  id = "privacy-consent",
}: PrivacyConsentCheckboxProps) {
  return (
    <div className="flex items-start gap-2">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <label htmlFor={id} className="text-sm leading-snug text-app-ink">
        I have read and agree to the{" "}
        <Link to="/privacy" className="underline">
          Privacy Policy
        </Link>
      </label>
    </div>
  );
}
