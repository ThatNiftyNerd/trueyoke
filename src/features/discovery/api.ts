/**
 * Discovery data access — swipe deck fetch, swipe writes, and mutual-match
 * lookup. Match creation itself is handled by the `handle_mutual_like` DB
 * trigger; the client never inserts into `matches` directly.
 */
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/features/auth/api";
import { getVoiceIntroSignedUrls } from "@/features/profile/api";
import type { Tables } from "@/integrations/supabase/types";

export type Candidate = Pick<
  Tables<"profiles">,
  "id" | "display_name" | "age" | "gender" | "location_label" | "bio" | "life_verse"
> & {
  voiceIntroSignedUrl: string | null;
  /** Approved mentor endorsement text, if any. Mentor identity is never fetched. */
  endorsement: string | null;
};

const DECK_BATCH_SIZE = 20;

/** Location matching is country/city based — the app stores no coordinates. */
export type LocationScope = "any" | "country" | "city";

export interface DeckFilters {
  ageMin?: number;
  ageMax?: number;
  location?: LocationScope;
  churchAffiliation?: string;
}

export async function fetchDeck(filters: DeckFilters = {}): Promise<Candidate[]> {
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
    .select("id, display_name, age, gender, location_label, bio, life_verse, voice_intro_url")
    .eq("account_type", "match")
    .eq("profile_complete", true)
    .neq("id", userId)
    .limit(DECK_BATCH_SIZE);

  if (typeof filters.ageMin === "number") query = query.gte("age", filters.ageMin);
  if (typeof filters.ageMax === "number") query = query.lte("age", filters.ageMax);
  if (filters.churchAffiliation) {
    query = query.eq("church_affiliation", filters.churchAffiliation);
  }

  // "Same country" / "same country + city" relative to the caller's own row.
  if (filters.location === "country" || filters.location === "city") {
    const { data: own } = await supabase
      .from("profiles")
      .select("country, city")
      .eq("id", userId)
      .maybeSingle();
    if (own?.country) query = query.eq("country", own.country);
    if (filters.location === "city" && own?.city) query = query.eq("city", own.city);
  }

  if (excluded.size > 0) {
    const list = Array.from(excluded)
      .map((id) => `"${id}"`)
      .join(",");
    query = query.not("id", "in", `(${list})`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = data ?? [];

  // Voice intros — batch-signed per candidate; photos are intentionally not
  // fetched pre-match (revealed post-match via the matches feature).
  const ids = rows.map((r) => r.id);

  // Approved mentor endorsements — same in-memory join by id as photos above.
  // Mentor identity is deliberately not selected.
  const endorsementByProfile = new Map<string, string>();
  if (ids.length > 0) {
    const { data: vouchers } = await supabase
      .from("vouchers")
      .select("id, match_user_id, endorsement")
      .eq("status", "approved")
      .in("match_user_id", ids);
    for (const v of vouchers ?? []) {
      if (v.endorsement) endorsementByProfile.set(v.match_user_id, v.endorsement);
    }
  }

  // Voice intro paths — null is normal (voice intro isn't enforced by
  // profile_complete), only non-null paths are batch-signed.
  const voicePaths = [
    ...new Set(rows.map((r) => r.voice_intro_url).filter((p): p is string => !!p)),
  ];
  const voiceUrlByPath = await getVoiceIntroSignedUrls(voicePaths, 3600);

  const candidates = rows.map((r) => {
    const url = r.voice_intro_url ? (voiceUrlByPath.get(r.voice_intro_url) ?? null) : null;
    const { voice_intro_url: _voicePath, ...rest } = r;
    return {
      ...rest,
      voiceIntroSignedUrl: url,
      endorsement: endorsementByProfile.get(r.id) ?? null,
    } satisfies Candidate;
  });
  return candidates;
}

export type SwipeDirection = "like" | "pass";

export type SwipeResult = { kind: "recorded" } | { kind: "duplicate" } | { kind: "cap_reached" };

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
