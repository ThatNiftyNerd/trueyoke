/**
 * Pure helpers for the diagnostics screen. No I/O, no JSX.
 */

export type CheckStatus = "pass" | "fail" | "pending";

export interface DiagnosticCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

/**
 * Masks a secret-ish string so it can be shown on screen safely:
 * keeps a short prefix and suffix, hides the middle.
 */
export function maskValue(value: string): string {
  if (!value) return "(not set)";
  if (value.length <= 12) return `${value.slice(0, 2)}…${value.slice(-2)}`;
  return `${value.slice(0, 6)}…${value.slice(-4)} (${value.length} chars)`;
}

/**
 * Masks a project URL: shows the scheme + hostname suffix only, so the
 * screen confirms shape without printing the full project reference.
 */
export function maskUrl(rawUrl: string): string {
  if (!rawUrl) return "(not set)";
  try {
    const url = new URL(rawUrl);
    const [first, ...rest] = url.hostname.split(".");
    const head = first.slice(0, 3);
    return `${url.protocol}//${head}${"•".repeat(Math.max(first.length - 3, 0))}.${rest.join(".")}`;
  } catch {
    return "(malformed URL)";
  }
}

export function isValidProjectUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" && url.hostname.length > 0;
  } catch {
    return false;
  }
}

export function overallStatus(checks: readonly DiagnosticCheck[]): CheckStatus {
  if (checks.some((c) => c.status === "pending")) return "pending";
  return checks.every((c) => c.status === "pass") ? "pass" : "fail";
}

export function formatDuration(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;
}
