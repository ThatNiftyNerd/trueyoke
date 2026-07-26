/**
 * Safety data access — reports & blocks.
 *
 * RLS enforces that reporter_id / blocker_id must equal auth.uid(); we still
 * set them explicitly rather than relying on a default.
 */
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/features/auth/api";
import { getPhotoSignedUrl } from "@/features/profile/api";

export async function reportProfile(reportedId: string, reason: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("reports")
    .insert({ reporter_id: userId, reported_id: reportedId, reason });
  if (error) throw new Error(error.message);
}

export async function blockProfile(blockedId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: userId, blocked_id: blockedId });
  if (error) throw new Error(error.message);
}

/**
 * Not wired to any screen in this pass — kept to complete the stubbed API
 * surface for a future "manage blocked users" screen.
 */
export async function unblockProfile(blockedId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", userId)
    .eq("blocked_id", blockedId);
  if (error) throw new Error(error.message);
}

export async function isBlockedWith(otherId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_blocked", { other_id: otherId });
  if (error) return false;
  return !!data;
}

// -------- Blocked users list ---------------------------------------------

export interface BlockedProfile {
  blockedId: string;
  displayName: string;
  createdAt: string;
  photoSignedUrl: string | null;
}

/**
 * The caller's own blocks (blocks_owner RLS scopes this), joined to the blocked
 * profile for display. Signed photo URLs are generated per render and never
 * persisted.
 */
export async function listBlockedProfiles(): Promise<BlockedProfile[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("blocks")
    .select("blocked_id, created_at, profiles!blocks_blocked_id_fkey(display_name)")
    .eq("blocker_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Array<{
    blocked_id: string;
    created_at: string;
    profiles: { display_name: string | null } | null;
  }>;

  return Promise.all(
    rows.map(async (r) => {
      const { data: photo } = await supabase
        .from("photos")
        .select("storage_path")
        .eq("profile_id", r.blocked_id)
        .eq("position", 0)
        .maybeSingle();
      const signed = photo ? await getPhotoSignedUrl(photo.storage_path) : null;
      return {
        blockedId: r.blocked_id,
        displayName: r.profiles?.display_name ?? "Member",
        createdAt: r.created_at,
        photoSignedUrl: signed,
      };
    }),
  );
}
