/**
 * Matches data access. RLS (matches_participant) already scopes SELECT to
 * rows where the caller is user_a_id or user_b_id, so we never filter on
 * ownership client-side beyond what's needed to pick the "other" participant.
 *
 * We never INSERT/UPDATE matches from the client — those flow from the
 * `handle_mutual_like` trigger and the 72h expiry sweep.
 */
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/features/auth/api";
import { getPhotoSignedUrl } from "@/features/profile/api";
import type { Tables } from "@/integrations/supabase/types";

export type MatchRow = Tables<"matches">;

export interface OtherParticipant {
  id: string;
  display_name: string | null;
  photoSignedUrl: string | null;
}

export interface MatchListItem {
  match: MatchRow;
  other: OtherParticipant;
}

function otherIdOf(match: MatchRow, userId: string): string {
  return match.user_a_id === userId ? match.user_b_id : match.user_a_id;
}

async function resolveOthers(otherIds: string[]): Promise<Map<string, OtherParticipant>> {
  const map = new Map<string, OtherParticipant>();
  if (otherIds.length === 0) return map;

  const uniq = Array.from(new Set(otherIds));

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", uniq);

  const { data: photos } = await supabase
    .from("photos")
    .select("profile_id, storage_path, position")
    .in("profile_id", uniq)
    .eq("position", 0);

  const photoByProfile = new Map<string, string>();
  for (const p of photos ?? []) photoByProfile.set(p.profile_id, p.storage_path);

  // profiles_read may return empty for a blocked-after-match edge case; fall
  // back to a "Member" placeholder for any missing id.
  const foundIds = new Set<string>();
  for (const row of profiles ?? []) {
    foundIds.add(row.id);
    const path = photoByProfile.get(row.id);
    const url = path ? await getPhotoSignedUrl(path, 3600) : null;
    map.set(row.id, { id: row.id, display_name: row.display_name, photoSignedUrl: url });
  }
  for (const id of uniq) {
    if (!foundIds.has(id)) {
      map.set(id, { id, display_name: null, photoSignedUrl: null });
    }
  }
  return map;
}

/** All matches the caller participates in, most recent activity first. */
export async function listOwnMatches(): Promise<MatchListItem[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("last_activity_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = data ?? [];

  const others = await resolveOthers(rows.map((m) => otherIdOf(m, userId)));
  return rows.map((match) => {
    const oid = otherIdOf(match, userId);
    const other = others.get(oid) ?? { id: oid, display_name: null, photoSignedUrl: null };
    return { match, other };
  });
}

/** Fetch a single match plus the other participant. Returns null on not-found / not-participant. */
export async function getMatchWithOther(matchId: string): Promise<MatchListItem | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();
  if (error || !data) return null;

  const oid = otherIdOf(data, userId);
  const others = await resolveOthers([oid]);
  const other = others.get(oid) ?? { id: oid, display_name: null, photoSignedUrl: null };
  return { match: data, other };
}

/**
 * Subscribe to UPDATE events on a specific match row. Used by the chat screen
 * to react live if status flips away from 'active' while the user is viewing.
 */
export function subscribeToMatchStatus(
  matchId: string,
  onUpdate: (row: MatchRow) => void,
): () => void {
  const channel = supabase
    .channel(`match:${matchId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
      (payload) => onUpdate(payload.new as MatchRow),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
