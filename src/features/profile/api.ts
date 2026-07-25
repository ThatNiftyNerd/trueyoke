/**
 * Profile data access.
 */
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/features/auth/api";

export interface OwnProfile {
  id: string;
  account_type: "match" | "mentor";
  display_name: string;
  profile_complete: boolean;
}

const db = supabase as unknown as {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => { maybeSingle: () => Promise<{ data: OwnProfile | null; error: { message: string } | null }> };
    };
  };
};

/**
 * Fetches the signed-in user's profile row (or null if none exists yet, e.g.
 * pre-onboarding). Returns null when not authenticated as well, so callers
 * can treat "no session" and "no profile row" symmetrically at guard sites.
 */
export async function getOwnProfile(): Promise<OwnProfile | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { data, error } = await db
    .from("profiles")
    .select("id, account_type, display_name, profile_complete")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
