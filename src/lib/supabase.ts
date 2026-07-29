/**
 * The ONLY sanctioned import site for the Supabase client in app code.
 *
 * Components MUST NOT call `supabase.from(...)` directly. Route all data
 * access through the typed functions in each feature's `api.ts`, which import
 * from this file.
 *
 * The client is created lazily and exactly once. It reads its configuration
 * from `supabase-env.ts` (`import.meta.env.VITE_*` only) and NEVER throws at
 * module-evaluation time: if the tokens are missing or still loading, an inert
 * client is returned so the app shell renders instead of white-screening, and
 * network calls fail as ordinary rejected promises that feature code handles.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./supabase-env";

export type { Database } from "@/integrations/supabase/types";

type Client = SupabaseClient<Database>;

/**
 * New-style Supabase API keys (`sb_publishable_…`) are opaque strings, not
 * bearer JWTs, so the default `Authorization: Bearer <key>` header must be
 * stripped when no user session is attached.
 */
function isOpaqueApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createFetch(apiKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isOpaqueApiKey(apiKey) && headers.get("Authorization") === `Bearer ${apiKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", apiKey);
    return fetch(input, { ...init, headers });
  };
}

function buildClient(): Client {
  if (!isSupabaseConfigured) {
    // Non-fatal: log once, then hand back a client pointed at a placeholder
    // origin. Rendering keeps working; only network calls fail.
    console.error(
      "[supabase] Missing VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY in this build. " +
        "Set them in your host's environment variables and redeploy.",
    );
  }

  const url = SUPABASE_URL || "https://unconfigured.invalid";
  const key = SUPABASE_ANON_KEY || "unconfigured";

  return createClient<Database>(url, key, {
    global: { fetch: createFetch(key) },
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let instance: Client | undefined;

export const supabase: Client = new Proxy({} as Client, {
  get(_target, prop, receiver) {
    if (!instance) instance = buildClient();
    return Reflect.get(instance, prop, receiver);
  },
});
