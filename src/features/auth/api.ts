/**
 * Auth data access. All Supabase auth calls for the app funnel through here.
 * No component may call `supabase.auth.*` directly.
 *
 * TODO: Implement in a follow-up prompt.
 *   - signUpWithEmail({ email, password, accountType })
 *   - signInWithEmail({ email, password })
 *   - signInWithGoogle() via `lovable.auth.signInWithOAuth("google", ...)`
 *   - signOut()
 *   - getCurrentSession()
 */
import { supabase } from "@/lib/supabase";

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
