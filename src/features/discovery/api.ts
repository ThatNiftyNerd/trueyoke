/**
 * Discovery data access — swipe deck fetch, swipe writes, and mutual-match
 * lookup. Match creation itself is handled by the `handle_mutual_like` DB
 * trigger; the client never inserts into `matches` directly.
 */
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/features/auth/api";
import { getPhotoSignedUrl } from "@/features/profile/api";
import type { Tables } from "@/integrations/supabase/types";

export type Candidate = Pick<
  Tables<"profiles">,
  "id" | "display_name" | "age" | "location_label" | "bio"
> & {
  photoSignedUrl: string | null;
};

const DECK_BATCH_SIZE = 20;

export async function fetchDeck(): Promise<Candidate[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  // Own prior swipes — exclude any candidate already acted on.
  const { data: prior, error: priorErr } = await supabase
    .from("swipes")
    .select("swipee_id")
    .eq("swiper_id", userId);
  if (priorErr) throw new Error(priorErr.message);
  const excluded = new Set<string>([userId, ...(prior ?? []).map((r) => r.swipee_id)]);

  let query = supabase
    .from("profiles")
    .select("id, display_name, age, location_label, bio")
    .eq("account_type", "match")
    .eq("profile_complete", true)
    .neq("id", userId)
    .limit(DECK_BATCH_SIZE);

  if (excluded.size > 0) {
    const list = Array.from(excluded)
      .map((id) => `"${id}"`)
      .join(",");
    query = query.not("id", "in", `(${list})`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = data ?? [];

  // Primary photo (position 0) per candidate — one signed URL each, at render
  // batch time. Not persisted.
  const ids = rows.map((r) => r.id);
  const photoByProfile = new Map<string, string>();
  if (ids.length > 0) {
    const { data: photos } = await supabase
      .from("photos")
      .select("profile_id, storage_path, position")
      .in("profile_id", ids)
      .eq("position", 0);
    for (const p of photos ?? []) {
      photoByProfile.set(p.profile_id, p.storage_path);
    }
  }

  const candidates = await Promise.all(
    rows.map(async (r) => {
      const path = photoByProfile.get(r.id);
      const url = path ? await getPhotoSignedUrl(path, 3600) : null;
      return { ...r, photoSignedUrl: url } satisfies Candidate;
    }),
  );
  return candidates;
}

export type SwipeDirection = "like" | "pass";

export type SwipeResult =
  | { kind: "recorded" }
  | { kind: "duplicate" }
  | { kind: "cap_reached" };

/**
 * Inserts one swipe row. The `handle_mutual_like` + `enforce_active_chat_cap`
 * triggers run inside the same transaction, so a cap violation aborts the
 * swipe insert itself.
 */
export async function recordSwipe(
  swipeeId: string,
  direction: SwipeDirection,
): Promise<SwipeResult> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("swipes")
    .insert({ swiper_id: userId, swipee_id: swipeeId, direction });

  if (!error) return { kind: "recorded" };

  const msg = `${error.message} ${error.hint ?? ""} ${error.details ?? ""}`;
  if (error.code === "23505" || /duplicate key/i.test(msg)) {
    return { kind: "duplicate" };
  }
  if (/ACTIVE_CHAT_CAP_REACHED/i.test(msg)) {
    return { kind: "cap_reached" };
  }
  throw new Error(error.message);
}

/**
 * After a successful 'like', check whether a mutual match now exists with
 * the swiped profile. RLS on `matches` already scopes reads to rows the
 * caller participates in.
 */
export async function findMatchWith(otherId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;
  const [a, b] = userId < otherId ? [userId, otherId] : [otherId, userId];
  const { data, error } = await supabase
    .from("matches")
    .select("id")
    .eq("user_a_id", a)
    .eq("user_b_id", b)
    .maybeSingle();
  if (error) return false;
  return !!data;
}
