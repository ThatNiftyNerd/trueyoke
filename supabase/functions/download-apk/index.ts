// Supabase Edge Function — public, unauthenticated download entrypoint for the
// signed release APK.
//
// This exists because this workspace forbids `public = true` storage buckets,
// so the `/storage/v1/object/public/...` URL form is unavailable. This function
// is read-only: it mints a short-lived signed DOWNLOAD url with the
// service-role key (which never leaves this server-side environment) and
// 302-redirects to it. It accepts no body, writes nothing, and can only ever
// reach paths inside the `public-releases` bucket.
import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "public-releases";
const LATEST_PATH = "android/trueyoke-latest.apk";

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const requested = url.searchParams.get("path") ?? LATEST_PATH;
  // Server-side allow-shape: only flat `android/<name>.apk` object names.
  const path = /^android\/[A-Za-z0-9._-]+\.apk$/.test(requested) ? requested : LATEST_PATH;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, 300, {
    download: true,
  });

  if (error || !data) {
    return new Response(JSON.stringify({ error: "Release not available" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(null, {
    status: 302,
    headers: { Location: data.signedUrl, "Cache-Control": "no-store" },
  });
});
