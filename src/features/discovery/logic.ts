/** Discovery UI helpers (no data access here). */
import type { Candidate } from "./api";

export function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "?";
}

export function bioExcerpt(bio: string | null | undefined, max = 160): string {
  if (!bio) return "";
  const trimmed = bio.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

export function cardSubtitle(c: Candidate): string {
  const bits: string[] = [];
  if (typeof c.age === "number") bits.push(String(c.age));
  if (c.location_label) bits.push(c.location_label);
  return bits.join(" · ");
}
