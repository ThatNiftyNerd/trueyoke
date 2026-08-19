export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_pending_invites: {
        Row: {
          email: string
          invited_at: string
          invited_by: string | null
          make_super_admin: boolean
          role_keys: string[]
        }
        Insert: {
          email: string
          invited_at?: string
          invited_by?: string | null
          make_super_admin?: boolean
          role_keys?: string[]
        }
        Update: {
          email?: string
          invited_at?: string
          invited_by?: string | null
          make_super_admin?: boolean
          role_keys?: string[]
        }
        Relationships: []
      }
      admin_permissions: {
        Row: {
          description: string | null
          id: string
          key: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
        }
        Relationships: []
      }
      admin_role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "admin_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "admin_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      admin_user_roles: {
        Row: {
          admin_user_id: string
          granted_at: string
          granted_by: string | null
          role_id: string
        }
        Insert: {
          admin_user_id: string
          granted_at?: string
          granted_by?: string | null
          role_id: string
        }
        Update: {
          admin_user_id?: string
          granted_at?: string
          granted_by?: string | null
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_user_roles_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "admin_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          created_by: string | null
          display_name: string
          id: string
          is_active: boolean
          is_super_admin: boolean
          last_login_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_name: string
          id: string
          is_active?: boolean
          is_super_admin?: boolean
          last_login_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          is_super_admin?: boolean
          last_login_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          active: boolean
          body: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          active?: boolean
          body: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_releases: {
        Row: {
          id: string
          platform: string
          published_at: string
          release_notes: string | null
          sha256_hash: string
          signature: string
          signing_pubkey_id: string
          version_code: number
          version_name: string
        }
        Insert: {
          id?: string
          platform: string
          published_at?: string
          release_notes?: string | null
          sha256_hash: string
          signature: string
          signing_pubkey_id: string
          version_code: number
          version_name: string
        }
        Update: {
          id?: string
          platform?: string
          published_at?: string
          release_notes?: string | null
          sha256_hash?: string
          signature?: string
          signing_pubkey_id?: string
          version_code?: number
          version_name?: string
        }
        Relationships: []
      }
      church_verifications: {
        Row: {
          created_at: string
          evidence_path: string
          id: string
          profile_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["church_verification_status"]
        }
        Insert: {
          created_at?: string
          evidence_path: string
          id?: string
          profile_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["church_verification_status"]
        }
        Update: {
          created_at?: string
          evidence_path?: string
          id?: string
          profile_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["church_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "church_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "church_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      id_verifications: {
        Row: {
          created_at: string
          document_path: string
          id: string
          profile_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["id_status"]
        }
        Insert: {
          created_at?: string
          document_path: string
          id?: string
          profile_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["id_status"]
        }
        Update: {
          created_at?: string
          document_path?: string
          id?: string
          profile_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["id_status"]
        }
        Relationships: [
          {
            foreignKeyName: "id_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "id_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_consents: {
        Row: {
          consent_source: string
          consented: boolean
          consented_at: string | null
          email: string
          id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          consent_source?: string
          consented?: boolean
          consented_at?: string | null
          email: string
          id?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          consent_source?: string
          consented?: boolean
          consented_at?: string | null
          email?: string
          id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_consents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_reads: {
        Row: {
          last_read_at: string
          match_id: string
          user_id: string
        }
        Insert: {
          last_read_at?: string
          match_id: string
          user_id: string
        }
        Update: {
          last_read_at?: string
          match_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_reads_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: string
          last_activity_at: string
          status: Database["public"]["Enums"]["match_status"]
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity_at?: string
          status?: Database["public"]["Enums"]["match_status"]
          user_a_id: string
          user_b_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_activity_at?: string
          status?: Database["public"]["Enums"]["match_status"]
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_user_a_id_fkey"
            columns: ["user_a_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user_b_id_fkey"
            columns: ["user_b_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          match_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          match_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          created_at: string
          id: string
          position: number
          profile_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          profile_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          profile_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          account_type: Database["public"]["Enums"]["account_type"]
          age: number | null
          bio: string | null
          blood_group: string | null
          church_affiliation: string | null
          church_designation: string | null
          church_verified: boolean
          city: string | null
          congregation: string | null
          country: string | null
          created_at: string
          display_name: string
          email: string | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          genotype: string | null
          id: string
          is_admin: boolean
          latitude: number | null
          life_verse: string | null
          location_label: string | null
          longitude: number | null
          marriage_intentions: string | null
          mentor_role: string | null
          nationality: string | null
          occupation: string | null
          privacy_accepted_at: string | null
          privacy_policy_version: string | null
          profile_complete: boolean | null
          qualification: string | null
          spirituality_markers: string[] | null
          status_changed_at: string | null
          status_changed_by: string | null
          updated_at: string
          voice_intro_url: string | null
        }
        Insert: {
          account_status?: string
          account_type?: Database["public"]["Enums"]["account_type"]
          age?: number | null
          bio?: string | null
          blood_group?: string | null
          church_affiliation?: string | null
          church_designation?: string | null
          church_verified?: boolean
          city?: string | null
          congregation?: string | null
          country?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          genotype?: string | null
          id: string
          is_admin?: boolean
          latitude?: number | null
          life_verse?: string | null
          location_label?: string | null
          longitude?: number | null
          marriage_intentions?: string | null
          mentor_role?: string | null
          nationality?: string | null
          occupation?: string | null
          privacy_accepted_at?: string | null
          privacy_policy_version?: string | null
          profile_complete?: boolean | null
          qualification?: string | null
          spirituality_markers?: string[] | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          updated_at?: string
          voice_intro_url?: string | null
        }
        Update: {
          account_status?: string
          account_type?: Database["public"]["Enums"]["account_type"]
          age?: number | null
          bio?: string | null
          blood_group?: string | null
          church_affiliation?: string | null
          church_designation?: string | null
          church_verified?: boolean
          city?: string | null
          congregation?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          genotype?: string | null
          id?: string
          is_admin?: boolean
          latitude?: number | null
          life_verse?: string | null
          location_label?: string | null
          longitude?: number | null
          marriage_intentions?: string | null
          mentor_role?: string | null
          nationality?: string | null
          occupation?: string | null
          privacy_accepted_at?: string | null
          privacy_policy_version?: string | null
          profile_complete?: boolean | null
          qualification?: string | null
          spirituality_markers?: string[] | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          updated_at?: string
          voice_intro_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_status_changed_by_fkey"
            columns: ["status_changed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          action_taken: string | null
          created_at: string
          id: string
          reason: string | null
          reported_id: string
          reporter_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          reported_id: string
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          reported_id?: string
          reporter_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      swipes: {
        Row: {
          created_at: string
          direction: Database["public"]["Enums"]["swipe_direction"]
          id: string
          swipee_id: string
          swiper_id: string
        }
        Insert: {
          created_at?: string
          direction: Database["public"]["Enums"]["swipe_direction"]
          id?: string
          swipee_id: string
          swiper_id: string
        }
        Update: {
          created_at?: string
          direction?: Database["public"]["Enums"]["swipe_direction"]
          id?: string
          swipee_id?: string
          swiper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipes_swipee_id_fkey"
            columns: ["swipee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_swiper_id_fkey"
            columns: ["swiper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          created_at: string
          endorsement: string | null
          id: string
          invite_channel: string
          invite_expires_at: string | null
          invite_token: string | null
          invitee_email: string | null
          invitee_phone: string | null
          match_user_id: string
          mentor_confirmed: boolean
          mentor_id: string | null
          request_note: string | null
          status: string
        }
        Insert: {
          created_at?: string
          endorsement?: string | null
          id?: string
          invite_channel?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invitee_email?: string | null
          invitee_phone?: string | null
          match_user_id: string
          mentor_confirmed?: boolean
          mentor_id?: string | null
          request_note?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          endorsement?: string | null
          id?: string
          invite_channel?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invitee_email?: string | null
          invitee_phone?: string | null
          match_user_id?: string
          mentor_confirmed?: boolean
          mentor_id?: string | null
          request_note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_match_user_id_fkey"
            columns: ["match_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_analytics_engagement: {
        Args: never
        Returns: {
          metric: string
          value: number
        }[]
      }
      admin_analytics_match_voucher_summary: {
        Args: never
        Returns: {
          count: number
          metric: string
          status: string
        }[]
      }
      admin_analytics_reports_summary: {
        Args: never
        Returns: {
          count: number
          status: string
        }[]
      }
      admin_analytics_retention: {
        Args: never
        Returns: {
          cohort: string
          retained: number
          retention_pct: number
          total: number
        }[]
      }
      admin_analytics_signups_over_time: {
        Args: { p_days?: number }
        Returns: {
          account_type: string
          day: string
          signups: number
        }[]
      }
      admin_analytics_verification_rates: {
        Args: never
        Returns: {
          count: number
          status: string
        }[]
      }
      admin_assign_role: {
        Args: { p_admin_user_id: string; p_role_id: string }
        Returns: undefined
      }
      admin_delete_message: {
        Args: { p_message_id: string }
        Returns: undefined
      }
      admin_get_audit_log: {
        Args: {
          p_action_filter?: string
          p_admin_user_id_filter?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          action: string
          admin_email: string
          admin_user_id: string
          created_at: string
          id: string
          metadata: Json
          target_id: string
          target_table: string
        }[]
      }
      admin_get_profile_sensitive_fields: {
        Args: { p_profile_id: string }
        Returns: {
          blood_group: string
          genotype: string
        }[]
      }
      admin_grant_access: {
        Args: {
          p_email: string
          p_make_super_admin?: boolean
          p_role_keys?: string[]
        }
        Returns: Json
      }
      admin_list_admins: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          id: string
          is_active: boolean
          is_super_admin: boolean
          last_login_at: string
          roles: string[]
        }[]
      }
      admin_list_mailing_list: {
        Args: never
        Returns: {
          consented_at: string
          email: string
        }[]
      }
      admin_list_match_messages: {
        Args: { p_match_id: string }
        Returns: {
          created_at: string
          id: string
          match_id: string
          sender_id: string
          sender_name: string
        }[]
      }
      admin_list_roles: {
        Args: never
        Returns: {
          description: string
          id: string
          key: string
          name: string
          permissions: string[]
        }[]
      }
      admin_override_profile: {
        Args: { p_patch: Json; p_profile_id: string }
        Returns: undefined
      }
      admin_resolve_report: {
        Args: {
          p_action_taken?: string
          p_report_id: string
          p_resolution_notes?: string
          p_status: string
        }
        Returns: undefined
      }
      admin_reveal_verification_document: {
        Args: { p_verification_id: string }
        Returns: string
      }
      admin_review_verification: {
        Args: {
          p_new_status: string
          p_rejection_reason?: string
          p_verification_id: string
        }
        Returns: undefined
      }
      admin_revoke_role: {
        Args: { p_admin_user_id: string; p_role_id: string }
        Returns: undefined
      }
      admin_set_account_status: {
        Args: { p_new_status: string; p_profile_id: string; p_reason?: string }
        Returns: undefined
      }
      admin_set_admin_active: {
        Args: {
          p_admin_user_id: string
          p_is_active: boolean
          p_reason?: string
        }
        Returns: undefined
      }
      admin_set_match_status: {
        Args: { p_match_id: string; p_new_status: string; p_reason?: string }
        Returns: undefined
      }
      admin_set_voucher_status: {
        Args: { p_new_status: string; p_reason?: string; p_voucher_id: string }
        Returns: undefined
      }
      admin_touch_last_login: { Args: never; Returns: undefined }
      admin_view_message: {
        Args: { p_message_id: string }
        Returns: {
          body: string
          created_at: string
          id: string
          match_id: string
          sender_id: string
        }[]
      }
      claim_mentor_invite: {
        Args: { p_token: string }
        Returns: {
          created_at: string
          endorsement: string | null
          id: string
          invite_channel: string
          invite_expires_at: string | null
          invite_token: string | null
          invitee_email: string | null
          invitee_phone: string | null
          match_user_id: string
          mentor_confirmed: boolean
          mentor_id: string | null
          request_note: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "vouchers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_own_profile_full: {
        Args: never
        Returns: {
          account_status: string
          account_type: Database["public"]["Enums"]["account_type"]
          age: number | null
          bio: string | null
          blood_group: string | null
          church_affiliation: string | null
          church_designation: string | null
          church_verified: boolean
          city: string | null
          congregation: string | null
          country: string | null
          created_at: string
          display_name: string
          email: string | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          genotype: string | null
          id: string
          is_admin: boolean
          latitude: number | null
          life_verse: string | null
          location_label: string | null
          longitude: number | null
          marriage_intentions: string | null
          mentor_role: string | null
          nationality: string | null
          occupation: string | null
          privacy_accepted_at: string | null
          privacy_policy_version: string | null
          profile_complete: boolean | null
          qualification: string | null
          spirituality_markers: string[] | null
          status_changed_at: string | null
          status_changed_by: string | null
          updated_at: string
          voice_intro_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_admin_permission: {
        Args: { permission_key: string }
        Returns: boolean
      }
      is_active_admin: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_blocked: { Args: { other_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      log_admin_action: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_target_id: string
          p_target_table: string
        }
        Returns: string
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      account_type: "match" | "mentor"
      church_verification_status: "pending" | "verified" | "rejected"
      gender_type: "male" | "female"
      id_status: "none" | "pending" | "verified" | "rejected"
      match_status: "active" | "expired" | "closed"
      swipe_direction: "like" | "pass"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["match", "mentor"],
      church_verification_status: ["pending", "verified", "rejected"],
      gender_type: ["male", "female"],
      id_status: ["none", "pending", "verified", "rejected"],
      match_status: ["active", "expired", "closed"],
      swipe_direction: ["like", "pass"],
    },
  },
} as const
