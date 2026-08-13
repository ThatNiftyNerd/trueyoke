/**
 * Optional marketing opt-in. Always renders unchecked by default — never
 * pre-checked — and is independent of the mandatory privacy consent.
 */
import { Checkbox } from "@/components/ui/checkbox";

export interface MarketingConsentCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export function MarketingConsentCheckbox({
  checked,
  onCheckedChange,
  disabled,
  id = "marketing-consent",
}: MarketingConsentCheckboxProps) {
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
        Send me occasional TrueYoke updates by email (optional)
      </label>
    </div>
  );
}
