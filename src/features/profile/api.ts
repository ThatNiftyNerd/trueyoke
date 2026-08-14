/**
 * Profile data access. All reads/writes to `profiles`, `photos`, and the
 * `photos` / `voice-intros` storage buckets live here — never in components.
 */
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/features/auth/api";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

/** Every onboarding-relevant column on `profiles`, plus `profile_complete`. */
export type OnboardingProfile = Pick<
  Tables<"profiles">,
  | "id"
  | "account_type"
  | "display_name"
  | "full_name"
  | "age"
  | "gender"
  | "location_label"
  | "country"
  | "city"
  | "blood_group"
  | "genotype"
  | "nationality"
  | "qualification"
  | "occupation"
  | "bio"
  | "marriage_intentions"
  | "church_affiliation"
  | "church_designation"
  | "congregation"
  | "spirituality_markers"
  | "life_verse"
  | "voice_intro_url"
  | "mentor_role"
  | "email"
  | "profile_complete"
>;

const ONBOARDING_COLUMNS =
  "id, account_type, display_name, full_name, age, gender, location_label, country, city, blood_group, genotype, nationality, qualification, occupation, bio, marriage_intentions, church_affiliation, church_designation, congregation, spirituality_markers, life_verse, voice_intro_url, mentor_role, email, profile_complete";

/**
 * Legacy narrow shape kept for route guards elsewhere in the app that only
 * need to know whether the profile is complete.
 */
export type OwnProfile = Pick<
  Tables<"profiles">,
  "id" | "account_type" | "display_name" | "profile_complete"
>;

export async function getOwnProfile(): Promise<OwnProfile | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, account_type, display_name, profile_complete")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getOnboardingProfile(): Promise<OnboardingProfile | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select(ONBOARDING_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as OnboardingProfile | null;
}

/**
 * Apply a partial patch to the caller's own profiles row. RLS
 * (`profiles_update`) already restricts this to `auth.uid() = id`; we still
 * scope by userId here so a mistake surfaces as an empty update rather than
 * a policy error.
 */
export async function updateOwnProfile(patch: TablesUpdate<"profiles">): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw new Error(error.message);
}

// -------- Photos ----------------------------------------------------------

export type PhotoRow = Pick<Tables<"photos">, "id" | "storage_path" | "position" | "created_at">;

