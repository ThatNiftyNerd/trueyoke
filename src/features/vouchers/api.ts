/**
 * Voucher (mentor endorsement) data access. All reads/writes to `vouchers`
 * and the mentor picker's minimal `profiles` projection live here — never in
 * components. The mentor list deliberately selects only name + church
 * affiliation, mirroring the minimal-field pattern used by `fetchDeck()`.
 */
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/features/auth/api";
import { getPhotoSignedUrl } from "@/features/profile/api";
import type { Tables } from "@/integrations/supabase/types";

export type MentorOption = Pick<
  Tables<"profiles">,
  "id" | "display_name" | "church_affiliation"
> & {
  photoSignedUrl: string | null;
};

export type VoucherRow = Tables<"vouchers">;

/** Onboarded mentors the caller can request an endorsement from. */
export async function listOnboardedMentors(): Promise<MentorOption[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, church_affiliation")
    .eq("account_type", "mentor")
    .eq("profile_complete", true)
    .neq("id", userId);
  if (error) throw new Error(error.message);
  const rows = data ?? [];

  // Primary photo (position 0) per mentor — one signed URL each, at render
  // time. Not persisted.
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

  return Promise.all(
    rows.map(async (r) => {
      const path = photoByProfile.get(r.id);
      const url = path ? await getPhotoSignedUrl(path, 3600) : null;
      return { ...r, photoSignedUrl: url } satisfies MentorOption;
    }),
  );
}

/** The caller's own current voucher row, if they have already requested one. */
export async function getOwnMentorRequest(): Promise<VoucherRow | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .eq("match_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Requests an endorsement from a mentor. `status` defaults to 'pending' in
 * the database; the unique (match_user_id, mentor_id) constraint is surfaced
 * as a friendly message rather than a raw Postgres error.
 */
export async function requestMentorVoucher(mentorId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("vouchers")
    .insert({ match_user_id: userId, mentor_id: mentorId });
  if (!error) return;

  const msg = `${error.message} ${error.hint ?? ""} ${error.details ?? ""}`;
  if (error.code === "23505" || /duplicate key/i.test(msg)) {
    throw new Error("You already have a pending request with this mentor.");
  }
  throw new Error(error.message);
}
