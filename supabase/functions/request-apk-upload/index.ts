// Supabase Edge Function — mint short-lived signed upload URLs for a release APK.
//
// Called by CI (GitHub Actions) AFTER a signed release build, authenticated
// with the same dedicated `RELEASE_PUBLISH_TOKEN` used by
// `publish-release-manifest`. It is never called from the app.
//
// This function NEVER receives, stores, or proxies the APK bytes. It only
// mints signed upload URLs scoped to two exact object paths inside the
// `public-releases` bucket, and the service-role key used to mint them never
// leaves this server-side environment. The bucket is public for READS only —
// there is deliberately no INSERT/UPDATE/DELETE policy on storage.objects for
// anon or authenticated, so this function is the sole write path.
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { timingSafeEqual } from "../_shared/timing-safe-equal.ts";

const BUCKET = "public-releases";

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

  const releaseToken = Deno.env.get("RELEASE_PUBLISH_TOKEN")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!timingSafeEqual(authHeader, `Bearer ${releaseToken}`)) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const version_code = Number(body.version_code);
  const version_name = String(body.version_name ?? "");

  if (!Number.isInteger(version_code) || version_code < 1) {
    return json({ error: "version_code must be a positive integer" }, 400);
  }
  if (!version_name || version_name.length > 64) {
    return json({ error: "version_name is required (max 64 chars)" }, 400);
  }
  // Paths are fully server-constructed; reject anything that could escape them.
  if (!/^[A-Za-z0-9._-]+$/.test(version_name)) {
    return json({ error: "version_name may only contain A-Z a-z 0-9 . _ -" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const latestPath = "android/trueyoke-latest.apk";
  const archivedPath = `android/trueyoke-v${version_name}-b${version_code}.apk`;

  const [latest, archived] = await Promise.all([
    admin.storage.from(BUCKET).createSignedUploadUrl(latestPath, { upsert: true }),
    admin.storage.from(BUCKET).createSignedUploadUrl(archivedPath, { upsert: true }),
  ]);

  if (latest.error || !latest.data) {
    return json({ error: latest.error?.message ?? "Could not sign latest upload" }, 500);
  }
  if (archived.error || !archived.data) {
    return json({ error: archived.error?.message ?? "Could not sign archive upload" }, 500);
  }

  // The bucket is private (public=true buckets are disallowed on this
  // platform), so the actual public entrypoint is the `download-apk`
  // redirector, not a bare storage URL. `download-apk` defaults to the
  // "latest" path with zero query params, and takes an explicit `?path=`
  // for the versioned archive copy.
  const downloadBase = `${supabaseUrl}/functions/v1/download-apk`;

  return json({
    latest: { signedUrl: latest.data.signedUrl, path: latestPath },
    archived: { signedUrl: archived.data.signedUrl, path: archivedPath },
    publicUrlLatest: downloadBase,
    publicUrlArchived: `${downloadBase}?path=${encodeURIComponent(archivedPath)}`,
  });
});
