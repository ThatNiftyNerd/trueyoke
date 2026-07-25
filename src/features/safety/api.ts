/**
 * Safety data access — reports & blocks.
 *
 * RLS enforces that reporter_id / blocker_id must equal auth.uid(); we still
 * set them explicitly rather than relying on a default.
 */
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/features/auth/api";

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
