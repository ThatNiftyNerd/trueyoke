/**
 * Optional, opt-in marketing email consent. Entirely separate from the
 * mandatory NDPA privacy consent (`profiles.privacy_accepted_at`).
 */
import { supabase } from "@/lib/supabase";

/**
 * Version tag stamped onto `marketing_consents.consent_version` whenever a
 * consent preference is recorded. Bump if the marketing consent copy shown
 * to the user materially changes, mirroring PRIVACY_POLICY_VERSION.
 */
export const MARKETING_CONSENT_VERSION = "v1";

export type ConsentSource = "signup" | "login" | "settings";

export interface UpsertMarketingConsentInput {
  profileId: string;
  email: string;
  consented: boolean;
  source: ConsentSource;
}

/** Insert-or-update the caller's single marketing consent row. */
export async function upsertMarketingConsent(input: UpsertMarketingConsentInput): Promise<void> {
  const { error } = await supabase.from("marketing_consents").upsert(
    {
      profile_id: input.profileId,
      email: input.email,
      consented: input.consented,
      consented_at: input.consented ? new Date().toISOString() : null,
      consent_source: input.source,
      consent_version: MARKETING_CONSENT_VERSION,
    },
    { onConflict: "profile_id" },
  );
  if (error) throw new Error(error.message);
}

/** Current preference for the signed-in user; false when no row exists yet. */
export async function getOwnMarketingConsent(profileId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("marketing_consents")
    .select("consented")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.consented ?? false;
}
