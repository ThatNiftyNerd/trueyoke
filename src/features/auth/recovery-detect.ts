/**
 * Captures whether this page load is a password-recovery redirect, read
 * synchronously at module-evaluation time — before the Supabase client is
 * ever instantiated. supabase-js strips recovery tokens from the URL as
 * part of its own internal processing, so anything that re-reads
 * window.location later in the boot sequence can't see this reliably.
 */
const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
export const isRecoveryRedirect: boolean =
  hashParams.get("type") === "recovery" || window.location.search.includes("type=recovery");
