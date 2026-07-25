/** Safety presentational logic — report reason presets & formatting. */

export const REPORT_REASONS = [
  "Inappropriate photos",
  "Harassment or abuse",
  "Fake profile",
  "Spam or scam",
  "Other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_DETAILS_MAX = 300;

/** Combine a category + optional short elaboration into a single stored string. */
export function formatReason(category: ReportReason, details: string): string {
  const trimmed = details.trim().slice(0, REPORT_DETAILS_MAX);
  return trimmed ? `${category} — ${trimmed}` : category;
}
