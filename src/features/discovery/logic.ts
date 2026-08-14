import type { DeckFilters } from "./api";

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

/** Default (unfiltered) Discover filter state. */
export const EMPTY_FILTERS: DeckFilters = { location: "any" };

/** Number of filter facets currently narrowing the deck. */
export function activeFilterCount(f: DeckFilters): number {
  let n = 0;
  if (typeof f.ageMin === "number" || typeof f.ageMax === "number") n += 1;
  if (f.location && f.location !== "any") n += 1;
  if (f.churchAffiliation) n += 1;
  return n;
}
