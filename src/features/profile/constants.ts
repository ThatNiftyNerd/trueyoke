/**
 * Dropdown option sets for the onboarding demographics / faith steps.
 * Colocated with the CHURCH_DESIGNATIONS-style constants in `logic.ts`.
 */

/** ABO/Rh blood groups. Uses the Unicode minus sign (−) as specified. */
export const BLOOD_GROUPS = [
  "A+",
  "A−",
  "B+",
  "B−",
  "AB+",
  "AB−",
  "O+",
  "O−",
] as const;

/** Haemoglobin genotypes. */
export const GENOTYPES = ["AA", "AS", "SS", "AC", "SC", "CC"] as const;

/** Highest completed level of education (stored in `profiles.qualification`). */
export const EDUCATION_LEVELS = [
  "High School",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Professional Degree (e.g. JD, MD)",
  "Doctorate / PhD",
] as const;

/**
 * Church affiliations, alphabetized. "Church of Christ" is the UI default.
 * The UI appends its own "Other" escape hatch — it is deliberately not baked
 * into this array (same pattern as CHURCH_DESIGNATION_OTHER in `logic.ts`).
 */
export const CHURCH_AFFILIATIONS = [
  "African Initiated Church",
  "Anglican Church",
  "Apostolic Church",
  "Assemblies of God",
  "Baptist Church",
  "Catholic Church (Roman Catholic)",
  "Celestial Church of Christ",
  "Christ Apostolic Church",
  "Church of Christ",
  "Church of God",
  "Church of the Nazarene",
  "Coptic Orthodox Church",
  "Deeper Life Bible Church",
  "Eastern Orthodox Church",
  "Ethiopian Orthodox Tewahedo Church",
  "Evangelical Church",
  "Foursquare Gospel Church",
  "Greek Orthodox Church",
  "Lutheran Church",
  "Methodist Church",
  "Mount Zion Faith Ministries",
  "Oriental Orthodox Church",
  "Pentecostal Church",
  "Presbyterian Church",
  "Redeemed Christian Church of God (RCCG)",
  "Reformed Church",
  "Russian Orthodox Church",
  "Salvation Army",
  "Seventh-day Adventist Church",
  "Winners Chapel (Living Faith Church)",
] as const;

/** UI default for the church affiliation dropdown. */
export const CHURCH_AFFILIATION_DEFAULT = "Church of Christ";
