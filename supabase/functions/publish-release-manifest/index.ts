// Supabase Edge Function — publish a signed release manifest row.
//
// Called by CI (GitHub Actions) AFTER a build, authenticated with a
// dedicated `RELEASE_PUBLISH_TOKEN` held in a GitHub secret. It is never
// called from the app.
//
// It signs the canonical tuple {version_code, version_name, platform,
// sha256_hash} with an asymmetric RSA-PSS (SHA-256) private key held only in
// this function's environment (`RELEASE_SIGNING_PRIVATE_KEY_B64`) and inserts
// the resulting row. The private key never leaves this environment; clients
// verify with the matching public key shipped in the app bundle.
//
// This function publishes METADATA ONLY. It never serves, hosts, or references
// executable code for the app to run.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

export const SIGNING_PUBKEY_ID = "trueyoke-release-v1";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Canonical, order-stable string that gets signed. Must match the client. */
function canonicalPayload(r: {
  version_code: number;
  version_name: string;
  platform: string;
  sha256_hash: string;
}): string {
  return `${r.version_code}|${r.version_name}|${r.platform}|${r.sha256_hash}`;
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < view.length; i++) bin += String.fromCharCode(view[i]);
  return btoa(bin);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const releaseToken = Deno.env.get("RELEASE_PUBLISH_TOKEN")!;
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${releaseToken}`) return json({ error: "Unauthorized" }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const version_code = Number(body.version_code);
  const version_name = String(body.version_name ?? "");
  const platform = String(body.platform ?? "");
  const sha256_hash = String(body.sha256_hash ?? "");
  const release_notes = body.release_notes == null ? null : String(body.release_notes);

  if (!Number.isInteger(version_code) || version_code < 1) {
    return json({ error: "version_code must be a positive integer" }, 400);
  }
  if (!version_name || version_name.length > 64) {
    return json({ error: "version_name is required (max 64 chars)" }, 400);
  }
  if (platform !== "android" && platform !== "web") {
    return json({ error: "platform must be 'android' or 'web'" }, 400);
  }
  if (!/^[a-f0-9]{64}$/i.test(sha256_hash)) {
    return json({ error: "sha256_hash must be a 64-char hex digest" }, 400);
  }

  const pkcs8 = Deno.env.get("RELEASE_SIGNING_PRIVATE_KEY_B64");
  if (!pkcs8) return json({ error: "Signing key not configured" }, 500);

  const key = await crypto.subtle.importKey(
    "pkcs8",
    b64ToBytes(pkcs8),
    { name: "RSA-PSS", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const payload = canonicalPayload({ version_code, version_name, platform, sha256_hash });
  const sigBuf = await crypto.subtle.sign(
    { name: "RSA-PSS", saltLength: 32 },
    key,
    new TextEncoder().encode(payload),
  );
  const signature = bytesToB64(sigBuf);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
  const { data, error } = await admin
    .from("bundle_releases")
    .insert({
      version_code,
      version_name,
      platform,
      sha256_hash,
      signature,
      signing_pubkey_id: SIGNING_PUBKEY_ID,
      release_notes,
    })
    .select("id, published_at")
    .single();

  if (error) return json({ error: error.message }, 500);
  return json({ ok: true, id: data.id, published_at: data.published_at });
});
