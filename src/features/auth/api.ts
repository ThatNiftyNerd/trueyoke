/**
 * Auth data access. All Supabase auth calls for the app funnel through here.
 * No component may call `supabase.auth.*` directly.
 */
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import type { AccountType } from "@/lib/constants";
import { peekSession, restoreSession, setCachedSession } from "./session";

export interface SignUpInput {
  email: string;
  password: string;
  accountType: AccountType;
  displayName: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface EnsureProfileInput {
  accountType: AccountType;
  displayName: string;
}

export async function getCurrentUserId(): Promise<string | null> {
  // Wait for the persisted session to be rehydrated before hitting the auth
  // server, otherwise a cold start sends an unauthenticated request.
  await restoreSession();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getCurrentSession(): Promise<Session | null> {
  await restoreSession();
  // After the initial restore the cache is kept current by onAuthStateChange.
  return peekSession();
}

export async function signUpWithEmail(input: SignUpInput): Promise<void> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { emailRedirectTo: `${window.location.origin}/onboarding` },
  });
  if (error) throw error;

  // Only when a session came back immediately (email confirmation is off) do
  // we have an authenticated auth.uid() to satisfy the RLS insert policy.
  if (data.session && data.user) {
    const { error: upsertErr } = await supabase.from("profiles").upsert({
      id: data.user.id,
      account_type: input.accountType,
      display_name: input.displayName,
    });
    if (upsertErr) throw new Error(upsertErr.message);
  }
}

export async function signInWithEmail(input: SignInInput): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) throw error;
}

/**
 * Idempotent: inserts a profiles row only if one doesn't already exist for
 * the current user. Used after sign-in to cover the email-confirmation flow
 * where signUp couldn't create the row (no session at that point).
 */
export async function ensureProfileExists(input: EnsureProfileInput): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { data: existing, error: selErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);
  if (existing) return;

  const { error: insErr } = await supabase.from("profiles").insert({
    id: userId,
    account_type: input.accountType,
    display_name: input.displayName,
  });
  if (insErr) throw new Error(insErr.message);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Subscribe to auth state changes. Returns an unsubscribe function.
 * Used exactly once at the router layer to invalidate route guards.
 */
export function onAuthChange(cb: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    setCachedSession(session);
    cb(session);
  });
  return () => data.subscription.unsubscribe();
}
