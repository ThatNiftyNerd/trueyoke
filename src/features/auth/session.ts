/**
 * Session auto-restore.
 *
 * On a cold start (hard refresh, or the Capacitor WebView being recreated),
 * supabase-js rehydrates the persisted session from storage asynchronously.
 * Anything that reads the session before that finishes — most importantly the
 * router's `beforeLoad` guards — would otherwise see `null` and bounce a
 * signed-in user to `/auth`.
 *
 * This module owns a single, memoised "restore" step that every session read
 * waits on, plus a stale-token refresh when the app returns to the foreground.
 */
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

/** Safety valve: never block the app shell forever on a wedged storage read. */
const RESTORE_TIMEOUT_MS = 5000;

let restorePromise: Promise<Session | null> | undefined;
let cachedSession: Session | null = null;
let restored = false;

/**
 * Resolves once the persisted session (if any) has been rehydrated.
 * Memoised: concurrent callers share one restore, later calls are a no-op.
 */
export function restoreSession(): Promise<Session | null> {
  if (!restorePromise) {
    restorePromise = runRestore();
  }
  return restorePromise;
}

async function runRestore(): Promise<Session | null> {
  try {
    const timeout = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), RESTORE_TIMEOUT_MS);
    });
    // `getSession()` internally awaits supabase-js's own initialisation, so it
    // is the rehydration point; it also refreshes an expired-but-refreshable
    // token before returning.
    const read = supabase.auth
      .getSession()
      .then(({ data }) => data.session ?? null)
      .catch(() => null);

    cachedSession = await Promise.race([read, timeout]);
  } catch {
    cachedSession = null;
  } finally {
    restored = true;
  }
  return cachedSession;
}

/** Keeps the cache in sync with live auth events (sign-in, sign-out, refresh). */
export function setCachedSession(session: Session | null): void {
  cachedSession = session;
  restored = true;
  if (!restorePromise) restorePromise = Promise.resolve(session);
}

/** Synchronous read of the last known session. Only valid after restore. */
export function peekSession(): Session | null {
  return cachedSession;
}

export function hasRestored(): boolean {
  return restored;
}

/**
 * Re-validates the session when the app comes back to the foreground. Long
 * backgrounding on Android suspends the auto-refresh timer, so the stored
 * access token can be expired by the time the user returns.
 */
export function startForegroundSessionRefresh(): () => void {
  if (typeof document === "undefined") return () => {};

  const onVisible = () => {
    if (document.visibilityState !== "visible") return;
    void supabase.auth.getSession().then(({ data }) => {
      cachedSession = data.session ?? null;
    });
  };

  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", onVisible);
  return () => {
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", onVisible);
  };
}
