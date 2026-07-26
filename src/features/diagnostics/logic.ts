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

/**
 * True when two URLs point at the same origin. Used to prove the URL the app
 * actually sends requests to is the one that was inlined at build time.
 */
export function isSameOrigin(a: string, b: string): boolean {
  try {
    return new URL(a).origin === new URL(b).origin;
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

const STATUS_LABEL: Record<CheckStatus, string> = {
  pass: "PASS",
  fail: "FAIL",
  pending: "PENDING",
};

export interface ReportContext {
  mode: string;
  dev: boolean;
  ranAt: string | null;
  userAgent: string;
}

/**
 * Builds the plain-text diagnostics report copied to the clipboard.
 * Values are already masked by the checks themselves — nothing secret is added.
 */
export function buildReport(
  checks: readonly DiagnosticCheck[],
  context: ReportContext,
): string {
  const lines: string[] = [
    "Yoked — connection diagnostics report",
    `Generated: ${new Date().toISOString()}`,
    `Last run: ${context.ranAt ?? "not run yet"}`,
    `Build mode: ${context.mode}${context.dev ? " (dev)" : ""}`,
    `User agent: ${context.userAgent}`,
    `Overall verdict: ${STATUS_LABEL[overallStatus(checks)]}`,
    "",
    "Checks:",
    ...checks.map((c) => `- [${STATUS_LABEL[c.status]}] ${c.label}: ${c.detail}`),
  ];
  return lines.join("\n");
}
