/**
 * Client-side zod schemas for each onboarding step. These exist for UX only —
 * the DB check constraints and RLS policies are the real enforcement.
 */
import { z } from "zod";

const optionalTrimmed = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

export const demographicsSchema = z.object({
  age: z
    .number({ invalid_type_error: "Enter your age" })
    .int("Enter a whole number")
    .min(18, "You must be at least 18")
    .max(99, "Enter a valid age"),
  gender: z.enum(["male", "female"], {
    required_error: "Select an option",
  }),
  location_label: optionalTrimmed,
  blood_group: optionalTrimmed,
  genotype: optionalTrimmed,
  nationality: optionalTrimmed,
  qualification: optionalTrimmed,
  occupation: optionalTrimmed,
});
export type DemographicsValues = z.infer<typeof demographicsSchema>;

export const BIO_MAX = 500;
export const INTENT_MAX = 500;

export const bioSchema = z.object({
  bio: z.string().trim().min(1, "Tell us a little about yourself").max(BIO_MAX),
  marriage_intentions: z
    .string()
    .trim()
    .max(INTENT_MAX)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});
export type BioValues = z.infer<typeof bioSchema>;

export const faithSchema = z.object({
  church_affiliation: optionalTrimmed,
  congregation: optionalTrimmed,
  spirituality_markers: z.array(z.string()).default([]),
});
export type FaithValues = z.infer<typeof faithSchema>;

export const LIFE_VERSE_MAX = 500;

export const lifeVerseSchema = z.object({
  life_verse: z
    .string()
    .trim()
    .min(1, "Add a verse that anchors you")
    .max(LIFE_VERSE_MAX),
});
export type LifeVerseValues = z.infer<typeof lifeVerseSchema>;
