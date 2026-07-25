// Mirrors supabase/schema.sql. Keep in sync with the database.
export type AccountType = 'match' | 'mentor';
export type Gender = 'male' | 'female';
export type SwipeDirection = 'like' | 'pass';
export type MatchStatus = 'active' | 'expired' | 'closed';
export type IdStatus = 'none' | 'pending' | 'verified' | 'rejected';

export interface Profile {
  id: string;
  account_type: AccountType;
  display_name: string;
  age: number | null;
  gender: Gender | null;
  location_label: string | null;
  latitude: number | null;
  longitude: number | null;
  blood_group: string | null;
  genotype: string | null;
  nationality: string | null;
  qualification: string | null;
  occupation: string | null;
  bio: string | null;
  marriage_intentions: string | null;
  church_affiliation: string | null;
  congregation: string | null;
  spirituality_markers: string[];
  life_verse: string | null;
  voice_intro_url: string | null;
  id_verification_status: IdStatus;
  church_verified: boolean;
  mentor_role: string | null;
  profile_complete: boolean;
}

export interface Match {
  id: string;
  user_a_id: string;
  user_b_id: string;
  status: MatchStatus;
  last_activity_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export const ACTIVE_CHAT_CAP = 3;
export const CHAT_EXPIRY_HOURS = 72;

// MVP spirituality markers (PRD 3.2 "Doctrinal Alignment").
export const SPIRITUALITY_MARKERS = [
  'A cappella worship',
  'Weekly communion',
  'Baptism for remission of sins',
  'Bible as sole authority',
  'Regular church attendance',
  'Tithing / cheerful giving',
  'Daily personal study',
  'Active in ministry'
] as const;
