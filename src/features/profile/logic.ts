/**
 * Onboarding profile logic — pure helpers, no I/O.
 */
import type { OnboardingProfile } from "./api";

/**
 * Preset spirituality markers rendered as a checkbox list on the faith step.
 * The DB column is `text[]` with no enum, but we constrain the stored values
 * to this preset set so downstream filtering stays predictable.
 */
export const SPIRITUALITY_MARKERS: readonly string[] = [
  "Baptized believer",
  "Regular attender",
  "Bible class teacher",
  "Small group / home Bible study",
  "Serves in ministry",
  "Prayer partner",
  "Mission-minded",
  "Family devotion",
] as const;

/**
 * Formal denominational / fellowship classifications offered in the faith step.
 * Draft taxonomy — product still to confirm. "Other" reveals a free-text field
 * and the typed value is stored verbatim in `profiles.church_designation`.
 */
export const CHURCH_DESIGNATIONS: readonly string[] = [
  "Church of Christ (a cappella / non-instrumental)",
  "Church of Christ (instrumental)",
  "International Churches of Christ",
  "Christian Church (Disciples of Christ)",
  "Christian Churches and Churches of Christ (independent, instrumental)",
  "United Church of Christ",
  "Non-denominational",
] as const;

export const CHURCH_DESIGNATION_OTHER = "Other";

/**
 * Version tag stamped onto `profiles.special_category_consent_version` when
 * the user completes the dedicated special-category consent step (GDPR
 * Art. 9 / LGPD "dados sensíveis" / POPIA "special personal information").
 * Bump this if the consent copy materially changes, mirroring
 * PRIVACY_POLICY_VERSION in src/features/auth/api.ts.
 */
export const SPECIAL_CATEGORY_CONSENT_VERSION = "v1";

/** Wizard step keys, in display order. */
export const STEP_KEYS = [
  "special-category-consent",
  "demographics",
  "photos",
  "bio",
  "faith",
  "life-verse",
  "voice",
  "mentor-details",
] as const;
export type StepKey = (typeof STEP_KEYS)[number];

export interface StepMeta {
  key: StepKey;
  title: string;
  description: string;
  /** Fields whose non-null presence a) satisfies profile_complete or
   *  b) is otherwise required by DB constraints checked at update time. */
  requiredFields: readonly (keyof OnboardingProfile)[];
}

export const STEPS: readonly StepMeta[] = [
  {
    key: "special-category-consent",
    title: "Sensitive data consent",
    description: "Explicit consent for genotype, blood group, and faith data.",
    requiredFields: ["special_category_consented_at"],
  },
  {
    key: "demographics",
    title: "Demographics",
    description: "Age, gender, location, and background.",
    requiredFields: ["age", "gender"],
  },
  {
    key: "photos",
    title: "Photos",
    description: "Add photos so people can recognize you. Optional.",
    requiredFields: [],
  },
  {
    key: "bio",
    title: "Bio & marriage intentions",
    description: "Share who you are and what you're seeking.",
    requiredFields: ["bio"],
  },
  {
    key: "faith",
    title: "Church affiliation & spirituality",
    description: "Your congregation and the markers of your walk.",
    requiredFields: ["church_designation"],
  },
  {
    key: "life-verse",
    title: "Life verse",
    description: "A verse that anchors you.",
    requiredFields: ["life_verse"],
  },
  {
    key: "voice",
    title: "Voice intro",
    description: "Record a short spoken introduction. Optional — you can skip it.",
    requiredFields: [],
  },
];

/**
 * Mentor wizard (PRD Rev 8 §3.2): mentors are not dating — they only need the
 * details a match sees when requesting an endorsement, plus a photo.
 * No bio, faith picker, life verse, or voice intro.
 */
export const MENTOR_STEPS: readonly StepMeta[] = [
  {
    key: "special-category-consent",
    title: "Sensitive data consent",
    description: "Explicit consent for your church affiliation and faith data.",
    requiredFields: ["special_category_consented_at"],
  },
  {
    key: "mentor-details",
    title: "About you",
    description: "A few details matches see when requesting your endorsement.",
    requiredFields: ["full_name", "nationality", "church_affiliation", "mentor_role", "email"],
  },
  {
    key: "photos",
    title: "Photo",
    description:
      "Required — matches see your name, photo, and church affiliation when requesting a voucher.",
    requiredFields: [],
  },
];

/**
 * Steps for a given account type. "match" accounts no longer upload a gallery
 * during onboarding — they take a live selfie later, after their first match.
 * Mentors get the short credentials-only wizard above.
 */
export function stepsFor(
  accountType: OnboardingProfile["account_type"] | null | undefined,
): readonly StepMeta[] {
  if (accountType === "mentor") return MENTOR_STEPS;
  return accountType === "match" ? STEPS.filter((s) => s.key !== "photos") : STEPS;
}

/**
 * Resume-in-progress landing index: the first step whose required fields are
 * not yet all present on the profile. When everything is filled, returns the
 * last step's index so the user can review before Finish.
 */
export function firstIncompleteStepIndex(profile: OnboardingProfile | null): number {
  if (!profile) return 0;
  const steps = stepsFor(profile.account_type);
  for (let i = 0; i < steps.length; i++) {
    const meta = steps[i];
    const missing = meta.requiredFields.some((f) => profile[f] == null);
    if (missing) return i;
  }
  return steps.length - 1;
}

/** Which steps still have required fields missing — used for Finish error UI. */
export function missingStepTitles(profile: OnboardingProfile | null): string[] {
  if (!profile) return STEPS.map((s) => s.title);
  return stepsFor(profile.account_type)
    .filter((s) => s.requiredFields.some((f) => profile[f] == null))
    .map((s) => s.title);
}

// -------- Photo upload UX constraints (bucket enforces the real limits) --

export const PHOTO_MAX_COUNT = 6;
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function extensionForImage(file: File): string | null {
  return PHOTO_MIME_TO_EXT[file.type] ?? null;
}

// -------- Voice intro constraints ----------------------------------------

/** Choose a reasonable file extension for a MediaRecorder blob's MIME. */
export function extensionForAudioMime(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
}
