/**
 * Pure update-awareness logic. No React, no network, no code execution.
 *
 * Signature verification is intentionally client-side and read-only: a release
 * row that fails verification is treated as if it did not exist.
 */

export type BundleRelease = {
  id: string;
  version_code: number;
  version_name: string;
  platform: "android" | "web";
  sha256_hash: string;
  signature: string;
  signing_pubkey_id: string;
  release_notes: string | null;
  published_at: string;
};

export type RunningVersion = {
  version_code: number;
  version_name: string;
};

/** Canonical, order-stable signed string. Must match the edge function exactly. */
export function canonicalPayload(release: {
  version_code: number;
  version_name: string;
  platform: string;
  sha256_hash: string;
}): string {
  return `${release.version_code}|${release.version_name}|${release.platform}|${release.sha256_hash}`;
}

/** True when `candidate` is a strictly newer build than `current`. */
export function isNewer(current: RunningVersion, candidate: BundleRelease): boolean {
  return candidate.version_code > current.version_code;
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function pemToSpki(pem: string): Uint8Array {
  return b64ToBytes(pem.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, ""));
}

/**
 * Verifies the release manifest signature against the public key (RSA-PSS,
 * SHA-256, saltLength 32). Returns false on any error — never throws, never
 * treats an unverifiable release as legitimate.
 */
export async function verifySignature(
  release: BundleRelease,
  publicKeyPem: string,
): Promise<boolean> {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return false;

    const key = await subtle.importKey(
      "spki",
      pemToSpki(publicKeyPem) as unknown as ArrayBuffer,
      { name: "RSA-PSS", hash: "SHA-256" },
      false,
      ["verify"],
    );

    return await subtle.verify(
      { name: "RSA-PSS", saltLength: 32 },
      key,
      b64ToBytes(release.signature) as unknown as ArrayBuffer,
      new TextEncoder().encode(canonicalPayload(release)),
    );
  } catch {
    return false;
  }
}