export async function listOwnPhotos(): Promise<PhotoRow[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("photos")
    .select("id, storage_path, position, created_at")
    .eq("profile_id", userId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Uploads a photo to the private `photos` bucket at
 * `${userId}/<random>.<ext>` and inserts a matching `photos` row. Returns
 * the storage path (which is what the DB stores).
 */
export async function uploadOwnPhoto(
  file: File,
  extension: string,
  position: number,
): Promise<PhotoRow> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error: upErr } = await supabase.storage
    .from("photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw new Error(upErr.message);

  const { data, error: insErr } = await supabase
    .from("photos")
    .insert({ profile_id: userId, storage_path: path, position })
    .select("id, storage_path, position, created_at")
    .single();
  if (insErr) throw new Error(insErr.message);
  return data;
}

/**
 * Removes a photo the caller owns: storage object first, then the row.
 * Owner-scoped defensively, same as `updateOwnProfile` (RLS also enforces it).
 */
export async function deleteOwnPhoto(photoId: string, storagePath: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");
  const { error: rmErr } = await supabase.storage.from("photos").remove([storagePath]);
  if (rmErr) throw new Error(rmErr.message);
  const { error } = await supabase
    .from("photos")
    .delete()
    .eq("id", photoId)
    .eq("profile_id", userId);
  if (error) throw new Error(error.message);
}

/**
 * Match accounts keep exactly one current photo: a live selfie. Clears every
 * existing photo, then uploads the new one at position 0. Callers gate who
 * may use this (match accounts only).
 */
export async function replaceOwnSelfie(file: File, extension: string): Promise<PhotoRow> {
  const existing = await listOwnPhotos();
  for (const photo of existing) {
    await deleteOwnPhoto(photo.id, photo.storage_path);
  }
  return uploadOwnPhoto(file, extension, 0);
}

export async function getPhotoSignedUrl(
  path: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("photos")
    .createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data.signedUrl;
}

// -------- Voice intro -----------------------------------------------------

/**
 * Uploads the recorded voice intro to the private `voice-intros` bucket at
 * `${userId}/<random>.<ext>` and returns the storage path. The caller is
 * responsible for writing that path to `profiles.voice_intro_url` via
 * `updateOwnProfile` — matching the private-bucket + signed-URL rule.
 */
export async function uploadOwnVoiceIntro(blob: Blob, extension: string): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("voice-intros")
    .upload(path, blob, { contentType: blob.type || "audio/webm", upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export async function getVoiceIntroSignedUrl(
  path: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("voice-intros")
    .createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data.signedUrl;
}

// -------- ID verification -------------------------------------------------

/**
 * Latest submission for the caller. `id_document_path` / `id_verification_status`
 * no longer live on `profiles` — they moved to the `id_verifications` table so a
 * row-level policy can keep document paths private.
 */
export type IdVerificationInfo = Pick<
  Tables<"id_verifications">,
  "status" | "rejection_reason" | "created_at"
>;

const ID_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ID_MAX_BYTES = 8 * 1024 * 1024;

/** Most recent id_verifications row for the caller, or null if never submitted. */
export async function getIdVerification(): Promise<IdVerificationInfo | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("id_verifications")
    .select("status, rejection_reason, created_at")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export type IdSubmitError = "invalid_type" | "too_large";

/**
 * Uploads a government ID image to the private `id-verification` bucket at
 * `${userId}/<random>.<ext>` and inserts a new pending `id_verifications` row.
 * Each submission is a new row so reviewers keep the full history.
 */
export async function submitIdVerification(file: File): Promise<void> {
  if (!ID_ALLOWED_TYPES.includes(file.type)) {
    const err = new Error("Please upload a JPG, PNG, or WebP image.") as Error & {
      code: IdSubmitError;
    };
    err.code = "invalid_type";
    throw err;
  }
  if (file.size > ID_MAX_BYTES) {
    const err = new Error("File must be under 8 MB.") as Error & { code: IdSubmitError };
    err.code = "too_large";
    throw err;
  }

  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("id-verification")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw new Error(upErr.message);

  const { error: insErr } = await supabase
    .from("id_verifications")
    .insert({ profile_id: userId, document_path: path, status: "pending" });
  if (insErr) throw new Error(insErr.message);
}

// -------- Admin ------------------------------------------------------------

/** True only when the caller's own profiles.is_admin is set (direct-SQL only). */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return false;
  return data.is_admin === true;
}

export interface PendingIdReview {
  id: string;
  profileId: string;
  displayName: string;
  createdAt: string;
  documentSignedUrl: string | null;
}

/** Oldest-first queue of pending submissions. Admin-only via RLS. */
export async function listPendingIdVerifications(): Promise<PendingIdReview[]> {
  const { data, error } = await supabase
    .from("id_verifications")
    .select(
      "id, profile_id, document_path, created_at, profiles!id_verifications_profile_id_fkey(display_name)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    profile_id: string;
    document_path: string;
    created_at: string;
    profiles: { display_name: string | null } | null;
  }>;

  return Promise.all(
    rows.map(async (r) => {
      const { data: signed } = await supabase.storage
        .from("id-verification")
        .createSignedUrl(r.document_path, 3600);
      return {
        id: r.id,
        profileId: r.profile_id,
        displayName: r.profiles?.display_name ?? "Member",
        createdAt: r.created_at,
        documentSignedUrl: signed?.signedUrl ?? null,
      };
    }),
  );
}

/**
 * Approve or reject a submission. `reviewed_by` is always the authenticated
 * admin's own id — never accepted from the caller.
 */
export async function reviewIdVerification(
  verificationId: string,
  decision: "verified" | "rejected",
  rejectionReason?: string,
): Promise<void> {
  const adminId = await getCurrentUserId();
  if (!adminId) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("id_verifications")
    .update({
      status: decision,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: decision === "rejected" ? rejectionReason?.trim() || null : null,
    })
    .eq("id", verificationId);
  if (error) throw new Error(error.message);
}

// -------- Data export (NDPA right of access) -------------------------------

/**
 * Gathers everything the caller's own account holds and serializes it as
 * pretty-printed JSON. Every read goes through the same RLS-scoped client the
 * app uses, so nothing outside the caller's own data can be returned; match
 * rows are trimmed to the caller's side only (no counterpart profile fields).
 */
export async function exportOwnData(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");

  const [profileRes, photosRes, idRes, matchesRes, blocksRes, reportsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("photos").select("*").eq("profile_id", userId).order("position"),
    supabase
      .from("id_verifications")
      .select("id, status, rejection_reason, created_at, reviewed_at")
      .eq("profile_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("matches")
      .select("id, user_a_id, user_b_id, status, last_activity_at, created_at")
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`),
    supabase.from("blocks").select("*").eq("blocker_id", userId),
    supabase.from("reports").select("*").eq("reporter_id", userId),
  ]);

  for (const res of [profileRes, photosRes, idRes, matchesRes, blocksRes, reportsRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  const profile = profileRes.data as Tables<"profiles"> | null;
  const photoRows = photosRes.data ?? [];
  const matchRows = matchesRes.data ?? [];

  const photos = await Promise.all(
    photoRows.map(async (p) => ({
      id: p.id,
      position: p.position,
      storage_path: p.storage_path,
      created_at: p.created_at,
      signed_url: await getPhotoSignedUrl(p.storage_path),
    })),
  );

  const voiceIntro = profile?.voice_intro_url
    ? {
        storage_path: profile.voice_intro_url,
        signed_url: await getVoiceIntroSignedUrl(profile.voice_intro_url),
      }
    : null;

  const matchIds = matchRows.map((m) => m.id);
  let messages: Array<{
    id: string;
    match_id: string;
    sender_id: string;
    body: string;
    created_at: string;
  }> = [];
  if (matchIds.length > 0) {
    const { data, error } = await supabase
      .from("messages")
      .select("id, match_id, sender_id, body, created_at")
      .in("match_id", matchIds)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    messages = data ?? [];
  }

  const payload = {
    exported_at: new Date().toISOString(),
    account_id: userId,
    profile,
    photos,
    voice_intro: voiceIntro,
    id_verifications: idRes.data ?? [],
    matches: matchRows.map((m) => ({
      id: m.id,
      counterpart_id: m.user_a_id === userId ? m.user_b_id : m.user_a_id,
      status: m.status,
      last_activity_at: m.last_activity_at,
      created_at: m.created_at,
    })),
    messages,
    blocks: blocksRes.data ?? [],
    reports_filed: reportsRes.data ?? [],
  };

  return JSON.stringify(payload, null, 2);
}
