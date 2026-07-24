/**
 * The ONLY sanctioned import site for the Supabase client in app code.
 *
 * Components MUST NOT call `supabase.from(...)` directly. Route all data
 * access through the typed functions in each feature's `api.ts`, which import
 * from this file.
 *
 * The underlying client is instantiated exactly once inside the auto-generated
 * `src/integrations/supabase/client.ts` (do not edit that file). This module
 * simply re-exports it so the "single client instantiation" rule is preserved
 * across the codebase.
 */
export { supabase } from "@/integrations/supabase/client";
export type { Database } from "@/integrations/supabase/types";
