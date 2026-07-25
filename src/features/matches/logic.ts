/** Matches presentational helpers. */
import type { MatchListItem } from "./api";

export function initialsOf(name: string | null | undefined): string {
  if (!name) return "·";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "·";
}

export function displayNameOf(item: { display_name: string | null }): string {
  return item.display_name?.trim() || "Member";
}

/**
 * "Active" = status === 'active'. Everything else (expired, closed, future
 * statuses) is grouped under "Expired" so nothing silently disappears.
 */
export function partitionByStatus(items: MatchListItem[]): {
  active: MatchListItem[];
  expired: MatchListItem[];
} {
  const active: MatchListItem[] = [];
  const expired: MatchListItem[] = [];
  for (const it of items) {
    (it.match.status === "active" ? active : expired).push(it);
  }
  return { active, expired };
}
