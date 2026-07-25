/** Chat presentational + validation helpers. */

/** Matches the DB check constraint on messages.body length. */
export const MESSAGE_MAX_LENGTH = 2000;

export interface DraftValidation {
  ok: boolean;
  reason?: "empty" | "too_long";
  trimmed: string;
}

export function validateDraft(raw: string): DraftValidation {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "empty", trimmed };
  if (trimmed.length > MESSAGE_MAX_LENGTH) return { ok: false, reason: "too_long", trimmed };
  return { ok: true, trimmed };
}
