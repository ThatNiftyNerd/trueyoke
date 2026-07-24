/**
 * Shared, named business constants.
 *
 * The database is the source of truth for these rules (enforced by triggers).
 * The client mirrors them for UI copy, disabled states, and indicators only —
 * never as authoritative gates.
 */

/** Hard cap on active matches per user (DB trigger enforced). */
export const ACTIVE_MATCH_CAP = 3;

/** Auto-expiry window on matches with no activity (DB trigger enforced). */
export const MATCH_EXPIRY_HOURS = 72;

/** Voice intro max length, in seconds (onboarding step). */
export const VOICE_INTRO_MAX_SECONDS = 15;

/** Account types on the profile row. */
export const ACCOUNT_TYPES = ["match", "mentor"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];
