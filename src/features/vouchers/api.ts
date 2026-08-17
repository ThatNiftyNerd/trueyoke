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

/**
 * A match account may have this many concurrently active (pending or
 * approved) mentor requests. Mirrors the DB-side
 * `enforce_voucher_request_cap()` trigger, which is the real enforcement —
 * this constant only lets the UI head off the request before round-tripping
 * to the server. Declined requests never count toward the cap.
 */
export const MAX_ACTIVE_MENTOR_REQUESTS = 7;

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

export interface OwnMentorRequest {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorPhotoSignedUrl: string | null;
  mentorChurchAffiliation: string | null;
  status: string;
  requestNote: string | null;
  endorsement: string | null;
  createdAt: string;
  /** Set only for a not-yet-claimed email invite (mentor_id is still null). */
  invitedEmail: string | null;
}

/**
 * All of the caller's own mentor endorsement requests (any status), newest
 * first, joined to each mentor's minimal public profile. Powers the
 * match-side request ledger — mirrors `listOwnEndorsedVouchers()`'s join
 * pattern from the mentor side. A match may have up to
 * `MAX_ACTIVE_MENTOR_REQUESTS` pending/approved rows at once; declined rows
 * are included here too so the caller can see their full history, but don't
 * count against the cap.
 */
export async function listOwnMentorRequests(): Promise<OwnMentorRequest[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("vouchers")
    .select("id, mentor_id, invitee_email, status, request_note, endorsement, created_at")
    .eq("match_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const ids = Array.from(
    new Set(rows.map((r) => r.mentor_id).filter((id): id is string => id !== null)),
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, church_affiliation")
    .in("id", ids);
  const profileById = new Map<string, { displayName: string | null; church: string | null }>();
  for (const p of profiles ?? []) {
    profileById.set(p.id, { displayName: p.display_name, church: p.church_affiliation });
  }

  const { data: photos } = await supabase
    .from("photos")
    .select("profile_id, storage_path, position")
    .in("profile_id", ids)
    .eq("position", 0);
  const pathById = new Map<string, string>();
  for (const p of photos ?? []) pathById.set(p.profile_id, p.storage_path);

  return Promise.all(
    rows.map(async (r) => {
      const mentorId = r.mentor_id;
      const profile = mentorId ? profileById.get(mentorId) : undefined;
      const path = mentorId ? pathById.get(mentorId) : undefined;
      const url = path ? await getPhotoSignedUrl(path, 3600) : null;
      return {
        id: r.id,
        mentorId: mentorId ?? "",
        mentorName:
          profile?.displayName?.trim() ||
          (mentorId ? "Mentor" : r.invitee_email || "Invited mentor"),
        mentorPhotoSignedUrl: url,
        mentorChurchAffiliation: profile?.church ?? null,
        status: r.status,
        requestNote: r.request_note,
        endorsement: r.endorsement,
        createdAt: r.created_at,
        invitedEmail: mentorId ? null : r.invitee_email,
      } satisfies OwnMentorRequest;
    }),
  );
}

/**
 * Requests an endorsement from a mentor, with a short intro note. `status`
 * defaults to 'pending' in the database. Three DB-side rules are surfaced as
 * friendly messages rather than raw Postgres errors: the unique
 * (match_user_id, mentor_id) constraint (you may only ever request a given
 * mentor once — including after a decline), the 7-active-request cap
 * enforced by `enforce_voucher_request_cap()`, and the 250-char cap on
 * `request_note` (also enforced client-side before this is ever called).
 */
export async function requestMentorVoucher(mentorId: string, note: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("vouchers")
    .insert({ match_user_id: userId, mentor_id: mentorId, request_note: note });
  if (!error) return;

  const msg = `${error.message} ${error.hint ?? ""} ${error.details ?? ""}`;
  if (/maximum of 7 mentor requests/i.test(msg)) {
    throw new Error(
      "You've reached the maximum of 7 mentor requests. Wait for a decision on an existing request before adding more.",
    );
  }
  if (error.code === "23505" || /duplicate key/i.test(msg)) {
    throw new Error("You already have a request with this mentor.");
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

/**
 * WhatsApp invites need a Meta Business account, a dedicated business phone
 * number, and Meta's pre-approval of the outbound message template -- none
 * of which exist yet. The send path is built end-to-end (this client, the
 * invite-mentor Edge Function, the invite_channel/invitee_phone columns) but
 * stays off until that setup is complete; flip this once it is.
 */
export const WHATSAPP_INVITES_ENABLED = false;

/**
 * Invites someone not yet on TrueYoke to join as a Mentor and pick up this
 * request. Under the hood this is a `vouchers` row with mentor_id = NULL and
 * invitee_email set -- so it counts toward the same
 * `MAX_ACTIVE_MENTOR_REQUESTS` cap as a direct request via the same DB
 * trigger, with no separate accounting needed. Routed through the
 * `invite-mentor` Edge Function rather than a direct insert because sending
 * the notification email requires the service-role-only email queue.
 */
export async function inviteMentorByEmail(email: string, note: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("invite-mentor", {
    body: { email: email.trim(), note: note.trim(), channel: "email" },
  });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    let message: string | null = null;
    if (ctx) {
      try {
        const body = (await ctx.clone().json()) as { error?: string };
        message = body?.error ?? null;
      } catch {
        message = null;
      }
    }
    throw new Error(message ?? "Could not send the invite. Please try again.");
  }
  const payload = data as { error?: string } | null;
  if (payload?.error) throw new Error(payload.error);
}

/**
 * Called once a newly-signed-up Mentor holds a valid invite token (see
 * `src/routes/invite.mentor.tsx`). Attaches the invite's voucher row to the
 * caller's account via the `claim_mentor_invite` SECURITY DEFINER RPC --
 * this is the only path that can set `mentor_id` on an invite row, since an
 * unclaimed invite has no RLS-visible relationship to the invitee yet.
 */
export async function claimMentorInvite(inviteToken: string): Promise<void> {
  const { error } = await supabase.rpc("claim_mentor_invite", { p_token: inviteToken });
  if (!error) return;

  const msg = error.message;
  if (/invalid/i.test(msg)) throw new Error("This invite link is invalid.");
  if (/expired/i.test(msg)) throw new Error("This invite has expired.");
  if (/already been accepted|no longer valid/i.test(msg)) {
    throw new Error("This invite has already been used.");
  }
  if (/Only a Mentor account/i.test(msg)) {
    throw new Error("Sign in with a Mentor account to accept this invite.");
  }
  if (/already have a request/i.test(msg)) {
    throw new Error("You already have a request with this member.");
  }
  throw new Error(msg);
}

export interface EndorsedVoucher {
  id: string;
  matchUserId: string;
  displayName: string;
  photoSignedUrl: string | null;
  endorsement: string | null;
  createdAt: string;
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
    .select("id, match_user_id, endorsement, created_at")
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
        createdAt: r.created_at,
      } satisfies EndorsedVoucher;
    }),
  );
}
