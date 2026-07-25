/**
 * Profile data access.
 */
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/features/auth/api";
import type { Tables } from "@/integrations/supabase/types";

export type OwnProfile = Pick<
  Tables<"profiles">,
  "id" | "account_type" | "display_name" | "profile_complete"
>;

/**
 * Fetches the signed-in user's profile row (or null if none exists yet, e.g.
 * pre-onboarding). Returns null when not authenticated as well, so callers
 * can treat "no session" and "no profile row" symmetrically at guard sites.
 */
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
