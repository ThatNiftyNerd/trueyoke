// Supabase Edge Function — self-service account deletion (NDPA right to erasure).
//
// Always acts on the *caller*: the user id comes from the verified JWT, never
// from the request body. DB foreign keys cascade from auth.users, so this
// function only additionally clears Storage, which cascade doesn't touch.
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

const BUCKETS = ["photos", "voice-intros", "id-verification", "church-verification"];

function makeJson(cors: Record<string, string>) {
  return (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  const json = makeJson(corsHeaders);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await anon.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) return json({ error: "Unauthorized" }, 401);

  const userId = String(claimsData.claims.sub);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 1. Storage: everything under `${userId}/` in each private bucket.
  for (const bucket of BUCKETS) {
    const { data: objects, error: listErr } = await admin.storage
      .from(bucket)
      .list(userId, { limit: 1000 });
    if (listErr) return json({ error: `Could not list ${bucket}: ${listErr.message}` }, 500);
    const paths = (objects ?? []).map((o) => `${userId}/${o.name}`);
    if (paths.length > 0) {
      const { error: rmErr } = await admin.storage.from(bucket).remove(paths);
      if (rmErr) return json({ error: `Could not delete from ${bucket}: ${rmErr.message}` }, 500);
    }
  }

  // 2. Auth user — cascades to every public table row via FK on auth.users.
  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) return json({ error: delErr.message }, 500);

  return json({ ok: true });
});
