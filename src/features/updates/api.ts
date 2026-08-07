/**
 * Release-manifest reads. Metadata only — this module never fetches or
 * evaluates application code.
 */
import { supabase } from "@/lib/supabase";
import type { BundleRelease } from "./logic";

/** Newest published release row for a platform, or null when none exists. */
export async function getLatestRelease(platform: "android" | "web"): Promise<BundleRelease | null> {
  const { data, error } = await supabase
    .from("bundle_releases")
    .select(
      "id, version_code, version_name, platform, sha256_hash, signature, signing_pubkey_id, release_notes, published_at",
    )
    .eq("platform", platform)
    .order("version_code", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as BundleRelease | null) ?? null;
}
