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
 * Requests an endorsement from a mentor, with a short intro note. `status`
 * defaults to 'pending' in the database; the unique (match_user_id, mentor_id)
 * constraint is surfaced as a friendly message rather than a raw Postgres
 * error. The 250-char cap on `request_note` is enforced by a DB CHECK.
 */
export async function requestMentorVoucher(mentorId: string, note: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("vouchers")
    .insert({ match_user_id: userId, mentor_id: mentorId, request_note: note });
  if (!error) return;

  const msg = `${error.message} ${error.hint ?? ""} ${error.details ?? ""}`;
  if (error.code === "23505" || /duplicate key/i.test(msg)) {
    throw new Error("You already have a pending request with this mentor.");
  }
  throw new Error(error.message);
}

/**
 * Mentor approval: records the mandatory confirmation and the endorsement text
 * together with the status change. The DB CHECK constraint
 * `vouchers_approved_requires_confirmation` rejects any approval missing
 * either one.
 */
export async function confirmAndEndorse(voucherId: string, endorsement: string): Promise<void> {
  const { error } = await supabase
    .from("vouchers")
    .update({ status: "approved", mentor_confirmed: true, endorsement })
    .eq("id", voucherId);
  if (error) throw new Error(error.message);
}

export interface EndorsedVoucher {
  id: string;
  matchUserId: string;
  displayName: string;
  photoSignedUrl: string | null;
  endorsement: string | null;
  updatedAt: string;
}

/**
 * Vouchers the caller (as mentor) has already approved, joined to each match's
 * display name + primary photo. Same minimal projection / signed-URL pattern
 * as `listOnboardedMentors()`. Reads rely on the existing
 * `vouchers_mentor_read` RLS policy.
 */
export async function listOwnEndorsedVouchers(): Promise<EndorsedVoucher[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("vouchers")
    .select("id, match_user_id, endorsement, updated_at, created_at")
    .eq("mentor_id", userId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const ids = Array.from(new Set(rows.map((r) => r.match_user_id)));

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

  return Promise.all(
    rows.map(async (r) => {
      const path = pathById.get(r.match_user_id);
      const url = path ? await getPhotoSignedUrl(path, 3600) : null;
      return {
        id: r.id,
        matchUserId: r.match_user_id,
        displayName: nameById.get(r.match_user_id)?.trim() || "Member",
        photoSignedUrl: url,
        endorsement: r.endorsement,
        updatedAt: r.updated_at ?? r.created_at,
      } satisfies EndorsedVoucher;
    }),
  );
}
