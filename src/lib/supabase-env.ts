/**
 * Single source of truth for the frontend database connection tokens.
 *
 * ONLY `import.meta.env.VITE_*` is read here — never `process.env`, which does
 * not exist in a static Vite/Capacitor bundle and would leak server-side
 * config into the client if it did.
 *
 * Canonical key names (set these in Vercel):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *
 * `VITE_SUPABASE_PUBLISHABLE_KEY` is accepted as a legacy fallback so existing
 * builds keep working during the rename.
 *
 * BUILD-SAFE DEFAULTS: the two constants below are the project's *public*
 * frontend tokens — the same values that ship in every browser bundle and that
 * Row Level Security, not secrecy, protects. They exist so a build pipeline
 * that does not supply the `VITE_*` env vars (e.g. one where `.env` is not
 * checked out) still produces a working bundle instead of pointing at the
 * `unconfigured.invalid` placeholder. Never put a service-role key here.
 */

const DEFAULT_SUPABASE_URL = "https://pfvsbsrlycnclpluiars.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_3jXu48rBi0zE84OzquTn0Q_XzCF2XNL";

export const SUPABASE_URL: string =
  (import.meta.env.VITE_SUPABASE_URL ?? "").trim() || DEFAULT_SUPABASE_URL;

export const SUPABASE_ANON_KEY: string =
  (
    import.meta.env.VITE_SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    ""
  ).trim() || DEFAULT_SUPABASE_ANON_KEY;

/** True only when both tokens were inlined into this build. */
export const isSupabaseConfigured: boolean =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

/** Names of the env vars that are missing from this build, for diagnostics. */
export function missingSupabaseEnvKeys(): string[] {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("VITE_SUPABASE_ANON_KEY");
  return missing;
}
