/**
 * Yoked — "Grounded Growth" palette.
 *
 * Single source of truth for brand colors. Every component MUST reference
 * these tokens (or the matching Tailwind utility classes: `bg-brand-burgundy`,
 * `text-brand-sage`, `bg-brand-linen`, `text-brand-terracotta`).
 *
 * Do NOT introduce raw hex codes anywhere else in the codebase.
 */
export const colors = {
  /** Primary — headers, bottom nav, primary buttons/text. */
  burgundy: "#6B1724",
  /** Accent — verification badges, Life Verse frame, highlights. */
  sage: "#87A987",
  /** Canvas / app background. */
  linen: "#F4F1EA",
  /**
   * Functional ONLY — chat-cap indicators and 72h expiry warnings.
   * Never use decoratively.
   */
  terracotta: "#C97B5A",
} as const;

export type BrandColor = keyof typeof colors;
