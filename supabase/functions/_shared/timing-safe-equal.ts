/**
 * Constant-time string comparison — avoids leaking timing information
 * proportional to the matching-prefix length. Plain `!==`/`.every()` on the
 * bearer token both short-circuit on the first mismatched byte; this walks
 * every byte regardless of an early difference.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  if (bufA.length !== bufB.length) return false;
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) {
    diff |= bufA[i] ^ bufB[i];
  }
  return diff === 0;
}
