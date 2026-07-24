/**
 * Hand-typed row shapes for the Yoked schema.
 *
 * These mirror the hand-designed schema described in the project brief. Once
 * the schema is applied to the database, regenerate `src/integrations/supabase/types.ts`
 * and prefer `Tables<"profiles">` etc. over the shapes here.
 *
 * TODO: Replace these shapes with generated `Tables<...>` types once the
 * schema is live in the database.
 */

import type { AccountType } from "@/lib/constants";

export type Uuid = string;

export type IdVerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface ProfileRow {
  id: Uuid;
  account_type: AccountType;
  display_name: string | null;
  age: number | null;
  gender: string | null;
  location: string | null;
  lat: number | null;
  long: number | null;
  blood_group: string | null;
  genotype: string | null;
  nationality: string | null;
  qualification: string | null;
  occupation: string | null;
  bio: string | null;
  marriage_intentions: string | null;
  church_affiliation: string | null;
  congregation: string | null;
  spirituality_markers: string[] | null;
  life_verse: string | null;
  voice_intro_url: string | null;
  id_verification_status: IdVerificationStatus;
  church_verified: boolean;
  mentor_role: string | null;
  /** DB-generated column. */
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface PhotoRow {
  id: Uuid;
  profile_id: Uuid;
  storage_path: string;
  position: number;
}

export type SwipeDirection = "like" | "pass";

export interface SwipeRow {
  id: Uuid;
  swiper_id: Uuid;
  swipee_id: Uuid;
  direction: SwipeDirection;
  created_at: string;
}

export type MatchStatus = "active" | "expired" | "closed";

export interface MatchRow {
  id: Uuid;
  user_a_id: Uuid;
  user_b_id: Uuid;
  status: MatchStatus;
  last_activity_at: string;
  created_at: string;
}

export interface MessageRow {
  id: Uuid;
  match_id: Uuid;
  sender_id: Uuid;
  body: string;
  created_at: string;
}

export interface ReportRow {
  id: Uuid;
  reporter_id: Uuid;
  reported_id: Uuid;
  reason: string;
  created_at: string;
}

export interface BlockRow {
  id: Uuid;
  blocker_id: Uuid;
  blocked_id: Uuid;
  created_at: string;
}

export type VoucherStatus = "pending" | "accepted" | "declined" | "revoked";

export interface VoucherRow {
  id: Uuid;
  match_user_id: Uuid;
  mentor_id: Uuid;
  invitee_email: string;
  endorsement: string | null;
  status: VoucherStatus;
  created_at: string;
}
