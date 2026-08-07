/**
 * Notifications pane data access. Everything the pane shows is fetched on
 * open — there is no realtime subscription here by design.
 *
 * Reads reuse the existing feature APIs (`listOwnMatches`,
 * `getOwnMentorRequest`) rather than re-querying those tables, so RLS-scoped
 * behaviour stays in one place. Read markers live in their own `match_reads`
 * table: the client never writes to `matches`.
 */
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/features/auth/api";
import { getPhotoSignedUrl, listOwnPhotos } from "@/features/profile/api";
import { listOwnMatches } from "@/features/matches/api";
import { getOwnMentorRequest } from "@/features/vouchers/api";

export type ActivityItem =
  | {
      kind: "unread_messages";
      matchId: string;
      otherName: string;
      otherPhotoUrl: string | null;
      count: number;
    }
  | { kind: "pending_mentor_request"; mentorName: string; status: string }
  | { kind: "photo_update_needed" }
  | {
      kind: "voucher_request";
      voucherId: string;
      matchName: string;
      matchPhotoUrl: string | null;
      requestNote: string | null;
    }

  | { kind: "announcement"; id: string; title: string; body: string; createdAt: string };

/** Used when a match has no `match_reads` row yet — everything is unread. */
const EPOCH = "1970-01-01T00:00:00.000Z";

async function listAnnouncements(): Promise<ActivityItem[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((a) => ({
    kind: "announcement" as const,
    id: a.id,
    title: a.title,
    body: a.body,
    createdAt: a.created_at,
  }));
}

/** Activity feed for a "match" account. */
export async function getMatchActivity(): Promise<ActivityItem[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const items: ActivityItem[] = [];

  const matches = (await listOwnMatches()).filter((m) => m.match.status === "active");

  if (matches.length > 0) {
    const { data: reads, error: readsError } = await supabase
      .from("match_reads")
      .select("match_id, last_read_at")
      .eq("user_id", userId)
      .in(
        "match_id",
        matches.map((m) => m.match.id),
      );
    if (readsError) throw new Error(readsError.message);
    const lastReadByMatch = new Map<string, string>();
    for (const r of reads ?? []) lastReadByMatch.set(r.match_id, r.last_read_at);

    const counts = await Promise.all(
      matches.map(async (m) => {
        const since = lastReadByMatch.get(m.match.id) ?? EPOCH;
        const { count, error } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("match_id", m.match.id)
          .neq("sender_id", userId)
          .gt("created_at", since);
        if (error) throw new Error(error.message);
        return count ?? 0;
      }),
    );

    matches.forEach((m, i) => {
      if (counts[i] > 0) {
        items.push({
          kind: "unread_messages",
          matchId: m.match.id,
          otherName: m.other.display_name?.trim() || "Member",
          otherPhotoUrl: m.other.photoSignedUrl,
          count: counts[i],
        });
      }
    });
  }

  // Match accounts carry a single live selfie; nudge them when it predates
  // their newest active match (or when they have no photo at all).
  if (matches.length > 0) {
    const ownPhotos = await listOwnPhotos();
    const primary = ownPhotos.find((p) => p.position === 0);
    const newestMatchAt = matches.reduce<string>(
      (acc, m) => (m.match.created_at > acc ? m.match.created_at : acc),
      EPOCH,
    );
    if (!primary || primary.created_at < newestMatchAt) {
      items.push({ kind: "photo_update_needed" });
    }
  }

  const request = await getOwnMentorRequest();
  if (request && request.status === "pending" && request.mentor_id) {
    const { data: mentor } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", request.mentor_id)
      .maybeSingle();
    items.push({
      kind: "pending_mentor_request",
      mentorName: mentor?.display_name?.trim() || "your mentor",
      status: request.status,
    });
  }

  items.push(...(await listAnnouncements()));
  return items;
}

/** Activity feed for a "mentor" account. */
export async function getMentorActivity(): Promise<ActivityItem[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("vouchers")
    .select("id, match_user_id, created_at")
    .eq("mentor_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = data ?? [];

  const items: ActivityItem[] = [];
  if (rows.length > 0) {
    const ids = Array.from(new Set(rows.map((r) => r.match_user_id)));

    // Minimal projection: only name is ever rendered for the requester.
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", ids);
    const nameById = new Map<string, string | null>();
    for (const p of profiles ?? []) nameById.set(p.id, p.display_name);

    const { data: photos } = await supabase
      .from("photos")
      .select("profile_id, storage_path, position")
      .in("profile_id", ids)
      .eq("position", 0);
    const pathById = new Map<string, string>();
    for (const p of photos ?? []) pathById.set(p.profile_id, p.storage_path);

    for (const row of rows) {
      const path = pathById.get(row.match_user_id);
      const url = path ? await getPhotoSignedUrl(path, 3600) : null;
      items.push({
        kind: "voucher_request",
        voucherId: row.id,
        matchName: nameById.get(row.match_user_id)?.trim() || "Member",
        matchPhotoUrl: url,
      });
    }
  }

  items.push(...(await listAnnouncements()));
  return items;
}

/** Marks a conversation as read up to now for the caller. */
export async function markMatchRead(matchId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const { error } = await supabase
    .from("match_reads")
    .upsert(
      { match_id: matchId, user_id: userId, last_read_at: new Date().toISOString() },
      { onConflict: "match_id,user_id" },
    );
  if (error) throw new Error(error.message);
}

/** Mentor decision on an endorsement request (vouchers_mentor_update policy). */
export async function respondToVoucher(
  voucherId: string,
  decision: "approved" | "declined",
  endorsement?: string,
): Promise<void> {
  const patch: { status: string; endorsement?: string } = { status: decision };
  if (endorsement !== undefined) patch.endorsement = endorsement;
  const { error } = await supabase.from("vouchers").update(patch).eq("id", voucherId);
  if (error) throw new Error(error.message);
}
