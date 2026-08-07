/**
 * Pure voucher rules. The database CHECK constraints on `public.vouchers` are
 * the real source of truth (250-char caps, approval requires confirmation +
 * non-empty endorsement); these helpers exist so no such logic is written
 * inline inside JSX.
 */

/** Character cap on both `request_note` and `endorsement` (DB CHECK enforced). */
export const VOUCHER_TEXT_MAX = 250;

/** "N/250" counter label. */
export function counterLabel(text: string): string {
  return `${text.length}/${VOUCHER_TEXT_MAX}`;
}

/** A request may be sent once the intro note has content within the cap. */
export function canSubmitRequest(note: string): boolean {
  const trimmed = note.trim();
  return trimmed.length > 0 && note.length <= VOUCHER_TEXT_MAX;
}

/** Mirror of the `vouchers_approved_requires_confirmation` DB constraint. */
export function canApprove(confirmed: boolean, endorsement: string): boolean {
  const trimmed = endorsement.trim();
  return confirmed && trimmed.length > 0 && endorsement.length <= VOUCHER_TEXT_MAX;
}
