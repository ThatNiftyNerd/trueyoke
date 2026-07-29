/**
 * Yoked — "Grounded Growth" palette.
 *
 * Single source of truth for brand colors. Every component MUST reference
 * these tokens (or the matching Tailwind utility classes: `bg-brand-burgundy`,
 * `text-brand-sage`, `bg-brand-linen`, `text-brand-terracotta`, `text-brand-ink`,
 * `bg-brand-sand`, `text-brand-warm-gray`, `text-brand-fern`).
 *
 * Do NOT introduce raw hex codes anywhere else in the codebase.
 * Keep in sync with the `@theme` block in src/styles.css.
 */
export const colors = {
  /** Primary — headers, bottom nav, primary buttons/text. */
  burgundy: "#6B1724",
  /** Accent — verification badges, Life Verse frame, highlights. */
  sage: "#87A987",
  /** Canvas / app background. */
  linen: "#F4F1EA",
  /**
   * Functional ONLY — chat-cap indicators and 72h expiry warnings
   * (the Intentionality Circuit Breaker). Never use decoratively, and never
   * for generic form-validation errors.
   */
  terracotta: "#C97B5A",
  /** AA-safe dark sage — text/icons drawn on Sage. */
  fern: "#3A5744",
  /** Warm near-black — default foreground text. */
  ink: "#241012",
  /** Warm neutral surface — secondary/muted fills. */
  sand: "#E3DACB",
  /** Warm gray — muted/secondary text. */
  warmGray: "#8C8478",
  /** Deep terracotta — high-contrast variant of the functional warning color. */
  terracottaDeep: "#9C5638",
  /** Dark-mode canvas — burgundy ink. */
  burgundyInk: "#4A0F18",
} as const;

/** Dark-mode palette — Deep Charcoal canvas, Vibrant Crimson, Forest Accent. */
export const darkColors = {
  background: "#1A1A1A",
  primary: "#9E2A2B",
  accent: "#4D6A4D",
  foreground: "#EFECE6",
} as const;

export type BrandColor = keyof typeof colors;
