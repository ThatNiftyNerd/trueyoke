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

export const FULL_NAME_MAX = 100;

/** Literal appended to the city dropdown for the free-text escape hatch. */
export const CITY_OTHER = "Other (type your city)";

const baseDemographics = {
  age: z
    .number({ invalid_type_error: "Enter your age" })
    .int("Enter a whole number")
    .min(18, "You must be at least 18")
    .max(99, "Enter a valid age"),
  gender: z.enum(["male", "female"], { required_error: "Select an option" }),
  /** Country of residence, stored as the country NAME. */
  country: optString,
  /** One of the resolved city options, or the literal CITY_OTHER. */
  city_choice: optString,
  /** Free text, only used when city_choice is CITY_OTHER. */
  city_other: optString,
  blood_group: optString,
  genotype: optString,
  nationality: optString,
  qualification: optString,
  occupation: optString,
};

/** Match accounts: full name is offered but optional. */
export const demographicsSchema = z.object({
  ...baseDemographics,
  full_name: z.string().trim().max(FULL_NAME_MAX, `Keep it under ${FULL_NAME_MAX} characters`),
});

export type DemographicsValues = z.infer<typeof demographicsSchema>;

export const BIO_MAX = 500;
export const INTENT_MAX = 500;

export const bioSchema = z.object({
  bio: z.string().trim().min(1, "Tell us a little about yourself").max(BIO_MAX),
  marriage_intentions: z.string().trim().max(INTENT_MAX),
});
export type BioValues = z.infer<typeof bioSchema>;

export const faithSchema = z
  .object({
    congregation: optString,
    spirituality_markers: z.array(z.string()),
    /** One of CHURCH_DESIGNATIONS, or the literal "Other". */
    church_designation_choice: z.string().min(1, "Select your church designation"),
    /** Free text, only used (and required) when the choice is "Other". */
    church_designation_other: z.string().trim().max(120),
    /** One of CHURCH_AFFILIATIONS, or the literal "Other". */
    church_affiliation_choice: optString,
    /** Free text, only used (and required) when the choice is "Other". */
    church_affiliation_other: z.string().trim().max(120),
  })
  .refine((v) => v.church_designation_choice !== "Other" || v.church_designation_other.length > 0, {
    message: "Tell us your church designation",
    path: ["church_designation_other"],
  })
  .refine((v) => v.church_affiliation_choice !== "Other" || v.church_affiliation_other.length > 0, {
    message: "Tell us your church affiliation",
    path: ["church_affiliation_other"],
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

/** Mentor leadership credentials (PRD Rev 8 §3.2). */
export const credentialsSchema = z.object({
  mentor_role: z.string().min(1, "Select your official role"),
  congregation: z.string().trim().min(1, "Enter the congregation you serve").max(120),
});
export type CredentialsValues = z.infer<typeof credentialsSchema>;
