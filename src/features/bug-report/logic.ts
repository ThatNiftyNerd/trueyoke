/**
 * Pure validation for the in-app bug report form. Kept out of the component so
 * the drawer never does inline validation of its own.
 */
export const SEVERITIES = ["low", "medium", "critical"] as const;

export type Severity = (typeof SEVERITIES)[number];

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  critical: "Critical",
};

export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 2000;

export type ReportDraft = {
  title: string;
  description: string;
  severity: string;
};

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateReport({ title, description, severity }: ReportDraft): ValidationResult {
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();

  if (trimmedTitle.length === 0) return { ok: false, error: "Add a short title." };
  if (trimmedTitle.length > TITLE_MAX) {
    return { ok: false, error: `Title must be ${TITLE_MAX} characters or fewer.` };
  }
  if (trimmedDescription.length === 0) {
    return { ok: false, error: "Describe what happened so we can reproduce it." };
  }
  if (trimmedDescription.length > DESCRIPTION_MAX) {
    return { ok: false, error: `Description must be ${DESCRIPTION_MAX} characters or fewer.` };
  }
  if (!(SEVERITIES as readonly string[]).includes(severity)) {
    return { ok: false, error: "Choose a severity." };
  }
  return { ok: true };
}
