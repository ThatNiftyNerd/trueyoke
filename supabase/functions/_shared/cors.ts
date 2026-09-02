// Shared CORS policy for TrueYoke Edge Functions.
//
// Standard "reflect-if-allowed" pattern: the incoming Origin is echoed back in
// `Access-Control-Allow-Origin` only when it is on the allow-list. Any other
// origin (or a missing Origin, i.e. a non-browser server-to-server call) gets
// no Allow-Origin header at all, so browsers block the response.
export const ALLOWED_ORIGINS = [
  "https://trueyoke.app",
  "https://superad.trueyoke.app",
] as const;

const BASE_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-lovable-signature, x-lovable-timestamp, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

export function isAllowedOrigin(origin: string | null): boolean {
  return !!origin && (ALLOWED_ORIGINS as readonly string[]).includes(origin);
}

/** CORS headers for a request; Allow-Origin present only for allow-listed origins. */
export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const headers = { ...BASE_HEADERS };
  if (isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin as string;
  }
  return headers;
}
