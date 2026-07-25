/**
 * Client-side zod schemas for each onboarding step. UX-only validation —
 * DB check constraints and RLS policies are the real enforcement.
 *
 * Schemas keep every field as a plain string in the form model. Persistence
 * code maps empty strings to null before writing, so we don't fight
 * react-hook-form's input/output type inference.
 */
import { z } from "zod";

const optString = z.string().trim().max(200);

export const demographicsSchema = z.object({
  age: z
    .number({ invalid_type_error: "Enter your age" })
    .int("Enter a whole number")
    .min(18, "You must be at least 18")
    .max(99, "Enter a valid age"),
  gender: z.enum(["male", "female"], { required_error: "Select an option" }),
  location_label: optString,
  blood_group: optString,
  genotype: optString,
  nationality: optString,
  qualification: optString,
  occupation: optString,
});
export type DemographicsValues = z.infer<typeof demographicsSchema>;

export const BIO_MAX = 500;
export const INTENT_MAX = 500;

export const bioSchema = z.object({
  bio: z.string().trim().min(1, "Tell us a little about yourself").max(BIO_MAX),
  marriage_intentions: z.string().trim().max(INTENT_MAX),
});
export type BioValues = z.infer<typeof bioSchema>;

export const faithSchema = z.object({
  church_affiliation: optString,
  congregation: optString,
  spirituality_markers: z.array(z.string()),
});
export type FaithValues = z.infer<typeof faithSchema>;

export const LIFE_VERSE_MAX = 500;

export const lifeVerseSchema = z.object({
  life_verse: z.string().trim().min(1, "Add a verse that anchors you").max(LIFE_VERSE_MAX),
});
export type LifeVerseValues = z.infer<typeof lifeVerseSchema>;

/** Convert "" → null for optional text fields before writing to Supabase. */
export function emptyToNull<T extends Record<string, unknown>>(
  obj: T,
): {
  [K in keyof T]: T[K] extends string ? string | null : T[K];
} {
  const out: Record<string, unknown> = { ...obj };
  for (const k of Object.keys(out)) {
    if (typeof out[k] === "string" && (out[k] as string).length === 0) {
      out[k] = null;
    }
  }
  return out as { [K in keyof T]: T[K] extends string ? string | null : T[K] };
}
