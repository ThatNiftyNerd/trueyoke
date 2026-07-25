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
  | "age"
  | "gender"
  | "location_label"
  | "blood_group"
  | "genotype"
  | "nationality"
  | "qualification"
  | "occupation"
  | "bio"
  | "marriage_intentions"
  | "church_affiliation"
  | "congregation"
  | "spirituality_markers"
  | "life_verse"
  | "voice_intro_url"
  | "profile_complete"
>;

const ONBOARDING_COLUMNS =
  "id, account_type, display_name, age, gender, location_label, blood_group, genotype, nationality, qualification, occupation, bio, marriage_intentions, church_affiliation, congregation, spirituality_markers, life_verse, voice_intro_url, profile_complete";

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

export type PhotoRow = Pick<Tables<"photos">, "id" | "storage_path" | "position">;

export async function listOwnPhotos(): Promise<PhotoRow[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("photos")
    .select("id, storage_path, position")
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
    .select("id, storage_path, position")
    .single();
  if (insErr) throw new Error(insErr.message);
  return data;
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
