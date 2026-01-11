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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      _bf_projects_orgid_backup: {
        Row: {
          backed_up_at: string | null
          prev_organization_id: string | null
          project_id: string
        }
        Insert: {
          backed_up_at?: string | null
          prev_organization_id?: string | null
          project_id: string
        }
        Update: {
          backed_up_at?: string | null
          prev_organization_id?: string | null
          project_id?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          action: string | null
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          organization_id: string
          payload: Json
          resource_id: string | null
          resource_type: string | null
          type: string
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at: string
          id: string
          ip_address?: unknown
          metadata?: Json | null
          organization_id: string
          payload: Json
          resource_id?: string | null
          resource_type?: string | null
          type: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          organization_id?: string
          payload?: Json
          resource_id?: string | null
          resource_type?: string | null
          type?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      activities_202511: {
        Row: {
          action: string | null
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          organization_id: string
          payload: Json
          resource_id: string | null
          resource_type: string | null
          type: string
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at: string
          id: string
          ip_address?: unknown
          metadata?: Json | null
          organization_id: string
          payload: Json
          resource_id?: string | null
          resource_type?: string | null
          type: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          organization_id?: string
          payload?: Json
          resource_id?: string | null
          resource_type?: string | null
          type?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_alerts: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          detected_at: string
          event_type: string
          id: string
          organization_id: string
          severity: string
          title: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          detected_at?: string
          event_type: string
          id?: string
          organization_id: string
          severity?: string
          title?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          detected_at?: string
          event_type?: string
          id?: string
          organization_id?: string
          severity?: string
          title?: string | null
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          context: Json | null
          diff: Json | null
          entity_id: string | null
          entity_type: string
          id: number
          occurred_at: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          context?: Json | null
          diff?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: number
          occurred_at?: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          context?: Json | null
          diff?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: number
          occurred_at?: string
        }
        Relationships: []
      }
      ai_answers: {
        Row: {
          answer_text: string
          citations: Json
          created_at: string
          id: string
          model: string | null
          prompt_hash: string | null
          query_id: string
        }
        Insert: {
          answer_text: string
          citations?: Json
          created_at?: string
          id?: string
          model?: string | null
          prompt_hash?: string | null
          query_id: string
        }
        Update: {
          answer_text?: string
          citations?: Json
          created_at?: string
          id?: string
          model?: string | null
          prompt_hash?: string | null
          query_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_answers_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "ai_queries"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_bot_logs: {
        Row: {
          accessed_at: string | null
          bot_name: string
          content_unit_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          organization_id: string | null
          request_method: string | null
          response_status: number | null
          url: string
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string | null
          bot_name: string
          content_unit_id?: string | null
          created_at: string
          id: string
          ip_address?: unknown
          organization_id?: string | null
          request_method?: string | null
          response_status?: number | null
          url: string
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string | null
          bot_name?: string
          content_unit_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          request_method?: string | null
          response_status?: number | null
          url?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_bot_logs_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "ai_content_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bot_logs_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "v_ai_content_units_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bot_logs_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "view_ai_content_units"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_bot_logs_202511: {
        Row: {
          accessed_at: string | null
          bot_name: string
          content_unit_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          organization_id: string | null
          request_method: string | null
          response_status: number | null
          url: string
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string | null
          bot_name: string
          content_unit_id?: string | null
          created_at: string
          id: string
          ip_address?: unknown
          organization_id?: string | null
          request_method?: string | null
          response_status?: number | null
          url: string
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string | null
          bot_name?: string
          content_unit_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          request_method?: string | null
          response_status?: number | null
          url?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      ai_chunks: {
        Row: {
          attribution: string | null
          chunk_order: number
          content_hash: string
          id: string
          is_public: boolean
          lang: string
          license: string | null
          published_at: string | null
          section_id: string
          text_md: string
          text_plain: string
          updated_at: string
        }
        Insert: {
          attribution?: string | null
          chunk_order: number
          content_hash: string
          id?: string
          is_public?: boolean
          lang: string
          license?: string | null
          published_at?: string | null
          section_id: string
          text_md: string
          text_plain: string
          updated_at?: string
        }
        Update: {
          attribution?: string | null
          chunk_order?: number
          content_hash?: string
          id?: string
          is_public?: boolean
          lang?: string
          license?: string | null
          published_at?: string | null
          section_id?: string
          text_md?: string
          text_plain?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chunks_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "ai_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_citations_items: {
        Row: {
          content_unit_id: string
          created_at: string
          fragment_hint: string | null
          id: string
          locale: string | null
          quoted_chars: number | null
          quoted_tokens: number | null
          response_id: string
          weight: number | null
        }
        Insert: {
          content_unit_id: string
          created_at?: string
          fragment_hint?: string | null
          id?: string
          locale?: string | null
          quoted_chars?: number | null
          quoted_tokens?: number | null
          response_id: string
          weight?: number | null
        }
        Update: {
          content_unit_id?: string
          created_at?: string
          fragment_hint?: string | null
          id?: string
          locale?: string | null
          quoted_chars?: number | null
          quoted_tokens?: number | null
          response_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_citations_items_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "ai_content_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_items_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "v_ai_content_units_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_items_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "view_ai_content_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_items_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "ai_citations_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_items_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "v_ai_citations_aggregates"
            referencedColumns: ["response_id"]
          },
          {
            foreignKeyName: "ai_citations_items_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "v_ai_response_groups_v2"
            referencedColumns: ["response_id"]
          },
        ]
      }
      ai_citations_responses: {
        Row: {
          completion_tokens: number | null
          created_at: string
          id: string
          model_name: string | null
          organization_id: string | null
          output_tokens: number | null
          prompt_tokens: number | null
          quoted_chars: number | null
          quoted_tokens: number | null
          request_id: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string
          id?: string
          model_name?: string | null
          organization_id?: string | null
          output_tokens?: number | null
          prompt_tokens?: number | null
          quoted_chars?: number | null
          quoted_tokens?: number | null
          request_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string
          id?: string
          model_name?: string | null
          organization_id?: string | null
          output_tokens?: number | null
          prompt_tokens?: number | null
          quoted_chars?: number | null
          quoted_tokens?: number | null
          request_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_ai_interview_session_metrics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "fk_acr_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_content_units: {
        Row: {
          content_hash: string | null
          content_type: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          jsonld_id: string | null
          last_updated: string | null
          organization_id: string | null
          structured_data_complete: boolean | null
          title: string | null
          url: string
        }
        Insert: {
          content_hash?: string | null
          content_type: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          jsonld_id?: string | null
          last_updated?: string | null
          organization_id?: string | null
          structured_data_complete?: boolean | null
          title?: string | null
          url: string
        }
        Update: {
          content_hash?: string | null
          content_type?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          jsonld_id?: string | null
          last_updated?: string | null
          organization_id?: string | null
          structured_data_complete?: boolean | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          flow_id: string | null
          id: string
          last_message_at: string | null
          mode: string
          org_id: string | null
          session_id: string | null
          started_at: string
          user_id: string | null
        }
        Insert: {
          flow_id?: string | null
          id?: string
          last_message_at?: string | null
          mode: string
          org_id?: string | null
          session_id?: string | null
          started_at?: string
          user_id?: string | null
        }
        Update: {
          flow_id?: string | null
          id?: string
          last_message_at?: string | null
          mode?: string
          org_id?: string | null
          session_id?: string | null
          started_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_disclosure_documents: {
        Row: {
          created_at: string
          created_by: string
          data_json: Json
          doc_type: string | null
          effective_date: string
          id: string
          pdf_object_path: string | null
          public_slug: string | null
          published_at: string | null
          published_by: string | null
          status: string
          summary_md: string
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by: string
          data_json?: Json
          doc_type?: string | null
          effective_date: string
          id?: string
          pdf_object_path?: string | null
          public_slug?: string | null
          published_at?: string | null
          published_by?: string | null
          status: string
          summary_md: string
          title: string
          updated_at?: string
          version: string
        }
        Update: {
          created_at?: string
          created_by?: string
          data_json?: Json
          doc_type?: string | null
          effective_date?: string
          id?: string
          pdf_object_path?: string | null
          public_slug?: string | null
          published_at?: string | null
          published_by?: string | null
          status?: string
          summary_md?: string
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      ai_exports: {
        Row: {
          created_at: string
          created_by: string | null
          export_type: string
          file_hash: string
          file_path: string
          format_version: string
          id: string
          params: Json | null
          total_items: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          export_type: string
          file_hash: string
          file_path: string
          format_version?: string
          id?: string
          params?: Json | null
          total_items: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          export_type?: string
          file_hash?: string
          file_path?: string
          format_version?: string
          id?: string
          params?: Json | null
          total_items?: number
        }
        Relationships: []
      }
      ai_feedback: {
        Row: {
          answer_id: string
          created_at: string
          id: string
          rating: number
          reason: string | null
        }
        Insert: {
          answer_id: string
          created_at?: string
          id?: string
          rating: number
          reason?: string | null
        }
        Update: {
          answer_id?: string
          created_at?: string
          id?: string
          rating?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "ai_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generated_drafts: {
        Row: {
          adopted: boolean
          content_html: string | null
          content_md: string | null
          created_at: string
          id: string
          quality_score: number | null
          session_id: string
        }
        Insert: {
          adopted?: boolean
          content_html?: string | null
          content_md?: string | null
          created_at?: string
          id?: string
          quality_score?: number | null
          session_id: string
        }
        Update: {
          adopted?: boolean
          content_html?: string | null
          content_md?: string | null
          created_at?: string
          id?: string
          quality_score?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generated_drafts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generated_drafts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_ai_interview_session_metrics"
            referencedColumns: ["session_id"]
          },
        ]
      }
      ai_hreflang: {
        Row: {
          canonical_url: string
          group_key: string
          id: string
          is_canonical: boolean
          lang: string
          org_id: string
          updated_at: string
        }
        Insert: {
          canonical_url: string
          group_key: string
          id?: string
          is_canonical?: boolean
          lang: string
          org_id: string
          updated_at?: string
        }
        Update: {
          canonical_url?: string
          group_key?: string
          id?: string
          is_canonical?: boolean
          lang?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_interview_axes: {
        Row: {
          code: string
          created_at: string
          description_en: string | null
          description_ja: string | null
          id: string
          is_active: boolean
          label_en: string | null
          label_ja: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description_en?: string | null
          description_ja?: string | null
          id?: string
          is_active?: boolean
          label_en?: string | null
          label_ja?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description_en?: string | null
          description_ja?: string | null
          id?: string
          is_active?: boolean
          label_en?: string | null
          label_ja?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ai_interview_messages: {
        Row: {
          content: Json
          created_at: string
          id: number
          role: string
          session_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: number
          role: string
          session_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: number
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_interview_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_ai_interview_session_metrics"
            referencedColumns: ["session_id"]
          },
        ]
      }
      ai_interview_question_logs: {
        Row: {
          asked_at: string
          id: string
          organization_id: string
          question_id: string | null
          session_id: string | null
          turn_index: number
        }
        Insert: {
          asked_at?: string
          id?: string
          organization_id: string
          question_id?: string | null
          session_id?: string | null
          turn_index: number
        }
        Update: {
          asked_at?: string
          id?: string
          organization_id?: string
          question_id?: string | null
          session_id?: string | null
          turn_index?: number
        }
        Relationships: []
      }
      ai_interview_questions: {
        Row: {
          axis_id: string
          content_type: Database["public"]["Enums"]["interview_content_type"]
          created_at: string
          id: string
          is_active: boolean
          keywords: string[] | null
          lang: string
          question_text: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          axis_id: string
          content_type: Database["public"]["Enums"]["interview_content_type"]
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          lang: string
          question_text: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          axis_id?: string
          content_type?: Database["public"]["Enums"]["interview_content_type"]
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          lang?: string
          question_text?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_interview_questions_axis_id_fkey"
            columns: ["axis_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_axes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_questions_axis_id_fkey"
            columns: ["axis_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_question_catalog_v1"
            referencedColumns: ["axis_id"]
          },
          {
            foreignKeyName: "ai_interview_questions_lang_fkey"
            columns: ["lang"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      ai_interview_sessions: {
        Row: {
          answers: Json
          content_type: Database["public"]["Enums"]["interview_content_type"]
          created_at: string
          created_by: string | null
          deleted_at: string | null
          finalized_at: string | null
          finalized_by: string | null
          generated_content: string | null
          generated_content_json: Json | null
          id: string
          meta: Json | null
          notes: string | null
          organization_id: string | null
          status: Database["public"]["Enums"]["interview_session_status"]
          updated_at: string
          user_id: string | null
          version: number
        }
        Insert: {
          answers?: Json
          content_type: Database["public"]["Enums"]["interview_content_type"]
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          generated_content?: string | null
          generated_content_json?: Json | null
          id?: string
          meta?: Json | null
          notes?: string | null
          organization_id?: string | null
          status?: Database["public"]["Enums"]["interview_session_status"]
          updated_at?: string
          user_id?: string | null
          version?: number
        }
        Update: {
          answers?: Json
          content_type?: Database["public"]["Enums"]["interview_content_type"]
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          generated_content?: string | null
          generated_content_json?: Json | null
          id?: string
          meta?: Json | null
          notes?: string | null
          organization_id?: string | null
          status?: Database["public"]["Enums"]["interview_session_status"]
          updated_at?: string
          user_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_interview_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_finalized_by_fkey"
            columns: ["finalized_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_jsonld_versions: {
        Row: {
          created_at: string
          effective_date: string | null
          id: string
          is_published: boolean
          jsonld: Json
          schema_types: string[]
          source_id: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          effective_date?: string | null
          id?: string
          is_published?: boolean
          jsonld: Json
          schema_types: string[]
          source_id: string
          updated_at?: string
          version: number
        }
        Update: {
          created_at?: string
          effective_date?: string | null
          id?: string
          is_published?: boolean
          jsonld?: Json
          schema_types?: string[]
          source_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_jsonld_versions_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "ai_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_manifest_settings: {
        Row: {
          api_base_url: string | null
          contact_email: string | null
          description: string | null
          display_name: string | null
          homepage_url: string | null
          logo_url: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          api_base_url?: string | null
          contact_email?: string | null
          description?: string | null
          display_name?: string | null
          homepage_url?: string | null
          logo_url?: string | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          api_base_url?: string | null
          contact_email?: string | null
          description?: string | null
          display_name?: string | null
          homepage_url?: string | null
          logo_url?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_manifest_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_manifest_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_manifest_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_manifest_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_manifest_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_manifest_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_manifest_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_manifest_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_manifest_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_manifest_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          citations: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          citations?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          citations?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_monthly_reports: {
        Row: {
          created_at: string
          id: string
          level: string
          metrics: Json
          month_bucket: string | null
          organization_id: string
          period_end: string
          period_start: string
          plan_id: string
          sections: Json
          status: Database["public"]["Enums"]["report_status"]
          suggestions: Json
          summary_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          metrics?: Json
          month_bucket?: string | null
          organization_id: string
          period_end: string
          period_start: string
          plan_id: string
          sections?: Json
          status?: Database["public"]["Enums"]["report_status"]
          suggestions?: Json
          summary_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          metrics?: Json
          month_bucket?: string | null
          organization_id?: string
          period_end?: string
          period_start?: string
          plan_id?: string
          sections?: Json
          status?: Database["public"]["Enums"]["report_status"]
          suggestions?: Json
          summary_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_queries: {
        Row: {
          created_at: string
          id: string
          ip_hash: string | null
          meta: Json | null
          org_id: string | null
          page_url: string | null
          query_text: string
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          meta?: Json | null
          org_id?: string | null
          page_url?: string | null
          query_text: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string | null
          meta?: Json | null
          org_id?: string | null
          page_url?: string | null
          query_text?: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_retrievals: {
        Row: {
          chunk_id: string
          created_at: string
          id: string
          method: string
          query_id: string
          rank: number
          score: number
        }
        Insert: {
          chunk_id: string
          created_at?: string
          id?: string
          method?: string
          query_id: string
          rank: number
          score: number
        }
        Update: {
          chunk_id?: string
          created_at?: string
          id?: string
          method?: string
          query_id?: string
          rank?: number
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_retrievals_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "ai_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_retrievals_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "ai_queries"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sections: {
        Row: {
          content_hash: string
          id: string
          is_public: boolean
          published_at: string | null
          section_anchor: string
          section_order: number
          source_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content_hash: string
          id?: string
          is_public?: boolean
          published_at?: string | null
          section_anchor: string
          section_order: number
          source_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content_hash?: string
          id?: string
          is_public?: boolean
          published_at?: string | null
          section_anchor?: string
          section_order?: number
          source_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sections_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "ai_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_site_url_rules: {
        Row: {
          active: boolean
          created_at: string
          id: string
          pattern: string
          priority: number
          replacement: string
          rule_type: string
          site_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          pattern: string
          priority?: number
          replacement: string
          rule_type?: string
          site_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          pattern?: string
          priority?: number
          replacement?: string
          rule_type?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_site_url_rules_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "ai_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sites: {
        Row: {
          allowed_domains: string[]
          branding: Json | null
          canonical_base_path: string
          created_at: string
          custom_domain_verified: boolean
          default_scheme: string
          force_trailing_slash: boolean
          hosted_domain_base: string
          id: string
          lang_default: string
          org_id: string
          org_slug: string | null
          ownership_proof: Json | null
          primary_domain: string | null
          robots_path: string | null
          site_mode: string
          sitemap_path: string | null
          strip_query_params: boolean
          updated_at: string
        }
        Insert: {
          allowed_domains?: string[]
          branding?: Json | null
          canonical_base_path?: string
          created_at?: string
          custom_domain_verified?: boolean
          default_scheme?: string
          force_trailing_slash?: boolean
          hosted_domain_base?: string
          id?: string
          lang_default?: string
          org_id: string
          org_slug?: string | null
          ownership_proof?: Json | null
          primary_domain?: string | null
          robots_path?: string | null
          site_mode?: string
          sitemap_path?: string | null
          strip_query_params?: boolean
          updated_at?: string
        }
        Update: {
          allowed_domains?: string[]
          branding?: Json | null
          canonical_base_path?: string
          created_at?: string
          custom_domain_verified?: boolean
          default_scheme?: string
          force_trailing_slash?: boolean
          hosted_domain_base?: string
          id?: string
          lang_default?: string
          org_id?: string
          org_slug?: string | null
          ownership_proof?: Json | null
          primary_domain?: string | null
          robots_path?: string | null
          site_mode?: string
          sitemap_path?: string | null
          strip_query_params?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ai_sources: {
        Row: {
          attribution: string | null
          canonical_url: string
          content_hash: string
          id: string
          is_public: boolean
          lang: string
          license: string | null
          org_id: string | null
          published_at: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          attribution?: string | null
          canonical_url: string
          content_hash: string
          id?: string
          is_public?: boolean
          lang: string
          license?: string | null
          org_id?: string | null
          published_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          attribution?: string | null
          canonical_url?: string
          content_hash?: string
          id?: string
          is_public?: boolean
          lang?: string
          license?: string | null
          org_id?: string | null
          published_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage_events: {
        Row: {
          created_by: string | null
          id: string
          month_bucket: string | null
          occurred_at: string
          organization_id: string
          usage_type: string
        }
        Insert: {
          created_by?: string | null
          id?: string
          month_bucket?: string | null
          occurred_at?: string
          organization_id: string
          usage_type: string
        }
        Update: {
          created_by?: string | null
          id?: string
          month_bucket?: string | null
          occurred_at?: string
          organization_id?: string
          usage_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_usage_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_usage_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_usage_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      ai_visibility_config: {
        Row: {
          allow_ccbot: boolean
          allow_googlebot: boolean
          allow_gptbot: boolean
          enabled: boolean
          id: number
          updated_at: string
        }
        Insert: {
          allow_ccbot?: boolean
          allow_googlebot?: boolean
          allow_gptbot?: boolean
          enabled?: boolean
          id?: number
          updated_at?: string
        }
        Update: {
          allow_ccbot?: boolean
          allow_googlebot?: boolean
          allow_gptbot?: boolean
          enabled?: boolean
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      ai_visibility_scores: {
        Row: {
          ai_access_score: number
          ai_bot_hits_count: number | null
          calculated_at: string | null
          calculation_period_end: string
          calculation_period_start: string
          content_unit_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          organization_id: string | null
          seo_performance_score: number
          structured_data_score: number
          total_visibility_score: number
          unique_bots_count: number | null
          url: string
        }
        Insert: {
          ai_access_score: number
          ai_bot_hits_count?: number | null
          calculated_at?: string | null
          calculation_period_end: string
          calculation_period_start: string
          content_unit_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          organization_id?: string | null
          seo_performance_score: number
          structured_data_score: number
          total_visibility_score: number
          unique_bots_count?: number | null
          url: string
        }
        Update: {
          ai_access_score?: number
          ai_bot_hits_count?: number | null
          calculated_at?: string | null
          calculation_period_end?: string
          calculation_period_start?: string
          content_unit_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          organization_id?: string | null
          seo_performance_score?: number
          structured_data_score?: number
          total_visibility_score?: number
          unique_bots_count?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_visibility_scores_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "ai_content_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_visibility_scores_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "v_ai_content_units_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_visibility_scores_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "view_ai_content_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      alert_events: {
        Row: {
          actual_value: string | null
          created_at: string | null
          details: Json | null
          event_key: string | null
          event_type: string
          id: string
          ip_address: unknown
          organization_id: string | null
          severity: string | null
          source_id: string | null
          source_table: string | null
          threshold_key: string | null
          threshold_value: string | null
        }
        Insert: {
          actual_value?: string | null
          created_at?: string | null
          details?: Json | null
          event_key?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          severity?: string | null
          source_id?: string | null
          source_table?: string | null
          threshold_key?: string | null
          threshold_value?: string | null
        }
        Update: {
          actual_value?: string | null
          created_at?: string | null
          details?: Json | null
          event_key?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          severity?: string | null
          source_id?: string | null
          source_table?: string | null
          threshold_key?: string | null
          threshold_value?: string | null
        }
        Relationships: []
      }
      alert_rules: {
        Row: {
          channel: string[]
          condition: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          severity: string
          updated_at: string
        }
        Insert: {
          channel?: string[]
          condition?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          severity: string
          updated_at?: string
        }
        Update: {
          channel?: string[]
          condition?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          severity?: string
          updated_at?: string
        }
        Relationships: []
      }
      alert_source_allowlist: {
        Row: {
          table_name: string
        }
        Insert: {
          table_name: string
        }
        Update: {
          table_name?: string
        }
        Relationships: []
      }
      alert_sources: {
        Row: {
          id: number
          source_table: string
          where_key: string
          where_sql: string
        }
        Insert: {
          id?: number
          source_table: string
          where_key: string
          where_sql: string
        }
        Update: {
          id?: number
          source_table?: string
          where_key?: string
          where_sql?: string
        }
        Relationships: []
      }
      alert_thresholds: {
        Row: {
          auto_block_enabled: boolean | null
          description: string | null
          id: string
          key: string
          notify_enabled: boolean | null
          per_type_hourly_cap: number | null
          updated_at: string | null
          value: string
        }
        Insert: {
          auto_block_enabled?: boolean | null
          description?: string | null
          id?: string
          key: string
          notify_enabled?: boolean | null
          per_type_hourly_cap?: number | null
          updated_at?: string | null
          value: string
        }
        Update: {
          auto_block_enabled?: boolean | null
          description?: string | null
          id?: string
          key?: string
          notify_enabled?: boolean | null
          per_type_hourly_cap?: number | null
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          created_at: string
          id: string
          payload: Json
          rule_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          rule_id?: string | null
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          rule_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          event_key: string
          feature_id: string | null
          id: string
          ip_address: unknown
          page_url: string | null
          properties: Json | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at: string
          event_key: string
          feature_id?: string | null
          id: string
          ip_address?: unknown
          page_url?: string | null
          properties?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_key?: string
          feature_id?: string | null
          id?: string
          ip_address?: unknown
          page_url?: string | null
          properties?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_feature_fk"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_registry"
            referencedColumns: ["feature_id"]
          },
          {
            foreignKeyName: "analytics_events_feature_fk"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events_202511: {
        Row: {
          created_at: string
          event_key: string
          feature_id: string | null
          id: string
          ip_address: unknown
          page_url: string | null
          properties: Json | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at: string
          event_key: string
          feature_id?: string | null
          id: string
          ip_address?: unknown
          page_url?: string | null
          properties?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_key?: string
          feature_id?: string | null
          id?: string
          ip_address?: unknown
          page_url?: string | null
          properties?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          partner_id: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          partner_id?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          partner_id?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_users_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_202412: {
        Row: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_202501: {
        Row: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_202502: {
        Row: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_202503: {
        Row: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_202504: {
        Row: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_202505: {
        Row: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_202506: {
        Row: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_202507: {
        Row: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_202508: {
        Row: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_202509: {
        Row: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_202510: {
        Row: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_202511: {
        Row: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_202512: {
        Row: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_202601: {
        Row: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_202602: {
        Row: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_202603: {
        Row: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          api_endpoint?: string | null
          at?: string | null
          before_state?: Json | null
          changed_fields?: string[] | null
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          old_data?: Json | null
          request_method?: string | null
          row_data?: Json | null
          session_id?: string | null
          table_name?: string
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_legacy_backup_20251204: {
        Row: {
          action: string
          after_state: Json | null
          at: string | null
          before_state: Json | null
          created_at: string | null
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          at?: string | null
          before_state?: Json | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          at?: string | null
          before_state?: Json | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      billing_checkout_link_activations: {
        Row: {
          activated_at: string | null
          activated_by: string
          activation_reason: string | null
          checkout_link_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          previous_active_link_id: string | null
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          activated_by: string
          activation_reason?: string | null
          checkout_link_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          previous_active_link_id?: string | null
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          activated_by?: string
          activation_reason?: string | null
          checkout_link_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          previous_active_link_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_checkout_link_activations_checkout_link_id_fkey"
            columns: ["checkout_link_id"]
            isOneToOne: false
            referencedRelation: "billing_checkout_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_checkout_link_activations_checkout_link_id_fkey"
            columns: ["checkout_link_id"]
            isOneToOne: false
            referencedRelation: "vw_campaign_details"
            referencedColumns: ["link_id"]
          },
          {
            foreignKeyName: "billing_checkout_link_activations_previous_active_link_id_fkey"
            columns: ["previous_active_link_id"]
            isOneToOne: false
            referencedRelation: "billing_checkout_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_checkout_link_activations_previous_active_link_id_fkey"
            columns: ["previous_active_link_id"]
            isOneToOne: false
            referencedRelation: "vw_campaign_details"
            referencedColumns: ["link_id"]
          },
        ]
      }
      billing_checkout_links: {
        Row: {
          campaign_type: string
          created_at: string
          created_by: string | null
          discount_rate: number | null
          end_at: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          label: string
          plan_type: string
          start_at: string | null
          stripe_checkout_url: string | null
          stripe_price_id: string
        }
        Insert: {
          campaign_type: string
          created_at?: string
          created_by?: string | null
          discount_rate?: number | null
          end_at?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          label: string
          plan_type: string
          start_at?: string | null
          stripe_checkout_url?: string | null
          stripe_price_id: string
        }
        Update: {
          campaign_type?: string
          created_at?: string
          created_by?: string | null
          discount_rate?: number | null
          end_at?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          label?: string
          plan_type?: string
          start_at?: string | null
          stripe_checkout_url?: string | null
          stripe_price_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_checkout_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_ips: {
        Row: {
          auto_blocked: boolean | null
          blocked_at: string | null
          blocked_by: string | null
          blocked_until: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_violation: string | null
          metadata: Json | null
          reason: string
          updated_at: string | null
          violation_count: number | null
        }
        Insert: {
          auto_blocked?: boolean | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          ip_address: unknown
          is_active?: boolean | null
          last_violation?: string | null
          metadata?: Json | null
          reason: string
          updated_at?: string | null
          violation_count?: number | null
        }
        Update: {
          auto_blocked?: boolean | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_violation?: string | null
          metadata?: Json | null
          reason?: string
          updated_at?: string | null
          violation_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_ips_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      cache_invalidation_queue: {
        Row: {
          created_at: string
          id: number
          lang: string | null
          last_error: string | null
          org_id: string | null
          path: string | null
          retry_count: number
          scope: string
          source_id: string | null
          source_table: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          lang?: string | null
          last_error?: string | null
          org_id?: string | null
          path?: string | null
          retry_count?: number
          scope: string
          source_id?: string | null
          source_table?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          lang?: string | null
          last_error?: string | null
          org_id?: string | null
          path?: string | null
          retry_count?: number
          scope?: string
          source_id?: string | null
          source_table?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      case_studies: {
        Row: {
          availability_note: string | null
          availability_status: string | null
          base_path: string | null
          challenge: string | null
          client_industry: string | null
          client_name: string | null
          client_size: string | null
          content: string | null
          content_hash: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          generation_source:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id: string
          images: string[] | null
          industry: string | null
          interview_session_id: string | null
          is_ai_generated: boolean
          is_anonymous: boolean | null
          is_published: boolean | null
          locale: string | null
          meta: Json | null
          metrics: Json | null
          organization_id: string
          outcome: string | null
          problem: string | null
          published_at: string | null
          published_date: string | null
          region_code: string | null
          result: string | null
          service_id: string | null
          slug: string | null
          solution: string | null
          source_urls: string[] | null
          status: string | null
          summary: string | null
          tags: string[] | null
          testimonial: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          url: string | null
          verification_source: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          availability_note?: string | null
          availability_status?: string | null
          base_path?: string | null
          challenge?: string | null
          client_industry?: string | null
          client_name?: string | null
          client_size?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string
          images?: string[] | null
          industry?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean
          is_anonymous?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          metrics?: Json | null
          organization_id: string
          outcome?: string | null
          problem?: string | null
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          result?: string | null
          service_id?: string | null
          slug?: string | null
          solution?: string | null
          source_urls?: string[] | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          testimonial?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          availability_note?: string | null
          availability_status?: string | null
          base_path?: string | null
          challenge?: string | null
          client_industry?: string | null
          client_name?: string | null
          client_size?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string
          images?: string[] | null
          industry?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean
          is_anonymous?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          metrics?: Json | null
          organization_id?: string
          outcome?: string | null
          problem?: string | null
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          result?: string | null
          service_id?: string | null
          slug?: string | null
          solution?: string | null
          source_urls?: string[] | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          testimonial?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_studies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "v_ai_interview_session_metrics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services_jsonld"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "view_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      case_study_translations: {
        Row: {
          case_study_id: string
          content: string | null
          content_hash: string | null
          is_primary: boolean
          lang: string
          summary: string | null
          title: string | null
        }
        Insert: {
          case_study_id: string
          content?: string | null
          content_hash?: string | null
          is_primary?: boolean
          lang: string
          summary?: string | null
          title?: string | null
        }
        Update: {
          case_study_id?: string
          content?: string | null
          content_hash?: string | null
          is_primary?: boolean
          lang?: string
          summary?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_study_translations_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_translations_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_translations_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies_public_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_translations_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "public_case_studies_jsonld"
            referencedColumns: ["case_study_id"]
          },
          {
            foreignKeyName: "case_study_translations_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "v_case_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_translations_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_case_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_translations_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_case_studies_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_translations_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "view_case_studies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_study_translations_lang_fkey"
            columns: ["lang"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      chatbot_interactions: {
        Row: {
          answer_text: string
          bot_id: string
          created_at: string
          deleted_at: string | null
          id: string
          metadata: Json | null
          organization_id: string
          page_url: string | null
          question_text: string
          user_id: string | null
          user_session_id: string | null
        }
        Insert: {
          answer_text: string
          bot_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          page_url?: string | null
          question_text: string
          user_id?: string | null
          user_session_id?: string | null
        }
        Update: {
          answer_text?: string
          bot_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          page_url?: string | null
          question_text?: string
          user_id?: string | null
          user_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_interactions_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "view_chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "chatbot_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbots: {
        Row: {
          bot_type: string
          created_at: string
          created_by: string | null
          default_language: string
          deleted_at: string | null
          display_name: string
          id: string
          organization_id: string | null
          settings: Json
          status: string
          updated_at: string
        }
        Insert: {
          bot_type: string
          created_at?: string
          created_by?: string | null
          default_language?: string
          deleted_at?: string | null
          display_name: string
          id?: string
          organization_id?: string | null
          settings?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          bot_type?: string
          created_at?: string
          created_by?: string | null
          default_language?: string
          deleted_at?: string | null
          display_name?: string
          id?: string
          organization_id?: string | null
          settings?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      cms_assets: {
        Row: {
          alt: string | null
          created_at: string | null
          file_path: string | null
          height: number | null
          id: string
          meta: Json | null
          width: number | null
        }
        Insert: {
          alt?: string | null
          created_at?: string | null
          file_path?: string | null
          height?: number | null
          id?: string
          meta?: Json | null
          width?: number | null
        }
        Update: {
          alt?: string | null
          created_at?: string | null
          file_path?: string | null
          height?: number | null
          id?: string
          meta?: Json | null
          width?: number | null
        }
        Relationships: []
      }
      cms_sections: {
        Row: {
          id: string
          is_published: boolean | null
          slug: string | null
          sort_order: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          is_published?: boolean | null
          slug?: string | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          is_published?: boolean | null
          slug?: string | null
          sort_order?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_site_settings: {
        Row: {
          created_at: string
          deleted_at: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          logo_url: string | null
          organization_id: string
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          theme_color: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          logo_url?: string | null
          organization_id: string
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          logo_url?: string | null
          organization_id?: string
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string
          created_by: string
          deleted_at: string | null
          id: string
          task_id: string
          tenant_id: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          id?: string
          task_id: string
          tenant_id: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          id?: string
          task_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_tasks"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_task_comments"
            referencedColumns: ["task_id"]
          },
        ]
      }
      consent_records: {
        Row: {
          consent_key: string
          created_at: string
          granted: boolean
          granted_at: string | null
          id: string
          org_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          consent_key: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          org_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          consent_key?: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          org_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_refresh_queue: {
        Row: {
          content_version: number
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          meta: Json | null
          status: string
          trigger_source: string
          updated_at: string | null
        }
        Insert: {
          content_version: number
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          meta?: Json | null
          status?: string
          trigger_source: string
          updated_at?: string | null
        }
        Update: {
          content_version?: number
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          meta?: Json | null
          status?: string
          trigger_source?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contract_violations: {
        Row: {
          actor: string | null
          column_name: string
          context: Json | null
          contract: string
          created_at: string
          detail: Json
          endpoint: string
          error_code: string | null
          error_message: string | null
          function_name: string | null
          git_commit_hash: string | null
          id: string
          occurred_at: string
          payload: Json | null
          request_id: string
          resource: string | null
          session_id: string | null
          severity: string
          source: string
          table_name: string
          user_id: string | null
          violation_type: Database["public"]["Enums"]["contract_violation_type"]
        }
        Insert: {
          actor?: string | null
          column_name: string
          context?: Json | null
          contract: string
          created_at?: string
          detail?: Json
          endpoint: string
          error_code?: string | null
          error_message?: string | null
          function_name?: string | null
          git_commit_hash?: string | null
          id?: string
          occurred_at?: string
          payload?: Json | null
          request_id: string
          resource?: string | null
          session_id?: string | null
          severity?: string
          source: string
          table_name: string
          user_id?: string | null
          violation_type: Database["public"]["Enums"]["contract_violation_type"]
        }
        Update: {
          actor?: string | null
          column_name?: string
          context?: Json | null
          contract?: string
          created_at?: string
          detail?: Json
          endpoint?: string
          error_code?: string | null
          error_message?: string | null
          function_name?: string | null
          git_commit_hash?: string | null
          id?: string
          occurred_at?: string
          payload?: Json | null
          request_id?: string
          resource?: string | null
          session_id?: string | null
          severity?: string
          source?: string
          table_name?: string
          user_id?: string | null
          violation_type?: Database["public"]["Enums"]["contract_violation_type"]
        }
        Relationships: []
      }
      crawler_policies: {
        Row: {
          created_at: string
          created_by: string | null
          effective_from: string
          effective_to: string | null
          id: string
          policy_json: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          policy_json: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          policy_json?: Json
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      db_contracts_required: {
        Row: {
          created_at: string
          description: string | null
          key: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      design_versions: {
        Row: {
          created_at: string
          design_id: string
          id: string
          payload: Json
          status: string
          version: number
        }
        Insert: {
          created_at?: string
          design_id: string
          id?: string
          payload: Json
          status: string
          version: number
        }
        Update: {
          created_at?: string
          design_id?: string
          id?: string
          payload?: Json
          status?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "design_versions_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "designs"
            referencedColumns: ["id"]
          },
        ]
      }
      designs: {
        Row: {
          created_at: string
          id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      embedding_jobs: {
        Row: {
          batch_id: string | null
          chunk_count: number
          chunk_strategy: string
          completed_at: string | null
          content_hash: string
          content_text: string
          created_at: string
          embedding_model: string
          error_message: string | null
          id: string
          idempotency_key: string | null
          max_retries: number
          organization_id: string | null
          priority: number
          retry_count: number
          scheduled_at: string
          source_field: string
          source_id: string
          source_table: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          chunk_count?: number
          chunk_strategy?: string
          completed_at?: string | null
          content_hash: string
          content_text: string
          created_at?: string
          embedding_model?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          max_retries?: number
          organization_id?: string | null
          priority?: number
          retry_count?: number
          scheduled_at?: string
          source_field: string
          source_id: string
          source_table: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          chunk_count?: number
          chunk_strategy?: string
          completed_at?: string | null
          content_hash?: string
          content_text?: string
          created_at?: string
          embedding_model?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          max_retries?: number
          organization_id?: string | null
          priority?: number
          retry_count?: number
          scheduled_at?: string
          source_field?: string
          source_id?: string
          source_table?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "embedding_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "embedding_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embedding_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "embedding_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embedding_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embedding_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embedding_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embedding_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "embedding_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embedding_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      embeddings: {
        Row: {
          chunk_index: number
          chunk_text: string
          content_hash: string
          created_at: string
          embedding: string | null
          embedding_model: string
          id: string
          is_active: boolean
          lang: string | null
          organization_id: string | null
          source_field: string
          source_id: string
          source_table: string
          updated_at: string
        }
        Insert: {
          chunk_index?: number
          chunk_text: string
          content_hash: string
          created_at?: string
          embedding?: string | null
          embedding_model?: string
          id?: string
          is_active?: boolean
          lang?: string | null
          organization_id?: string | null
          source_field: string
          source_id: string
          source_table: string
          updated_at?: string
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          content_hash?: string
          created_at?: string
          embedding?: string | null
          embedding_model?: string
          id?: string
          is_active?: boolean
          lang?: string | null
          organization_id?: string | null
          source_field?: string
          source_id?: string
          source_table?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "embeddings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embeddings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "embeddings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embeddings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embeddings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embeddings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embeddings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "embeddings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embeddings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      enforcement_actions: {
        Row: {
          action: string
          created_at: string | null
          deadline: string | null
          details: Json | null
          id: string
          processed_at: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          deadline?: string | null
          details?: Json | null
          id?: string
          processed_at?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          deadline?: string | null
          details?: Json | null
          id?: string
          processed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enforcement_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_moderation_overview_v2"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "enforcement_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_overview_v2"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "enforcement_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enforcement_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_violation_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      enforcement_audit: {
        Row: {
          action: string
          details: Json | null
          id: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enforcement_audit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_moderation_overview_v2"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "enforcement_audit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_overview_v2"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "enforcement_audit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enforcement_audit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_violation_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      faq_translations: {
        Row: {
          answer: string | null
          answer_plain: string | null
          content_hash: string | null
          faq_id: string
          is_primary: boolean
          lang: string
          question: string | null
        }
        Insert: {
          answer?: string | null
          answer_plain?: string | null
          content_hash?: string | null
          faq_id: string
          is_primary?: boolean
          lang: string
          question?: string | null
        }
        Update: {
          answer?: string | null
          answer_plain?: string | null
          content_hash?: string | null
          faq_id?: string
          is_primary?: boolean
          lang?: string
          question?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faq_translations_faq_id_fkey"
            columns: ["faq_id"]
            isOneToOne: false
            referencedRelation: "faqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faq_translations_faq_id_fkey"
            columns: ["faq_id"]
            isOneToOne: false
            referencedRelation: "public_faqs_jsonld"
            referencedColumns: ["faq_id"]
          },
          {
            foreignKeyName: "faq_translations_faq_id_fkey"
            columns: ["faq_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_faqs_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faq_translations_faq_id_fkey"
            columns: ["faq_id"]
            isOneToOne: false
            referencedRelation: "v_faqs_published"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faq_translations_faq_id_fkey"
            columns: ["faq_id"]
            isOneToOne: false
            referencedRelation: "v_faqs_published_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faq_translations_faq_id_fkey"
            columns: ["faq_id"]
            isOneToOne: false
            referencedRelation: "view_faqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faq_translations_lang_fkey"
            columns: ["lang"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          base_path: string | null
          category: string | null
          content_hash: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string
          created_by: string
          deleted_at: string | null
          display_order: number | null
          generation_source:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id: string
          interview_session_id: string | null
          is_ai_generated: boolean
          is_published: boolean
          locale: string | null
          meta: Json | null
          order_index: number | null
          organization_id: string
          published_at: string | null
          question: string
          region_code: string | null
          service_id: string | null
          slug: string | null
          sort_order: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          answer: string
          base_path?: string | null
          category?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          display_order?: number | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string
          interview_session_id?: string | null
          is_ai_generated?: boolean
          is_published?: boolean
          locale?: string | null
          meta?: Json | null
          order_index?: number | null
          organization_id: string
          published_at?: string | null
          question: string
          region_code?: string | null
          service_id?: string | null
          slug?: string | null
          sort_order?: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          answer?: string
          base_path?: string | null
          category?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          display_order?: number | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string
          interview_session_id?: string | null
          is_ai_generated?: boolean
          is_published?: boolean
          locale?: string | null
          meta?: Json | null
          order_index?: number | null
          organization_id?: string
          published_at?: string | null
          question?: string
          region_code?: string | null
          service_id?: string | null
          slug?: string | null
          sort_order?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faqs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "v_ai_interview_session_metrics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services_jsonld"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "view_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          expires_at: string | null
          feature_id: string
          override_config: Json | null
          override_is_enabled: boolean | null
          subject_id: string
          subject_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          feature_id: string
          override_config?: Json | null
          override_is_enabled?: boolean | null
          subject_id: string
          subject_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          feature_id?: string
          override_config?: Json | null
          override_is_enabled?: boolean | null
          subject_id?: string
          subject_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_feature_fk"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_registry"
            referencedColumns: ["feature_id"]
          },
          {
            foreignKeyName: "feature_flags_feature_fk"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_limits: {
        Row: {
          feature_id: string
          monthly_limit: number | null
          plan_id: string
        }
        Insert: {
          feature_id: string
          monthly_limit?: number | null
          plan_id: string
        }
        Update: {
          feature_id?: string
          monthly_limit?: number | null
          plan_id?: string
        }
        Relationships: []
      }
      feature_limits_v2: {
        Row: {
          created_at: string
          feature_id: string
          limit_key: string
          limit_value: number
          period: string
          plan_id: string
          reset_day: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          feature_id: string
          limit_key: string
          limit_value: number
          period: string
          plan_id: string
          reset_day?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          feature_id?: string
          limit_key?: string
          limit_value?: number
          period?: string
          plan_id?: string
          reset_day?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_limits_v2_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_registry"
            referencedColumns: ["feature_id"]
          },
          {
            foreignKeyName: "feature_limits_v2_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_limits_v2_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_limits_v2_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "v_plan_catalog"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "feature_limits_v2_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "v_plan_catalog_v1"
            referencedColumns: ["plan_id"]
          },
        ]
      }
      feature_overrides: {
        Row: {
          created_at: string | null
          expires_at: string | null
          feature_key: string
          id: string
          subject_id: string
          subject_type: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          feature_key: string
          id?: string
          subject_id: string
          subject_type?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          feature_key?: string
          id?: string
          subject_id?: string
          subject_type?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      feature_usage_counters: {
        Row: {
          created_at: string
          feature_id: string
          limit_key: string
          period_end: string
          period_start: string
          subject_id: string
          subject_type: string
          updated_at: string
          used: number
        }
        Insert: {
          created_at?: string
          feature_id: string
          limit_key: string
          period_end: string
          period_start: string
          subject_id: string
          subject_type: string
          updated_at?: string
          used?: number
        }
        Update: {
          created_at?: string
          feature_id?: string
          limit_key?: string
          period_end?: string
          period_start?: string
          subject_id?: string
          subject_type?: string
          updated_at?: string
          used?: number
        }
        Relationships: []
      }
      features: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          key: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      file_metadata: {
        Row: {
          bucket_id: string
          created_at: string
          created_by: string | null
          display_name: string | null
          id: string
          language_code: string
          metadata: Json
          object_id: string | null
          object_path: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          id?: string
          language_code: string
          metadata?: Json
          object_id?: string | null
          object_path: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          id?: string
          language_code?: string
          metadata?: Json
          object_id?: string | null
          object_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      file_scans: {
        Row: {
          bucket: string
          created_at: string | null
          detail: string | null
          engine: string | null
          path: string
          scan_status: string
          scanned_at: string | null
          updated_at: string | null
        }
        Insert: {
          bucket: string
          created_at?: string | null
          detail?: string | null
          engine?: string | null
          path: string
          scan_status: string
          scanned_at?: string | null
          updated_at?: string | null
        }
        Update: {
          bucket?: string
          created_at?: string | null
          detail?: string | null
          engine?: string | null
          path?: string
          scan_status?: string
          scanned_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          created_at: string
          error_code: string | null
          error_message: string | null
          function_name: string
          id: string
          key: string
          last_attempt_at: string | null
          request_hash: string | null
          response: Json | null
          retries: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          function_name: string
          id?: string
          key: string
          last_attempt_at?: string | null
          request_hash?: string | null
          response?: Json | null
          retries?: number
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          function_name?: string
          id?: string
          key?: string
          last_attempt_at?: string | null
          request_hash?: string | null
          response?: Json | null
          retries?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      intrusion_detection_alerts: {
        Row: {
          alert_level: string
          attack_vector: string | null
          auto_actions_taken: Json | null
          created_at: string | null
          evidence: Json | null
          id: string
          is_false_positive: boolean | null
          is_resolved: boolean | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          risk_score: number | null
          rule_id: string
          source_ip: unknown
          target_resource: string | null
        }
        Insert: {
          alert_level: string
          attack_vector?: string | null
          auto_actions_taken?: Json | null
          created_at?: string | null
          evidence?: Json | null
          id?: string
          is_false_positive?: boolean | null
          is_resolved?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number | null
          rule_id: string
          source_ip: unknown
          target_resource?: string | null
        }
        Update: {
          alert_level?: string
          attack_vector?: string | null
          auto_actions_taken?: Json | null
          created_at?: string | null
          evidence?: Json | null
          id?: string
          is_false_positive?: boolean | null
          is_resolved?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number | null
          rule_id?: string
          source_ip?: unknown
          target_resource?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intrusion_detection_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intrusion_detection_alerts_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "intrusion_detection_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      intrusion_detection_rules: {
        Row: {
          alert_enabled: boolean | null
          auto_block: boolean | null
          condition_sql: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          remediation_action: string | null
          rule_category: string
          rule_name: string
          rule_type: string
          severity: string
          threshold_count: number | null
          threshold_window_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          alert_enabled?: boolean | null
          auto_block?: boolean | null
          condition_sql: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          remediation_action?: string | null
          rule_category: string
          rule_name: string
          rule_type: string
          severity?: string
          threshold_count?: number | null
          threshold_window_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          alert_enabled?: boolean | null
          auto_block?: boolean | null
          condition_sql?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          remediation_action?: string | null
          rule_category?: string
          rule_name?: string
          rule_type?: string
          severity?: string
          threshold_count?: number | null
          threshold_window_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intrusion_detection_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_blocklist: {
        Row: {
          cidr_range: unknown
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          is_permanent: boolean | null
          reason: string
          severity: string | null
          updated_at: string | null
        }
        Insert: {
          cidr_range?: unknown
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address: unknown
          is_permanent?: boolean | null
          reason: string
          severity?: string | null
          updated_at?: string | null
        }
        Update: {
          cidr_range?: unknown
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_permanent?: boolean | null
          reason?: string
          severity?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_blocklist_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_report_actions: {
        Row: {
          action_type: string
          actor_id: string
          created_at: string
          id: string
          note: string | null
          report_id: string
        }
        Insert: {
          action_type: string
          actor_id: string
          created_at?: string
          id?: string
          note?: string | null
          report_id: string
        }
        Update: {
          action_type?: string
          actor_id?: string
          created_at?: string
          id?: string
          note?: string | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ip_report_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "ip_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_reports: {
        Row: {
          anonymization_note: string | null
          content_url: string | null
          created_at: string
          description: string | null
          evidence_urls: string[] | null
          id: string
          reporter_contact: Json
          retention_expires_at: string | null
          status: string
          type: string
        }
        Insert: {
          anonymization_note?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reporter_contact: Json
          retention_expires_at?: string | null
          status?: string
          type: string
        }
        Update: {
          anonymization_note?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          reporter_contact?: Json
          retention_expires_at?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      job_runs: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          job_name: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          job_name: string
          status: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          job_name?: string
          status?: string
        }
        Relationships: []
      }
      job_runs_v2: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_code: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          idempotency_key: string | null
          job_name: string
          meta: Json | null
          parent_job_id: string | null
          request_id: string | null
          retry_count: number
          scheduled_at: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          job_name: string
          meta?: Json | null
          parent_job_id?: string | null
          request_id?: string | null
          retry_count?: number
          scheduled_at?: string | null
          started_at?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          job_name?: string
          meta?: Json | null
          parent_job_id?: string | null
          request_id?: string | null
          retry_count?: number
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          created_at: string
          file_key: string
          id: string
          mime_type: string | null
          owner_id: string
        }
        Insert: {
          created_at?: string
          file_key: string
          id?: string
          mime_type?: string | null
          owner_id: string
        }
        Update: {
          created_at?: string
          file_key?: string
          id?: string
          mime_type?: string | null
          owner_id?: string
        }
        Relationships: []
      }
      monthly_report_jobs: {
        Row: {
          attempts: number
          created_at: string
          finished_at: string | null
          id: string
          idempotency_key: string | null
          last_error: string | null
          meta: Json | null
          organization_id: string
          report_id: string | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          meta?: Json | null
          organization_id: string
          report_id?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          meta?: Json | null
          organization_id?: string
          report_id?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_report_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "monthly_report_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_report_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "monthly_report_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_report_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_report_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_report_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_report_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "monthly_report_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_report_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "monthly_report_jobs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "ai_monthly_reports_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_report_jobs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "monthly_reports_legacy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_report_jobs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "view_monthly_report_basics"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_report_sections: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          report_id: string
          section_key: string
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          report_id: string
          section_key: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          report_id?: string
          section_key?: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_report_sections_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "ai_monthly_reports_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_report_sections_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "monthly_reports_legacy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_report_sections_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "view_monthly_report_basics"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_reports_legacy: {
        Row: {
          created_at: string
          id: string
          metrics: Json
          month_bucket: string | null
          organization_id: string
          period_end: string
          period_start: string
          status: string
          summary_text: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metrics?: Json
          month_bucket?: string | null
          organization_id: string
          period_end: string
          period_start: string
          status?: string
          summary_text?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metrics?: Json
          month_bucket?: string | null
          organization_id?: string
          period_end?: string
          period_start?: string
          status?: string
          summary_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      news: {
        Row: {
          base_path: string | null
          category: string | null
          content: string | null
          content_hash: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_published: boolean | null
          locale: string | null
          meta: Json | null
          organization_id: string
          published_at: string | null
          published_date: string | null
          region_code: string | null
          slug: string | null
          status: Database["public"]["Enums"]["cms_content_status"] | null
          summary: string | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          base_path?: string | null
          category?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          organization_id: string
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          summary?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          base_path?: string | null
          category?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          organization_id?: string
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      news_translations: {
        Row: {
          content: string | null
          content_hash: string | null
          is_primary: boolean
          lang: string
          news_id: string
          summary: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          content_hash?: string | null
          is_primary?: boolean
          lang: string
          news_id: string
          summary?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
          content_hash?: string | null
          is_primary?: boolean
          lang?: string
          news_id?: string
          summary?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_translations_lang_fkey"
            columns: ["lang"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "news_translations_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_translations_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_translations_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news_public_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_translations_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "public_news_jsonld"
            referencedColumns: ["news_id"]
          },
          {
            foreignKeyName: "news_translations_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "v_news"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_translations_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "view_news"
            referencedColumns: ["id"]
          },
        ]
      }
      object_prefixes: {
        Row: {
          bucket_id: string
          object_count: number
          prefix: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          object_count?: number
          prefix: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          object_count?: number
          prefix?: string
          updated_at?: string
        }
        Relationships: []
      }
      ops_audit: {
        Row: {
          action: string
          actor: string | null
          created_at: string | null
          details: Json | null
          id: number
          target: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string | null
          details?: Json | null
          id?: never
          target?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string | null
          details?: Json | null
          id?: never
          target?: string | null
        }
        Relationships: []
      }
      ops_audit_simple: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          endpoint: string | null
          entity_ids: string[] | null
          entity_kind: string | null
          error_summary: string | null
          id: number
          reason: string | null
          request_id: string | null
          scope: string | null
          status: string | null
          title: string | null
          user_agent: string | null
        }
        Insert: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          endpoint?: string | null
          entity_ids?: string[] | null
          entity_kind?: string | null
          error_summary?: string | null
          id?: number
          reason?: string | null
          request_id?: string | null
          scope?: string | null
          status?: string | null
          title?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          endpoint?: string | null
          entity_ids?: string[] | null
          entity_kind?: string | null
          error_summary?: string | null
          id?: number
          reason?: string | null
          request_id?: string | null
          scope?: string | null
          status?: string | null
          title?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          quantity: number
          sku: string
          unit_price_cents: number
        }
        Insert: {
          id?: string
          order_id: string
          quantity?: number
          sku: string
          unit_price_cents?: number
        }
        Update: {
          id?: string
          order_id?: string
          quantity?: number
          sku?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          id: string
          organization_id: string
          status: string
          total_amount_cents: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          organization_id: string
          status?: string
          total_amount_cents?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          organization_id?: string
          status?: string
          total_amount_cents?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      org_group_invites: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          group_id: string
          id: string
          max_uses: number | null
          note: string | null
          revoked_at: string | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          group_id: string
          id?: string
          max_uses?: number | null
          note?: string | null
          revoked_at?: string | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          group_id?: string
          id?: string
          max_uses?: number | null
          note?: string | null
          revoked_at?: string | null
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "org_group_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_group_invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "org_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      org_group_join_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          group_id: string
          id: string
          invite_code: string | null
          organization_id: string
          reason: string | null
          requested_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          group_id: string
          id?: string
          invite_code?: string | null
          organization_id: string
          reason?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          group_id?: string
          id?: string
          invite_code?: string | null
          organization_id?: string
          reason?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_group_join_requests_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_group_join_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "org_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_group_join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_group_join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_group_join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "org_group_join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_group_join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_group_join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_group_join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_group_join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "org_group_join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_group_join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "org_group_join_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      org_group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          organization_id: string
          role: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          organization_id: string
          role?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          organization_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "org_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      org_groups: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          owner_organization_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          owner_organization_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          owner_organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_groups_owner_org_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_groups_owner_org_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_groups_owner_org_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "org_groups_owner_org_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_groups_owner_org_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_groups_owner_org_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_groups_owner_org_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_groups_owner_org_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "org_groups_owner_org_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_groups_owner_org_fkey"
            columns: ["owner_organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      org_memberships: {
        Row: {
          id: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          id?: string
          role: string
          tenant_id: string
          user_id: string
        }
        Update: {
          id?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      org_roles: {
        Row: {
          id: string
          role: string
          tenant_id: string
        }
        Insert: {
          id?: string
          role: string
          tenant_id: string
        }
        Update: {
          id?: string
          role?: string
          tenant_id?: string
        }
        Relationships: []
      }
      organization_addons: {
        Row: {
          addon_code: string
          amount: number
          id: string
          metadata: Json | null
          organization_id: string
          purchased_at: string
        }
        Insert: {
          addon_code: string
          amount: number
          id?: string
          metadata?: Json | null
          organization_id: string
          purchased_at?: string
        }
        Update: {
          addon_code?: string
          amount?: number
          id?: string
          metadata?: Json | null
          organization_id?: string
          purchased_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_addons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "organization_addons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_addons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_addons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_addons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_addons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_addons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_addons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_addons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_addons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organization_ai_usage: {
        Row: {
          id: string
          model_breakdown: Json | null
          organization_id: string
          period_end: string
          period_start: string
          token_quota: number
          token_used: number
          updated_at: string
        }
        Insert: {
          id?: string
          model_breakdown?: Json | null
          organization_id: string
          period_end: string
          period_start: string
          token_quota: number
          token_used?: number
          updated_at?: string
        }
        Update: {
          id?: string
          model_breakdown?: Json | null
          organization_id?: string
          period_end?: string
          period_start?: string
          token_quota?: number
          token_used?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_ai_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "organization_ai_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_ai_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_ai_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_ai_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_ai_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_ai_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_ai_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_ai_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_ai_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organization_keywords: {
        Row: {
          content_hash: string | null
          created_at: string
          id: string
          is_active: boolean
          keyword: string
          locale: string | null
          organization_id: string
          priority: number
          updated_at: string
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          keyword: string
          locale?: string | null
          organization_id: string
          priority?: number
          updated_at?: string
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          keyword?: string
          locale?: string | null
          organization_id?: string
          priority?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_keywords_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "organization_keywords_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "organization_keywords_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_keywords_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_keywords_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_keywords_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_keywords_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_keywords_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_keywords_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_keywords_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_keywords_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_members_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_verifications: {
        Row: {
          external_reference: string | null
          metadata: Json | null
          organization_id: string
          risk_score: number | null
          updated_at: string
          verified: boolean
          verified_at: string | null
          verified_method: string
        }
        Insert: {
          external_reference?: string | null
          metadata?: Json | null
          organization_id: string
          risk_score?: number | null
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_method: string
        }
        Update: {
          external_reference?: string | null
          metadata?: Json | null
          organization_id?: string
          risk_score?: number | null
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_verifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "organization_verifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_verifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_verifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_verifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_verifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_verifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_verifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_verifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_verifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          address_country: string | null
          address_locality: string | null
          address_postal_code: string | null
          address_region: string | null
          address_street: string | null
          archived: boolean
          availability_note: string | null
          availability_status: string | null
          capital: number | null
          city: string | null
          contact_email: string
          content_hash: string | null
          corporate_number: string | null
          corporate_type: string | null
          country: string | null
          created_at: string
          created_by: string | null
          data_status: Database["public"]["Enums"]["organization_data_status"]
          default_locale: string | null
          deleted_at: string | null
          description: string | null
          discount_group: string | null
          email: string | null
          email_public: boolean | null
          employees: number | null
          entitlements: Json | null
          established_at: string | null
          feature_flags: Json | null
          id: string
          industries: string[] | null
          is_published: boolean
          lat: number | null
          legal_form: string | null
          lng: number | null
          logo_url: string | null
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          name: string
          original_signup_campaign: string | null
          partner_id: string | null
          phone: string | null
          plan: string | null
          plan_id: string
          postal_code: string | null
          prefecture: string | null
          region_code: string | null
          representative_name: string | null
          same_as: string[] | null
          show_case_studies: boolean | null
          show_contact: boolean | null
          show_faqs: boolean | null
          show_news: boolean | null
          show_partnership: boolean | null
          show_posts: boolean | null
          show_products: boolean | null
          show_qa: boolean | null
          show_services: boolean | null
          slug: string
          source_urls: string[] | null
          status: Database["public"]["Enums"]["organization_status"]
          street_address: string | null
          telephone: string | null
          trial_end: string | null
          updated_at: string | null
          url: string | null
          user_id: string
          verification_source: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          address_country?: string | null
          address_locality?: string | null
          address_postal_code?: string | null
          address_region?: string | null
          address_street?: string | null
          archived?: boolean
          availability_note?: string | null
          availability_status?: string | null
          capital?: number | null
          city?: string | null
          contact_email?: string
          content_hash?: string | null
          corporate_number?: string | null
          corporate_type?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          data_status?: Database["public"]["Enums"]["organization_data_status"]
          default_locale?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_group?: string | null
          email?: string | null
          email_public?: boolean | null
          employees?: number | null
          entitlements?: Json | null
          established_at?: string | null
          feature_flags?: Json | null
          id?: string
          industries?: string[] | null
          is_published?: boolean
          lat?: number | null
          legal_form?: string | null
          lng?: number | null
          logo_url?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          name: string
          original_signup_campaign?: string | null
          partner_id?: string | null
          phone?: string | null
          plan?: string | null
          plan_id?: string
          postal_code?: string | null
          prefecture?: string | null
          region_code?: string | null
          representative_name?: string | null
          same_as?: string[] | null
          show_case_studies?: boolean | null
          show_contact?: boolean | null
          show_faqs?: boolean | null
          show_news?: boolean | null
          show_partnership?: boolean | null
          show_posts?: boolean | null
          show_products?: boolean | null
          show_qa?: boolean | null
          show_services?: boolean | null
          slug: string
          source_urls?: string[] | null
          status?: Database["public"]["Enums"]["organization_status"]
          street_address?: string | null
          telephone?: string | null
          trial_end?: string | null
          updated_at?: string | null
          url?: string | null
          user_id: string
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          address_country?: string | null
          address_locality?: string | null
          address_postal_code?: string | null
          address_region?: string | null
          address_street?: string | null
          archived?: boolean
          availability_note?: string | null
          availability_status?: string | null
          capital?: number | null
          city?: string | null
          contact_email?: string
          content_hash?: string | null
          corporate_number?: string | null
          corporate_type?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          data_status?: Database["public"]["Enums"]["organization_data_status"]
          default_locale?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_group?: string | null
          email?: string | null
          email_public?: boolean | null
          employees?: number | null
          entitlements?: Json | null
          established_at?: string | null
          feature_flags?: Json | null
          id?: string
          industries?: string[] | null
          is_published?: boolean
          lat?: number | null
          legal_form?: string | null
          lng?: number | null
          logo_url?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          name?: string
          original_signup_campaign?: string | null
          partner_id?: string | null
          phone?: string | null
          plan?: string | null
          plan_id?: string
          postal_code?: string | null
          prefecture?: string | null
          region_code?: string | null
          representative_name?: string | null
          same_as?: string[] | null
          show_case_studies?: boolean | null
          show_contact?: boolean | null
          show_faqs?: boolean | null
          show_news?: boolean | null
          show_partnership?: boolean | null
          show_posts?: boolean | null
          show_products?: boolean | null
          show_qa?: boolean | null
          show_services?: boolean | null
          slug?: string
          source_urls?: string[] | null
          status?: Database["public"]["Enums"]["organization_status"]
          street_address?: string | null
          telephone?: string | null
          trial_end?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_organizations_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_organizations_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organizations_partner"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organizations_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_organizations_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          brand_logo_url: string | null
          contact_email: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          partnership_type:
            | Database["public"]["Enums"]["partnership_type"]
            | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          brand_logo_url?: string | null
          contact_email?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          partnership_type?:
            | Database["public"]["Enums"]["partnership_type"]
            | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          brand_logo_url?: string | null
          contact_email?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          partnership_type?:
            | Database["public"]["Enums"]["partnership_type"]
            | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      plan_feature_limits: {
        Row: {
          feature_id: string
          monthly_limit: number
          plan_id: string
        }
        Insert: {
          feature_id: string
          monthly_limit: number
          plan_id: string
        }
        Update: {
          feature_id?: string
          monthly_limit?: number
          plan_id?: string
        }
        Relationships: []
      }
      plan_features_v2: {
        Row: {
          created_at: string
          default_config: Json
          display_order: number | null
          feature_id: string
          is_enabled: boolean
          is_required: boolean
          plan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_config?: Json
          display_order?: number | null
          feature_id: string
          is_enabled?: boolean
          is_required?: boolean
          plan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_config?: Json
          display_order?: number | null
          feature_id?: string
          is_enabled?: boolean
          is_required?: boolean
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_v2_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_registry"
            referencedColumns: ["feature_id"]
          },
          {
            foreignKeyName: "plan_features_v2_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_features_v2_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_features_v2_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "v_plan_catalog"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "plan_features_v2_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "v_plan_catalog_v1"
            referencedColumns: ["plan_id"]
          },
        ]
      }
      plans: {
        Row: {
          billing_external_id: string | null
          created_at: string
          id: string
          name: string
          sort_order: number | null
          status: string
          updated_at: string
        }
        Insert: {
          billing_external_id?: string | null
          created_at?: string
          id?: string
          name: string
          sort_order?: number | null
          status: string
          updated_at?: string
        }
        Update: {
          billing_external_id?: string | null
          created_at?: string
          id?: string
          name?: string
          sort_order?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_translations: {
        Row: {
          content: string | null
          content_hash: string | null
          is_primary: boolean
          lang: string
          post_id: string
          summary: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          content_hash?: string | null
          is_primary?: boolean
          lang: string
          post_id: string
          summary?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
          content_hash?: string | null
          is_primary?: boolean
          lang?: string
          post_id?: string
          summary?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_translations_lang_fkey"
            columns: ["lang"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "post_translations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_translations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_translations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_public_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_translations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "public_posts_jsonld"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_translations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_translations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_posts_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_translations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "v_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_translations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "view_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_translations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "vw_posts_pub_inconsistencies"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          base_path: string | null
          content: string | null
          content_hash: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string
          created_by: string
          deleted_at: string | null
          generation_source:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id: string
          interview_session_id: string | null
          is_ai_generated: boolean
          is_published: boolean
          locale: string | null
          meta: Json | null
          organization_id: string
          published_at: string | null
          region_code: string | null
          slug: string | null
          status: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          base_path?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string
          interview_session_id?: string | null
          is_ai_generated?: boolean
          is_published?: boolean
          locale?: string | null
          meta?: Json | null
          organization_id: string
          published_at?: string | null
          region_code?: string | null
          slug?: string | null
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          base_path?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string
          interview_session_id?: string | null
          is_ai_generated?: boolean
          is_published?: boolean
          locale?: string | null
          meta?: Json | null
          organization_id?: string
          published_at?: string | null
          region_code?: string | null
          slug?: string | null
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "posts_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "v_ai_interview_session_metrics"
            referencedColumns: ["session_id"]
          },
        ]
      }
      price_features: {
        Row: {
          enabled: boolean
          feature_key: string
          id: number
          price_id: string
        }
        Insert: {
          enabled?: boolean
          feature_key: string
          id?: number
          price_id: string
        }
        Update: {
          enabled?: boolean
          feature_key?: string
          id?: number
          price_id?: string
        }
        Relationships: []
      }
      price_limits: {
        Row: {
          id: number
          limit_key: string
          limit_value: number
          price_id: string
        }
        Insert: {
          id?: number
          limit_key: string
          limit_value: number
          price_id: string
        }
        Update: {
          id?: number
          limit_key?: string
          limit_value?: number
          price_id?: string
        }
        Relationships: []
      }
      product_translations: {
        Row: {
          content_hash: string | null
          description: string | null
          is_primary: boolean
          lang: string
          name: string
          product_id: string
        }
        Insert: {
          content_hash?: string | null
          description?: string | null
          is_primary?: boolean
          lang: string
          name: string
          product_id: string
        }
        Update: {
          content_hash?: string | null
          description?: string | null
          is_primary?: boolean
          lang?: string
          name?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_translations_lang_fk"
            columns: ["lang"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_display_en_v1"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_display_ja_v1"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "view_products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_path: string | null
          content_hash: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          organization_id: string | null
          published_at: string | null
          sku: string | null
          slug: string | null
          tenant_id: string
          url: string | null
        }
        Insert: {
          base_path?: string | null
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          organization_id?: string | null
          published_at?: string | null
          sku?: string | null
          slug?: string | null
          tenant_id: string
          url?: string | null
        }
        Update: {
          base_path?: string | null
          content_hash?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          organization_id?: string | null
          published_at?: string | null
          sku?: string | null
          slug?: string | null
          tenant_id?: string
          url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          next_violation_action: string | null
          next_violation_note: string | null
          next_violation_set_at: string | null
          next_violation_set_by: string | null
          role: string | null
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          next_violation_action?: string | null
          next_violation_note?: string | null
          next_violation_set_at?: string | null
          next_violation_set_by?: string | null
          role?: string | null
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          next_violation_action?: string | null
          next_violation_note?: string | null
          next_violation_set_at?: string | null
          next_violation_set_by?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      public_case_studies_tbl: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string
          is_published: boolean
          lang: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id: string
          is_published?: boolean
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string
          is_published?: boolean
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      public_faqs_tbl: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string
          is_published: boolean
          lang: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id: string
          is_published?: boolean
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string
          is_published?: boolean
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      public_news_tbl: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string
          is_published: boolean
          lang: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id: string
          is_published?: boolean
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string
          is_published?: boolean
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      public_organizations_tbl: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string
          is_published: boolean
          lang: string
          organization_id: string | null
          published_at: string | null
          slug: string
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id: string
          is_published?: boolean
          lang: string
          organization_id?: string | null
          published_at?: string | null
          slug: string
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string
          is_published?: boolean
          lang?: string
          organization_id?: string | null
          published_at?: string | null
          slug?: string
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      public_posts_tbl: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string
          is_published: boolean
          lang: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id: string
          is_published?: boolean
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string
          is_published?: boolean
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      public_products_tbl: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string
          is_published: boolean
          lang: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id: string
          is_published?: boolean
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string
          is_published?: boolean
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      public_services_tbl: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string
          is_published: boolean
          lang: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id: string
          is_published?: boolean
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string
          is_published?: boolean
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      qa_categories: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
          updated_by: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
          updated_by?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
          updated_by?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qa_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qa_categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_content_logs: {
        Row: {
          action: string
          actor_user_id: string
          category_id: string | null
          changes: Json | null
          created_at: string | null
          id: string
          metadata: Json | null
          note: string | null
          organization_id: string
          qa_entry_id: string | null
        }
        Insert: {
          action: string
          actor_user_id: string
          category_id?: string | null
          changes?: Json | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          note?: string | null
          organization_id: string
          qa_entry_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string
          category_id?: string | null
          changes?: Json | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          note?: string | null
          organization_id?: string
          qa_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qa_content_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_content_logs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "qa_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_content_logs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_qa_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_content_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "qa_content_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_content_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qa_content_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_content_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_content_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_content_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_content_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qa_content_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_content_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qa_content_logs_qa_entry_id_fkey"
            columns: ["qa_entry_id"]
            isOneToOne: false
            referencedRelation: "qa_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_content_logs_qa_entry_id_fkey"
            columns: ["qa_entry_id"]
            isOneToOne: false
            referencedRelation: "v_public_qa_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_content_logs_qa_entry_id_fkey"
            columns: ["qa_entry_id"]
            isOneToOne: false
            referencedRelation: "v_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_content_logs_qa_entry_id_fkey"
            columns: ["qa_entry_id"]
            isOneToOne: false
            referencedRelation: "v_questions_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_content_logs_qa_entry_id_fkey"
            columns: ["qa_entry_id"]
            isOneToOne: false
            referencedRelation: "view_qa_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_entries: {
        Row: {
          answer: string
          base_path: string | null
          category_id: string | null
          content_hash: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          generation_source:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id: string
          interview_session_id: string | null
          is_ai_generated: boolean
          jsonld_cache: Json | null
          last_edited_at: string | null
          last_edited_by: string
          locale: string | null
          meta: Json | null
          organization_id: string
          published_at: string | null
          question: string
          refresh_suggested_at: string | null
          region_code: string | null
          search_vector: unknown
          slug: string | null
          status: Database["public"]["Enums"]["cms_content_status"] | null
          tags: string[] | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          answer: string
          base_path?: string | null
          category_id?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string
          interview_session_id?: string | null
          is_ai_generated?: boolean
          jsonld_cache?: Json | null
          last_edited_at?: string | null
          last_edited_by: string
          locale?: string | null
          meta?: Json | null
          organization_id: string
          published_at?: string | null
          question: string
          refresh_suggested_at?: string | null
          region_code?: string | null
          search_vector?: unknown
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          tags?: string[] | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          answer?: string
          base_path?: string | null
          category_id?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string
          interview_session_id?: string | null
          is_ai_generated?: boolean
          jsonld_cache?: Json | null
          last_edited_at?: string | null
          last_edited_by?: string
          locale?: string | null
          meta?: Json | null
          organization_id?: string
          published_at?: string | null
          question?: string
          refresh_suggested_at?: string | null
          region_code?: string | null
          search_vector?: unknown
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          tags?: string[] | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qa_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "qa_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_qa_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_entries_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_entries_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "v_ai_interview_session_metrics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "qa_entries_last_edited_by_fkey"
            columns: ["last_edited_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_question_templates: {
        Row: {
          category_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          tags: string[] | null
          template_text: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          tags?: string[] | null
          template_text: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          tags?: string[] | null
          template_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qa_question_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "qa_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_question_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_qa_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      qna_events: {
        Row: {
          count: number
          id: string
          occurred_at: string
          org_id: string
          type: string
        }
        Insert: {
          count?: number
          id?: string
          occurred_at?: string
          org_id: string
          type: string
        }
        Update: {
          count?: number
          id?: string
          occurred_at?: string
          org_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      quota_counters: {
        Row: {
          id: number
          period_end: string
          period_start: string
          quota_key: string
          used: number
          user_id: string
        }
        Insert: {
          id?: number
          period_end: string
          period_start: string
          quota_key: string
          used?: number
          user_id: string
        }
        Update: {
          id?: number
          period_end?: string
          period_start?: string
          quota_key?: string
          used?: number
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_configs: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_requests: number
          name: string
          path_pattern: string | null
          updated_at: string | null
          window_ms: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_requests?: number
          name: string
          path_pattern?: string | null
          updated_at?: string | null
          window_ms?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_requests?: number
          name?: string
          path_pattern?: string | null
          updated_at?: string | null
          window_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "rate_limit_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_logs: {
        Row: {
          bot_type: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          limit_exceeded: boolean | null
          method: string
          path: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method: string
          path: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string
          path?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_logs_202511: {
        Row: {
          bot_type: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          limit_exceeded: boolean | null
          method: string
          path: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method: string
          path: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string
          path?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_logs_202601: {
        Row: {
          bot_type: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          limit_exceeded: boolean | null
          method: string
          path: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method: string
          path: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string
          path?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_logs_202602: {
        Row: {
          bot_type: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          limit_exceeded: boolean | null
          method: string
          path: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method: string
          path: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string
          path?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_logs_202603: {
        Row: {
          bot_type: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          limit_exceeded: boolean | null
          method: string
          path: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method: string
          path: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string
          path?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_logs_202604: {
        Row: {
          bot_type: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          limit_exceeded: boolean | null
          method: string
          path: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method: string
          path: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string
          path?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_logs_202605: {
        Row: {
          bot_type: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          limit_exceeded: boolean | null
          method: string
          path: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method: string
          path: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string
          path?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_logs_202606: {
        Row: {
          bot_type: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          limit_exceeded: boolean | null
          method: string
          path: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method: string
          path: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string
          path?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_logs_202607: {
        Row: {
          bot_type: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          limit_exceeded: boolean | null
          method: string
          path: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method: string
          path: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string
          path?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_logs_202608: {
        Row: {
          bot_type: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          limit_exceeded: boolean | null
          method: string
          path: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method: string
          path: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string
          path?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_logs_202609: {
        Row: {
          bot_type: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          limit_exceeded: boolean | null
          method: string
          path: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method: string
          path: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string
          path?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_logs_202610: {
        Row: {
          bot_type: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          limit_exceeded: boolean | null
          method: string
          path: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method: string
          path: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string
          path?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_logs_202611: {
        Row: {
          bot_type: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          limit_exceeded: boolean | null
          method: string
          path: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method: string
          path: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string
          path?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_logs_202612: {
        Row: {
          bot_type: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          limit_exceeded: boolean | null
          method: string
          path: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method: string
          path: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string
          path?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_logs_202701: {
        Row: {
          bot_type: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          limit_exceeded: boolean | null
          method: string
          path: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method: string
          path: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string
          path?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_logs_default: {
        Row: {
          bot_type: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          limit_exceeded: boolean | null
          method: string
          path: string
          response_time_ms: number | null
          status_code: number
          timestamp: string | null
          user_agent: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method: string
          path: string
          response_time_ms?: number | null
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string
          path?: string
          response_time_ms?: number | null
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      rate_limit_requests: {
        Row: {
          bot_type: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          is_suspicious: boolean | null
          key: string
          method: string
          path: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bot_type?: string | null
          country_code?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key: string
          method: string
          path: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bot_type?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key?: string
          method?: string
          path?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_requests_202511: {
        Row: {
          bot_type: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          is_suspicious: boolean | null
          key: string
          method: string
          path: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bot_type?: string | null
          country_code?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key: string
          method: string
          path: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bot_type?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key?: string
          method?: string
          path?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_requests_202601: {
        Row: {
          bot_type: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          is_suspicious: boolean | null
          key: string
          method: string
          path: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bot_type?: string | null
          country_code?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key: string
          method: string
          path: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bot_type?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key?: string
          method?: string
          path?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_requests_202602: {
        Row: {
          bot_type: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          is_suspicious: boolean | null
          key: string
          method: string
          path: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bot_type?: string | null
          country_code?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key: string
          method: string
          path: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bot_type?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key?: string
          method?: string
          path?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_requests_202603: {
        Row: {
          bot_type: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          is_suspicious: boolean | null
          key: string
          method: string
          path: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bot_type?: string | null
          country_code?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key: string
          method: string
          path: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bot_type?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key?: string
          method?: string
          path?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_requests_202604: {
        Row: {
          bot_type: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          is_suspicious: boolean | null
          key: string
          method: string
          path: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bot_type?: string | null
          country_code?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key: string
          method: string
          path: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bot_type?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key?: string
          method?: string
          path?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_requests_202605: {
        Row: {
          bot_type: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          is_suspicious: boolean | null
          key: string
          method: string
          path: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bot_type?: string | null
          country_code?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key: string
          method: string
          path: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bot_type?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key?: string
          method?: string
          path?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_requests_202606: {
        Row: {
          bot_type: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          is_suspicious: boolean | null
          key: string
          method: string
          path: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bot_type?: string | null
          country_code?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key: string
          method: string
          path: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bot_type?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key?: string
          method?: string
          path?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_requests_202607: {
        Row: {
          bot_type: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          is_suspicious: boolean | null
          key: string
          method: string
          path: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bot_type?: string | null
          country_code?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key: string
          method: string
          path: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bot_type?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key?: string
          method?: string
          path?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_requests_202608: {
        Row: {
          bot_type: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          is_suspicious: boolean | null
          key: string
          method: string
          path: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bot_type?: string | null
          country_code?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key: string
          method: string
          path: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bot_type?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key?: string
          method?: string
          path?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_requests_202609: {
        Row: {
          bot_type: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          is_suspicious: boolean | null
          key: string
          method: string
          path: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bot_type?: string | null
          country_code?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key: string
          method: string
          path: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bot_type?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key?: string
          method?: string
          path?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_requests_202610: {
        Row: {
          bot_type: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          is_suspicious: boolean | null
          key: string
          method: string
          path: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bot_type?: string | null
          country_code?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key: string
          method: string
          path: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bot_type?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key?: string
          method?: string
          path?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_requests_202611: {
        Row: {
          bot_type: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          is_suspicious: boolean | null
          key: string
          method: string
          path: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bot_type?: string | null
          country_code?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key: string
          method: string
          path: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bot_type?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key?: string
          method?: string
          path?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_requests_202612: {
        Row: {
          bot_type: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          is_suspicious: boolean | null
          key: string
          method: string
          path: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bot_type?: string | null
          country_code?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key: string
          method: string
          path: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bot_type?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key?: string
          method?: string
          path?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_requests_202701: {
        Row: {
          bot_type: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          is_suspicious: boolean | null
          key: string
          method: string
          path: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bot_type?: string | null
          country_code?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key: string
          method: string
          path: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bot_type?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key?: string
          method?: string
          path?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_requests_default: {
        Row: {
          bot_type: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot: boolean | null
          is_suspicious: boolean | null
          key: string
          method: string
          path: string
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bot_type?: string | null
          country_code?: string | null
          created_at: string
          id: string
          ip_address: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key: string
          method: string
          path: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bot_type?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_suspicious?: boolean | null
          key?: string
          method?: string
          path?: string
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limit_rules: {
        Row: {
          block_duration_minutes: number | null
          bot_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          method: string | null
          path_pattern: string | null
          requests_per_window: number
          rule_name: string
          updated_at: string | null
          window_seconds: number
        }
        Insert: {
          block_duration_minutes?: number | null
          bot_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          method?: string | null
          path_pattern?: string | null
          requests_per_window?: number
          rule_name: string
          updated_at?: string | null
          window_seconds?: number
        }
        Update: {
          block_duration_minutes?: number | null
          bot_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          method?: string | null
          path_pattern?: string | null
          requests_per_window?: number
          rule_name?: string
          updated_at?: string | null
          window_seconds?: number
        }
        Relationships: []
      }
      rate_limit_write_health: {
        Row: {
          created_at: string | null
          fail_rate: number | null
          failed_attempts: number
          total_attempts: number
          window_start: string
        }
        Insert: {
          created_at?: string | null
          fail_rate?: number | null
          failed_attempts: number
          total_attempts: number
          window_start: string
        }
        Update: {
          created_at?: string | null
          fail_rate?: number | null
          failed_attempts?: number
          total_attempts?: number
          window_start?: string
        }
        Relationships: []
      }
      report_jobs: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          organization_id: string
          report_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          organization_id: string
          report_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          organization_id?: string
          report_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_jobs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "ai_monthly_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_jobs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "monthly_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_jobs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_jobs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "v_ai_monthly_reports_latest"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_jobs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "v_monthly_reports_synced"
            referencedColumns: ["id"]
          },
        ]
      }
      report_regeneration_logs: {
        Row: {
          id: string
          month_bucket: string | null
          organization_id: string
          period_end: string
          period_start: string
          regenerated_at: string
        }
        Insert: {
          id?: string
          month_bucket?: string | null
          organization_id: string
          period_end: string
          period_start: string
          regenerated_at?: string
        }
        Update: {
          id?: string
          month_bucket?: string | null
          organization_id?: string
          period_end?: string
          period_start?: string
          regenerated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      review_audit: {
        Row: {
          action: string
          comment: string | null
          created_at: string | null
          id: string
          queue_id: string | null
          reviewer_id: string | null
        }
        Insert: {
          action: string
          comment?: string | null
          created_at?: string | null
          id?: string
          queue_id?: string | null
          reviewer_id?: string | null
        }
        Update: {
          action?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          queue_id?: string | null
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_audit_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "review_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      review_queue: {
        Row: {
          applicant_id: string | null
          created_at: string | null
          id: string
          organization_id: string | null
          reason: string | null
          request_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          applicant_id?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          reason?: string | null
          request_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          applicant_id?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          reason?: string | null
          request_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "review_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "review_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "review_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      rls_denied_events: {
        Row: {
          api_endpoint: string | null
          created_at: string
          details: Json | null
          id: string
          ip: unknown
          operation: string
          org_id: string | null
          reason: Database["public"]["Enums"]["rls_denied_reason"]
          request_id: string | null
          resource: string | null
          screen_path: string | null
          session_id: string | null
          source: string
          table_name: string
          user_agent: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          api_endpoint?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip?: unknown
          operation: string
          org_id?: string | null
          reason: Database["public"]["Enums"]["rls_denied_reason"]
          request_id?: string | null
          resource?: string | null
          screen_path?: string | null
          session_id?: string | null
          source?: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          api_endpoint?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip?: unknown
          operation?: string
          org_id?: string | null
          reason?: Database["public"]["Enums"]["rls_denied_reason"]
          request_id?: string | null
          resource?: string | null
          screen_path?: string | null
          session_id?: string | null
          source?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      rls_test_results: {
        Row: {
          actual_result: string
          created_at: string | null
          error_details: Json | null
          error_message: string | null
          executed_at: string | null
          execution_time_ms: number | null
          expected_result: string
          id: string
          operation: string
          row_count: number | null
          scenario_id: string | null
          scenario_name: string
          success: boolean | null
          target_table: string
          test_data: Json | null
          test_run_id: string
          test_user_role: string
        }
        Insert: {
          actual_result: string
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          expected_result: string
          id?: string
          operation: string
          row_count?: number | null
          scenario_id?: string | null
          scenario_name: string
          success?: boolean | null
          target_table: string
          test_data?: Json | null
          test_run_id: string
          test_user_role: string
        }
        Update: {
          actual_result?: string
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          expected_result?: string
          id?: string
          operation?: string
          row_count?: number | null
          scenario_id?: string | null
          scenario_name?: string
          success?: boolean | null
          target_table?: string
          test_data?: Json | null
          test_run_id?: string
          test_user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "rls_test_results_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "rls_test_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      rls_test_runs: {
        Row: {
          completed_at: string | null
          error_scenarios: number
          execution_time_ms: number | null
          failed_scenarios: number
          git_commit_hash: string | null
          id: string
          passed_scenarios: number
          started_at: string
          status: string | null
          success_rate: number | null
          total_scenarios: number
          trigger_source: string | null
          trigger_type: string
        }
        Insert: {
          completed_at?: string | null
          error_scenarios?: number
          execution_time_ms?: number | null
          failed_scenarios?: number
          git_commit_hash?: string | null
          id?: string
          passed_scenarios?: number
          started_at?: string
          status?: string | null
          success_rate?: number | null
          total_scenarios?: number
          trigger_source?: string | null
          trigger_type: string
        }
        Update: {
          completed_at?: string | null
          error_scenarios?: number
          execution_time_ms?: number | null
          failed_scenarios?: number
          git_commit_hash?: string | null
          id?: string
          passed_scenarios?: number
          started_at?: string
          status?: string | null
          success_rate?: number | null
          total_scenarios?: number
          trigger_source?: string | null
          trigger_type?: string
        }
        Relationships: []
      }
      rls_test_scenarios: {
        Row: {
          created_at: string | null
          description: string | null
          expected_result: string
          id: string
          operation: string
          scenario_name: string
          target_table: string
          test_data: Json | null
          test_user_role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          expected_result: string
          id?: string
          operation: string
          scenario_name: string
          target_table: string
          test_data?: Json | null
          test_user_role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          expected_result?: string
          id?: string
          operation?: string
          scenario_name?: string
          target_table?: string
          test_data?: Json | null
          test_user_role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rls_test_users: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          jwt_template: Json
          organization_id: string | null
          role_name: string
          updated_at: string | null
          user_role: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          jwt_template: Json
          organization_id?: string | null
          role_name: string
          updated_at?: string | null
          user_role: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          jwt_template?: Json
          organization_id?: string | null
          role_name?: string
          updated_at?: string | null
          user_role?: string
        }
        Relationships: []
      }
      role_change_audit: {
        Row: {
          changed_by: string
          created_at: string | null
          id: string
          new_role: string
          old_role: string | null
          reason: string | null
          target_user_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string | null
          id?: string
          new_role: string
          old_role?: string | null
          reason?: string | null
          target_user_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string | null
          id?: string
          new_role?: string
          old_role?: string | null
          reason?: string | null
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_change_audit_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_change_audit_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      room_members: {
        Row: {
          id: string
          joined_at: string | null
          organization_id: string
          role: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          organization_id: string
          role?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          organization_id?: string
          role?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "room_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "room_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "room_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      sales_materials: {
        Row: {
          base_path: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          file_path: string
          id: string
          is_public: boolean
          locale: string | null
          meta: Json | null
          mime_type: string | null
          organization_id: string | null
          published_at: string | null
          region_code: string | null
          size_bytes: number | null
          slug: string | null
          status: Database["public"]["Enums"]["cms_content_status"] | null
          title: string
        }
        Insert: {
          base_path?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          file_path: string
          id?: string
          is_public?: boolean
          locale?: string | null
          meta?: Json | null
          mime_type?: string | null
          organization_id?: string | null
          published_at?: string | null
          region_code?: string | null
          size_bytes?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          title: string
        }
        Update: {
          base_path?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          file_path?: string
          id?: string
          is_public?: boolean
          locale?: string | null
          meta?: Json | null
          mime_type?: string | null
          organization_id?: string | null
          published_at?: string | null
          region_code?: string | null
          size_bytes?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "sales_materials_created_by_auth_users_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_materials_stats: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          ip_address: string | null
          material_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          ip_address?: string | null
          material_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          ip_address?: string | null
          material_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_materials_stats_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "sales_materials_stats_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_materials_stats_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "sales_materials_stats_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_materials_stats_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_materials_stats_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_materials_stats_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_materials_stats_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "sales_materials_stats_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_materials_stats_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "sales_materials_stats_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "sales_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_materials_stats_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "view_sales_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_diff_history: {
        Row: {
          base_snapshot_id: number | null
          diff: Json
          diff_at: string
          environment: string
          id: number
          noted_by: string | null
          notes: string | null
          severity: string
          summary: Json
          target_snapshot_id: number | null
        }
        Insert: {
          base_snapshot_id?: number | null
          diff: Json
          diff_at?: string
          environment: string
          id?: number
          noted_by?: string | null
          notes?: string | null
          severity?: string
          summary: Json
          target_snapshot_id?: number | null
        }
        Update: {
          base_snapshot_id?: number | null
          diff?: Json
          diff_at?: string
          environment?: string
          id?: number
          noted_by?: string | null
          notes?: string | null
          severity?: string
          summary?: Json
          target_snapshot_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "schema_diff_history_base_snapshot_id_fkey"
            columns: ["base_snapshot_id"]
            isOneToOne: false
            referencedRelation: "schema_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schema_diff_history_target_snapshot_id_fkey"
            columns: ["target_snapshot_id"]
            isOneToOne: false
            referencedRelation: "schema_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_diff_ignore_list: {
        Row: {
          created_at: string | null
          id: number
          object_name: string | null
          object_type: string | null
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          object_name?: string | null
          object_type?: string | null
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          object_name?: string | null
          object_type?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      schema_snapshots: {
        Row: {
          app_version: string | null
          environment: string
          format_version: number
          git_ref: string | null
          id: number
          schema_json: Json
          snapshot_at: string
          source: string
        }
        Insert: {
          app_version?: string | null
          environment: string
          format_version?: number
          git_ref?: string | null
          id?: number
          schema_json: Json
          snapshot_at?: string
          source?: string
        }
        Update: {
          app_version?: string | null
          environment?: string
          format_version?: number
          git_ref?: string | null
          id?: number
          schema_json?: Json
          snapshot_at?: string
          source?: string
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string
          details: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at: string
          details?: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incident_type?: string
          ip_address?: unknown
          method?: string
          path?: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents_202511: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string
          details: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at: string
          details?: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incident_type?: string
          ip_address?: unknown
          method?: string
          path?: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents_202601: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string
          details: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at: string
          details?: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incident_type?: string
          ip_address?: unknown
          method?: string
          path?: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents_202602: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string
          details: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at: string
          details?: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incident_type?: string
          ip_address?: unknown
          method?: string
          path?: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents_202603: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string
          details: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at: string
          details?: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incident_type?: string
          ip_address?: unknown
          method?: string
          path?: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents_202604: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string
          details: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at: string
          details?: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incident_type?: string
          ip_address?: unknown
          method?: string
          path?: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents_202605: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string
          details: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at: string
          details?: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incident_type?: string
          ip_address?: unknown
          method?: string
          path?: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents_202606: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string
          details: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at: string
          details?: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incident_type?: string
          ip_address?: unknown
          method?: string
          path?: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents_202607: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string
          details: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at: string
          details?: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incident_type?: string
          ip_address?: unknown
          method?: string
          path?: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents_202608: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string
          details: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at: string
          details?: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incident_type?: string
          ip_address?: unknown
          method?: string
          path?: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents_202609: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string
          details: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at: string
          details?: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incident_type?: string
          ip_address?: unknown
          method?: string
          path?: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents_202610: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string
          details: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at: string
          details?: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incident_type?: string
          ip_address?: unknown
          method?: string
          path?: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents_202611: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string
          details: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at: string
          details?: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incident_type?: string
          ip_address?: unknown
          method?: string
          path?: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents_202612: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string
          details: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at: string
          details?: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incident_type?: string
          ip_address?: unknown
          method?: string
          path?: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents_202701: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string
          details: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at: string
          details?: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incident_type?: string
          ip_address?: unknown
          method?: string
          path?: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents_default: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string
          details: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at: string
          details?: Json | null
          id: string
          incident_type: string
          ip_address: unknown
          method: string
          path: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          incident_type?: string
          ip_address?: unknown
          method?: string
          path?: string
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sensitive_data_patterns: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          pattern_name: string
          regex_pattern: string
          replacement_text: string | null
          severity_level: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          pattern_name: string
          regex_pattern: string
          replacement_text?: string | null
          severity_level?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          pattern_name?: string
          regex_pattern?: string
          replacement_text?: string | null
          severity_level?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sensitive_data_patterns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      service_role_audit: {
        Row: {
          additional_data: Json | null
          affected_row_count: number | null
          context: Json | null
          created_at: string | null
          error_code: string | null
          error_message: string | null
          execution_time_ms: number | null
          expected_row_count: number | null
          function_name: string | null
          id: string
          is_service_role: boolean | null
          latency_ms: number | null
          operation_type: string
          payload: Json | null
          query_text: string | null
          request_id: string | null
          request_ip: unknown
          resource: string | null
          risk_level: string | null
          row_count: number | null
          session_id: string | null
          success: boolean
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          additional_data?: Json | null
          affected_row_count?: number | null
          context?: Json | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          expected_row_count?: number | null
          function_name?: string | null
          id?: string
          is_service_role?: boolean | null
          latency_ms?: number | null
          operation_type: string
          payload?: Json | null
          query_text?: string | null
          request_id?: string | null
          request_ip?: unknown
          resource?: string | null
          risk_level?: string | null
          row_count?: number | null
          session_id?: string | null
          success?: boolean
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          additional_data?: Json | null
          affected_row_count?: number | null
          context?: Json | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          expected_row_count?: number | null
          function_name?: string | null
          id?: string
          is_service_role?: boolean | null
          latency_ms?: number | null
          operation_type?: string
          payload?: Json | null
          query_text?: string | null
          request_id?: string | null
          request_ip?: unknown
          resource?: string | null
          risk_level?: string | null
          row_count?: number | null
          session_id?: string | null
          success?: boolean
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_translations: {
        Row: {
          content_hash: string | null
          description: string | null
          is_primary: boolean
          lang: string
          name: string | null
          service_id: string
        }
        Insert: {
          content_hash?: string | null
          description?: string | null
          is_primary?: boolean
          lang: string
          name?: string | null
          service_id: string
        }
        Update: {
          content_hash?: string | null
          description?: string | null
          is_primary?: boolean
          lang?: string
          name?: string | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_translations_lang_fkey"
            columns: ["lang"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "service_translations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services_jsonld"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "service_translations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_translations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_translations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_translations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_translations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_translations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_translations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "view_services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          api_available: boolean | null
          availability_note: string | null
          availability_status: string | null
          base_path: string | null
          categories: string[] | null
          category: string | null
          content_hash: string | null
          created_at: string
          created_by: string
          cta_text: string | null
          cta_url: string | null
          deleted_at: string | null
          description: string | null
          duration_months: number | null
          features: string[] | null
          free_trial: boolean | null
          id: string
          image_url: string | null
          is_published: boolean
          locale: string | null
          logo_url: string | null
          name: string
          organization_id: string
          price: string | null
          price_range: string | null
          published_at: string | null
          region_code: string | null
          screenshots: string[] | null
          slug: string | null
          source_urls: string[] | null
          status: string | null
          summary: string | null
          supported_platforms: string[] | null
          updated_at: string | null
          url: string | null
          verification_source: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          video_url: string | null
        }
        Insert: {
          api_available?: boolean | null
          availability_note?: string | null
          availability_status?: string | null
          base_path?: string | null
          categories?: string[] | null
          category?: string | null
          content_hash?: string | null
          created_at?: string
          created_by: string
          cta_text?: string | null
          cta_url?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_months?: number | null
          features?: string[] | null
          free_trial?: boolean | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          locale?: string | null
          logo_url?: string | null
          name: string
          organization_id: string
          price?: string | null
          price_range?: string | null
          published_at?: string | null
          region_code?: string | null
          screenshots?: string[] | null
          slug?: string | null
          source_urls?: string[] | null
          status?: string | null
          summary?: string | null
          supported_platforms?: string[] | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          video_url?: string | null
        }
        Update: {
          api_available?: boolean | null
          availability_note?: string | null
          availability_status?: string | null
          base_path?: string | null
          categories?: string[] | null
          category?: string | null
          content_hash?: string | null
          created_at?: string
          created_by?: string
          cta_text?: string | null
          cta_url?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_months?: number | null
          features?: string[] | null
          free_trial?: boolean | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          locale?: string | null
          logo_url?: string | null
          name?: string
          organization_id?: string
          price?: string | null
          price_range?: string | null
          published_at?: string | null
          region_code?: string | null
          screenshots?: string[] | null
          slug?: string | null
          source_urls?: string[] | null
          status?: string | null
          summary?: string | null
          supported_platforms?: string[] | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "services_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          value?: string | null
        }
        Relationships: []
      }
      site_admins: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      storage_access_logs: {
        Row: {
          action: string
          bucket_id: string
          id: number
          latency_ms: number | null
          meta: Json | null
          occurred_at: string
          path: string
          status: number
          user_id: string | null
        }
        Insert: {
          action: string
          bucket_id: string
          id?: number
          latency_ms?: number | null
          meta?: Json | null
          occurred_at?: string
          path: string
          status: number
          user_id?: string | null
        }
        Update: {
          action?: string
          bucket_id?: string
          id?: number
          latency_ms?: number | null
          meta?: Json | null
          occurred_at?: string
          path?: string
          status?: number
          user_id?: string | null
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          id: string
          stripe_customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          stripe_customer_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          stripe_customer_id?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          organization_id: string | null
          price_id: string | null
          status: string
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          organization_id?: string | null
          price_id?: string | null
          status: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          organization_id?: string | null
          price_id?: string | null
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_subscriptions_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_subscriptions_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_subscriptions_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_subscriptions_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_subscriptions_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_subscriptions_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_subscriptions_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_subscriptions_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_subscriptions_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_subscriptions_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      supported_languages: {
        Row: {
          code: string
          is_active: boolean
          name: string
          native_name: string
          sort_order: number
        }
        Insert: {
          code: string
          is_active?: boolean
          name: string
          native_name: string
          sort_order?: number
        }
        Update: {
          code?: string
          is_active?: boolean
          name?: string
          native_name?: string
          sort_order?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          id: string
          project_id: string
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          project_id: string
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          project_id?: string
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_tasks"
            referencedColumns: ["project_id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      test_org_memberships: {
        Row: {
          created_at: string
          organization_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      translation_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          idempotency_key: string | null
          max_retries: number
          organization_id: string | null
          priority: number
          retry_count: number
          scheduled_at: string
          source_field: string
          source_id: string
          source_lang: string
          source_table: string
          source_text: string
          started_at: string | null
          status: string
          target_lang: string
          translated_text: string | null
          translation_service: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          max_retries?: number
          organization_id?: string | null
          priority?: number
          retry_count?: number
          scheduled_at?: string
          source_field: string
          source_id: string
          source_lang?: string
          source_table: string
          source_text: string
          started_at?: string | null
          status?: string
          target_lang: string
          translated_text?: string | null
          translation_service?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          max_retries?: number
          organization_id?: string | null
          priority?: number
          retry_count?: number
          scheduled_at?: string
          source_field?: string
          source_id?: string
          source_lang?: string
          source_table?: string
          source_text?: string
          started_at?: string | null
          status?: string
          target_lang?: string
          translated_text?: string | null
          translation_service?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "translation_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "translation_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translation_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "translation_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translation_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translation_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translation_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translation_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "translation_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "translation_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      usage_counters: {
        Row: {
          feature_id: string
          period_key: string
          used: number
          user_id: string
        }
        Insert: {
          feature_id: string
          period_key: string
          used?: number
          user_id: string
        }
        Update: {
          feature_id?: string
          period_key?: string
          used?: number
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "user_favorites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_favorites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_favorites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feature_overrides: {
        Row: {
          enabled: boolean
          feature_key: string
          id: number
          user_id: string
        }
        Insert: {
          enabled?: boolean
          feature_key: string
          id?: number
          user_id: string
        }
        Update: {
          enabled?: boolean
          feature_key?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          plan_id: string
          user_id: string
        }
        Insert: {
          plan_id: string
          user_id: string
        }
        Update: {
          plan_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          auth_user_id: string
          created_at: string
          preferred_lang: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          preferred_lang?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          preferred_lang?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_auth_user_id_fkey"
            columns: ["auth_user_id"]
            isOneToOne: true
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_preferred_lang_fkey"
            columns: ["preferred_lang"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      user_saved_searches: {
        Row: {
          created_at: string | null
          id: string
          name: string
          search_params: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          search_params: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          search_params?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          org_id: string | null
          plan_id: string
          reason: string | null
          starts_at: string
          status: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          org_id?: string | null
          plan_id: string
          reason?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          org_id?: string | null
          plan_id?: string
          reason?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_public_registry: {
        Row: {
          created_at: string
          description: string | null
          owner: string | null
          sla: string | null
          source_objects: string[] | null
          tags: string[] | null
          updated_at: string
          view_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          owner?: string | null
          sla?: string | null
          source_objects?: string[] | null
          tags?: string[] | null
          updated_at?: string
          view_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          owner?: string | null
          sla?: string | null
          source_objects?: string[] | null
          tags?: string[] | null
          updated_at?: string
          view_name?: string
        }
        Relationships: []
      }
      violations: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          rule: string
          severity: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          rule: string
          severity?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          rule?: string
          severity?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "violations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_moderation_overview_v2"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "violations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_overview_v2"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "violations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "violations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_violation_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          id: string
          payload: Json
          received_at: string | null
          type: string
        }
        Insert: {
          id: string
          payload: Json
          received_at?: string | null
          type: string
        }
        Update: {
          id?: string
          payload?: Json
          received_at?: string | null
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      _activities_recent_30d_v2: {
        Row: {
          action: string | null
          created_at: string | null
          id: string | null
          ip_address: unknown
          metadata: Json | null
          organization_id: string | null
          payload: Json | null
          resource_id: string | null
          resource_type: string | null
          type: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string | null
          ip_address?: unknown
          metadata?: Json | null
          organization_id?: string | null
          payload?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          type?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string | null
          ip_address?: unknown
          metadata?: Json | null
          organization_id?: string | null
          payload?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          type?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      _ai_bot_logs_recent_30d_v2: {
        Row: {
          accessed_at: string | null
          bot_name: string | null
          content_unit_id: string | null
          created_at: string | null
          id: string | null
          ip_address: unknown
          organization_id: string | null
          request_method: string | null
          response_status: number | null
          url: string | null
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string | null
          bot_name?: string | null
          content_unit_id?: string | null
          created_at?: string | null
          id?: string | null
          ip_address?: unknown
          organization_id?: string | null
          request_method?: string | null
          response_status?: number | null
          url?: string | null
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string | null
          bot_name?: string | null
          content_unit_id?: string | null
          created_at?: string | null
          id?: string | null
          ip_address?: unknown
          organization_id?: string | null
          request_method?: string | null
          response_status?: number | null
          url?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_bot_logs_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "ai_content_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bot_logs_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "v_ai_content_units_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_bot_logs_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "view_ai_content_units"
            referencedColumns: ["id"]
          },
        ]
      }
      _analytics_events_recent_30d_v2: {
        Row: {
          created_at: string | null
          event_name: string | null
          event_properties: Json | null
          id: string | null
          ip_address: unknown
          page_url: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_name?: string | null
          event_properties?: Json | null
          id?: string | null
          ip_address?: unknown
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_name?: string | null
          event_properties?: Json | null
          id?: string | null
          ip_address?: unknown
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      _auth_audit: {
        Row: {
          created_at: string | null
          email: string | null
          error: string | null
          event: string | null
          method: string | null
          provider: string | null
          raw_payload: Json | null
          route: string | null
          user_id: string | null
        }
        Relationships: []
      }
      _content_metrics_recent_v2: {
        Row: {
          ai_hits_30d: number | null
          ai_hits_7d: number | null
          canonical_url: string | null
          views_30d: number | null
          views_7d: number | null
          visibility_score_latest: number | null
        }
        Relationships: []
      }
      _org_content_counts_v2: {
        Row: {
          case_studies_published: number | null
          faqs_published: number | null
          news_published: number | null
          organization_id: string | null
          posts_published: number | null
          products_published: number | null
          services_published: number | null
        }
        Relationships: []
      }
      _org_content_metrics_v2: {
        Row: {
          ai_hits_30d: number | null
          ai_hits_7d: number | null
          organization_id: string | null
          views_30d: number | null
          views_7d: number | null
          visibility_score_sum: number | null
        }
        Relationships: []
      }
      _translation_fk_hints: {
        Row: {
          fk: string | null
          parent: string | null
          t: string | null
        }
        Relationships: []
      }
      _user_activity_snap_v2: {
        Row: {
          activity_30d: number | null
          activity_7d: number | null
          last_active_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      _user_content_created_counts_v2: {
        Row: {
          case_studies_count: number | null
          faqs_count: number | null
          posts_count: number | null
          services_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
      _user_content_reach_v2: {
        Row: {
          sum_ai_hits_30d: number | null
          sum_views_30d: number | null
          sum_visibility_score_latest: number | null
          user_id: string | null
        }
        Relationships: []
      }
      _user_publish_funnel_v2: {
        Row: {
          total_created: number | null
          total_published: number | null
          user_id: string | null
        }
        Relationships: []
      }
      _user_violation_enforcement_snap_v2: {
        Row: {
          latest_violation_at: string | null
          latest_violation_type: string | null
          open_enforcements: number | null
          user_id: string | null
          violations_30d: number | null
        }
        Relationships: []
      }
      admin_alerts_latest_v1: {
        Row: {
          created_at: string | null
          details: Json | null
          event_key: string | null
          event_type: string | null
          id: string | null
          message: string | null
          severity: string | null
          source_table: string | null
        }
        Relationships: []
      }
      admin_content_overview_v2: {
        Row: {
          ai_hits_30d: number | null
          ai_hits_7d: number | null
          availability_note: string | null
          availability_status: string | null
          base_path: string | null
          canonical_url: string | null
          content_type: string | null
          created_at: string | null
          id: string | null
          is_published: boolean | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_table: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
          views_30d: number | null
          views_7d: number | null
          visibility_score_latest: number | null
        }
        Relationships: []
      }
      admin_jobs_recent_v1: {
        Row: {
          completed_at: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          id: string | null
          job_name: string | null
          started_at: string | null
          status: string | null
        }
        Relationships: []
      }
      admin_moderation_overview_v2: {
        Row: {
          account_status: string | null
          latest_violation_at: string | null
          latest_violation_type: string | null
          open_enforcement_actions: string[] | null
          open_enforcements: number | null
          repeat_offender_30d: boolean | null
          role: string | null
          user_id: string | null
          violations_30d: number | null
          violations_7d: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_summary_today_v1: {
        Row: {
          critical_alerts_today: number | null
          failed_jobs_24h: number | null
          today_alerts: number | null
        }
        Relationships: []
      }
      admin_user_overview: {
        Row: {
          created_at: string | null
          enforcement_count: number | null
          organization_id: string | null
          recent_activity_count: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          total_content_count: number | null
          updated_at: string | null
          user_id: string | null
          violations_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "users_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      admin_user_overview_v2: {
        Row: {
          account_status: string | null
          activity_30d: number | null
          activity_7d: number | null
          case_studies_count: number | null
          faqs_count: number | null
          last_active_at: string | null
          latest_violation_at: string | null
          latest_violation_type: string | null
          open_enforcements: number | null
          posts_count: number | null
          role: string | null
          services_count: number | null
          sum_ai_hits_30d: number | null
          sum_views_30d: number | null
          sum_visibility_score_latest: number | null
          total_created: number | null
          total_published: number | null
          user_id: string | null
          violations_30d: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_citation_integrity_daily: {
        Row: {
          day: string | null
          duplicate_pairs: number | null
          organization_id: string | null
          orphan_items: number | null
          responses_without_items: number | null
        }
        Relationships: []
      }
      ai_citation_kpis_daily: {
        Row: {
          answers: number | null
          citation_rate_pct: number | null
          cited_answers: number | null
          day: string | null
          organization_id: string | null
          orphan_items: number | null
          zero_cite_answers: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      ai_disclosure_public: {
        Row: {
          changelog_url: string | null
          crawler_policy_ref: string | null
          doc_type: string | null
          effective_date: string | null
          ip_contact_url: string | null
          model_identifier: string | null
          pdf_object_path: string | null
          public_slug: string | null
          published_at: string | null
          summary_md: string | null
          title: string | null
          training_data_summary: string | null
          version: string | null
        }
        Insert: {
          changelog_url?: never
          crawler_policy_ref?: never
          doc_type?: string | null
          effective_date?: string | null
          ip_contact_url?: never
          model_identifier?: never
          pdf_object_path?: string | null
          public_slug?: string | null
          published_at?: string | null
          summary_md?: string | null
          title?: string | null
          training_data_summary?: never
          version?: string | null
        }
        Update: {
          changelog_url?: never
          crawler_policy_ref?: never
          doc_type?: string | null
          effective_date?: string | null
          ip_contact_url?: never
          model_identifier?: never
          pdf_object_path?: string | null
          public_slug?: string | null
          published_at?: string | null
          summary_md?: string | null
          title?: string | null
          training_data_summary?: never
          version?: string | null
        }
        Relationships: []
      }
      ai_interview_question_catalog_v1: {
        Row: {
          axis_active: boolean | null
          axis_code: string | null
          axis_id: string | null
          axis_sort_order: number | null
          content_type:
            | Database["public"]["Enums"]["interview_content_type"]
            | null
          lang: string | null
          question_active: boolean | null
          question_created_at: string | null
          question_id: string | null
          question_sort_order: number | null
          question_text: string | null
          question_updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interview_questions_lang_fkey"
            columns: ["lang"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      ai_monthly_reports_compat: {
        Row: {
          created_at: string | null
          id: string | null
          level: string | null
          metrics: Json | null
          organization_id: string | null
          period_end: string | null
          period_start: string | null
          plan_id: string | null
          sections: Json | null
          status: string | null
          suggestions: Json | null
          summary_text: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          level?: never
          metrics?: never
          organization_id?: string | null
          period_end?: string | null
          period_start?: string | null
          plan_id?: never
          sections?: never
          status?: string | null
          suggestions?: never
          summary_text?: never
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          level?: never
          metrics?: never
          organization_id?: string | null
          period_end?: string | null
          period_start?: string | null
          plan_id?: never
          sections?: never
          status?: string | null
          suggestions?: never
          summary_text?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      ai_usage_counters: {
        Row: {
          counters: Json | null
          org_id: string | null
          period_start: string | null
        }
        Insert: {
          counters?: never
          org_id?: string | null
          period_start?: never
        }
        Update: {
          counters?: never
          org_id?: string | null
          period_start?: never
        }
        Relationships: []
      }
      audit_log_details_v2: {
        Row: {
          action: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string | null
          id: string | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          id?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          id?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_log_events_v2: {
        Row: {
          action: string | null
          created_at: string | null
          id: string | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs_default: {
        Row: {
          action: string | null
          changed_fields: string[] | null
          created_at: string | null
          id: number | null
          old_data: Json | null
          row_data: Json | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          id?: number | null
          old_data?: Json | null
          row_data?: Json | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          id?: number | null
          old_data?: Json | null
          row_data?: Json | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      case_studies_active: {
        Row: {
          availability_note: string | null
          availability_status: string | null
          base_path: string | null
          challenge: string | null
          client_industry: string | null
          client_name: string | null
          client_size: string | null
          content: string | null
          content_hash: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          generation_source:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id: string | null
          industry: string | null
          interview_session_id: string | null
          is_ai_generated: boolean | null
          is_anonymous: boolean | null
          is_published: boolean | null
          locale: string | null
          meta: Json | null
          metrics: Json | null
          organization_id: string | null
          outcome: string | null
          problem: string | null
          published_at: string | null
          published_date: string | null
          region_code: string | null
          result: string | null
          service_id: string | null
          slug: string | null
          solution: string | null
          source_urls: string[] | null
          status: string | null
          summary: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          url: string | null
          verification_source: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          availability_note?: string | null
          availability_status?: string | null
          base_path?: string | null
          challenge?: string | null
          client_industry?: string | null
          client_name?: string | null
          client_size?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string | null
          industry?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean | null
          is_anonymous?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          metrics?: Json | null
          organization_id?: string | null
          outcome?: string | null
          problem?: string | null
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          result?: string | null
          service_id?: string | null
          slug?: string | null
          solution?: string | null
          source_urls?: string[] | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          availability_note?: string | null
          availability_status?: string | null
          base_path?: string | null
          challenge?: string | null
          client_industry?: string | null
          client_name?: string | null
          client_size?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string | null
          industry?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean | null
          is_anonymous?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          metrics?: Json | null
          organization_id?: string | null
          outcome?: string | null
          problem?: string | null
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          result?: string | null
          service_id?: string | null
          slug?: string | null
          solution?: string | null
          source_urls?: string[] | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_studies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "v_ai_interview_session_metrics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services_jsonld"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "view_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      case_studies_public_minimal: {
        Row: {
          id: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      comments_active: {
        Row: {
          body: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          id: string | null
          task_id: string | null
          tenant_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string | null
          task_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string | null
          task_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_project_tasks"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "v_task_comments"
            referencedColumns: ["task_id"]
          },
        ]
      }
      content_audit_timeline_v2: {
        Row: {
          action: string | null
          audit_id: string | null
          created_at: string | null
          target_id: string | null
          target_type: string | null
          title: string | null
          user_id: string | null
        }
        Relationships: []
      }
      content_metrics_view: {
        Row: {
          ai_bot_hits: number | null
          content_id: string | null
          content_type: string | null
          last_activity_at: string | null
          page_views: number | null
          url: string | null
          visibility_score: number | null
        }
        Relationships: []
      }
      content_union_truth_v2: {
        Row: {
          availability_note: string | null
          availability_status: string | null
          base_path: string | null
          canonical_url: string | null
          content_type: string | null
          created_at: string | null
          id: string | null
          is_published: boolean | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_table: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
        }
        Relationships: []
      }
      content_union_view: {
        Row: {
          availability_note: string | null
          availability_status: string | null
          base_path: string | null
          canonical_url: string | null
          content_type: string | null
          created_at: string | null
          id: string | null
          is_published: boolean | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_table: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
        }
        Relationships: []
      }
      designs_latest: {
        Row: {
          created_at: string | null
          design_id: string | null
          id: string | null
          payload: Json | null
          status: string | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "design_versions_design_id_fkey"
            columns: ["design_id"]
            isOneToOne: false
            referencedRelation: "designs"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          code: string | null
          created_at: string | null
          details: Json | null
          id: string | null
          message: string | null
          source: string | null
        }
        Relationships: []
      }
      feature_registry: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          feature_id: string | null
          feature_key: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          feature_id?: string | null
          feature_key?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          feature_id?: string | null
          feature_key?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      filtered_audit_logs: {
        Row: {
          action: string | null
          after_state: Json | null
          at: string | null
          before_state: Json | null
          created_at: string | null
          id: string | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          after_state?: Json | null
          at?: string | null
          before_state?: Json | null
          created_at?: string | null
          id?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          after_state?: Json | null
          at?: string | null
          before_state?: Json | null
          created_at?: string | null
          id?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      filtered_audit_logs_old: {
        Row: {
          additional_data: Json | null
          created_at: string | null
          execution_time_ms: number | null
          function_name: string | null
          id: string | null
          is_service_role: boolean | null
          operation_type: string | null
          query_text: string | null
          request_ip: unknown
          risk_level: string | null
          row_count: number | null
          session_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          additional_data?: never
          created_at?: string | null
          execution_time_ms?: number | null
          function_name?: string | null
          id?: string | null
          is_service_role?: boolean | null
          operation_type?: string | null
          query_text?: never
          request_ip?: unknown
          risk_level?: string | null
          row_count?: number | null
          session_id?: string | null
          table_name?: string | null
          user_agent?: never
          user_id?: string | null
        }
        Update: {
          additional_data?: never
          created_at?: string | null
          execution_time_ms?: number | null
          function_name?: string | null
          id?: string | null
          is_service_role?: boolean | null
          operation_type?: string | null
          query_text?: never
          request_ip?: unknown
          risk_level?: string | null
          row_count?: number | null
          session_id?: string | null
          table_name?: string | null
          user_agent?: never
          user_id?: string | null
        }
        Relationships: []
      }
      ids_statistics: {
        Row: {
          alert_count: number | null
          alert_level: string | null
          avg_risk_score: number | null
          false_positive_count: number | null
          hour: string | null
          max_risk_score: number | null
          unresolved_count: number | null
        }
        Relationships: []
      }
      job_last_result: {
        Row: {
          created_at: string | null
          details: Json | null
          job_name: string | null
          status: string | null
        }
        Relationships: []
      }
      job_success_rate_30d: {
        Row: {
          first_seen: string | null
          job_name: string | null
          last_seen: string | null
          runs: number | null
          success_rate: number | null
        }
        Relationships: []
      }
      kpi_ai_citations_weekly: {
        Row: {
          items: number | null
          items_per_response: number | null
          organization_id: string | null
          responses: number | null
          tokens_sum: number | null
          week_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      kpi_ai_interview_completion_weekly: {
        Row: {
          completed: number | null
          completion_rate_percent: number | null
          content_type: string | null
          organization_id: string | null
          started: number | null
          week_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      kpi_alert_events_weekly: {
        Row: {
          alerts: number | null
          event_type: string | null
          severity: string | null
          week_start: string | null
        }
        Relationships: []
      }
      kpi_edge_errors_weekly: {
        Row: {
          error_rate_percent: number | null
          errors: number | null
          function_name: string | null
          total_runs: number | null
          week_start: string | null
        }
        Relationships: []
      }
      kpi_job_fail_rate_weekly: {
        Row: {
          fail_rate_percent: number | null
          failed_runs: number | null
          job_name: string | null
          job_version: string | null
          total_runs: number | null
          week_start: string | null
        }
        Relationships: []
      }
      kpi_rls_denied_weekly: {
        Row: {
          events: number | null
          org_id: string | null
          reason: string | null
          week_start: string | null
        }
        Relationships: []
      }
      monthly_reports: {
        Row: {
          id: string | null
          level: string | null
          metrics: Json | null
          organization_id: string | null
          period_start: string | null
          plan_id: string | null
          status: Database["public"]["Enums"]["report_status"] | null
        }
        Insert: {
          id?: string | null
          level?: string | null
          metrics?: Json | null
          organization_id?: string | null
          period_start?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
        }
        Update: {
          id?: string | null
          level?: string | null
          metrics?: Json | null
          organization_id?: string | null
          period_start?: string | null
          plan_id?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
        }
        Relationships: []
      }
      mv_ai_citations_org_period: {
        Row: {
          avg_score: number | null
          citations_count: number | null
          day_bucket: string | null
          last_cited_at: string | null
          max_score: number | null
          organization_id: string | null
          source_key: string | null
          title: string | null
          total_quoted_chars: number | null
          total_quoted_tokens: number | null
          total_weight: number | null
          url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      mv_ai_interview_org_daily_metrics: {
        Row: {
          ai_call_count: number | null
          ai_used_session_count: number | null
          avg_question_count: number | null
          citations_item_count: number | null
          completed_session_count: number | null
          completion_rate: number | null
          day: string | null
          last_session_at: string | null
          organization_id: string | null
          quoted_tokens_sum: number | null
          session_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      mv_content_perf_ranking_v2: {
        Row: {
          citations_total: number | null
          last_cited_at: string | null
          organization_id: string | null
          responses_with_citations: number | null
          source_key: string | null
          title: string | null
          url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      mv_ops_audit_denorm: {
        Row: {
          action: string | null
          actor: string | null
          created_at: string | null
          id: number | null
          note: string | null
          scope: string | null
          ticket_id: string | null
          title: string | null
        }
        Relationships: []
      }
      news_active: {
        Row: {
          base_path: string | null
          category: string | null
          content: string | null
          content_hash: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string | null
          deleted_at: string | null
          id: string | null
          image_url: string | null
          is_featured: boolean | null
          is_published: boolean | null
          locale: string | null
          meta: Json | null
          organization_id: string | null
          published_at: string | null
          published_date: string | null
          region_code: string | null
          slug: string | null
          status: Database["public"]["Enums"]["cms_content_status"] | null
          summary: string | null
          title: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          base_path?: string | null
          category?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          organization_id?: string | null
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          base_path?: string | null
          category?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          organization_id?: string | null
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      news_public_minimal: {
        Row: {
          id: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      ops_audit_summary_30d: {
        Row: {
          action: string | null
          day: string | null
          endpoint: string | null
          operations: number | null
          status: string | null
        }
        Relationships: []
      }
      org_monthly_question_usage: {
        Row: {
          month: string | null
          organization_id: string | null
          question_count: number | null
        }
        Relationships: []
      }
      organizations_overview_v2: {
        Row: {
          ai_hits_30d: number | null
          ai_hits_7d: number | null
          availability_note: string | null
          availability_status: string | null
          case_studies_published: number | null
          faqs_published: number | null
          is_published: boolean | null
          name: string | null
          news_published: number | null
          organization_id: string | null
          posts_published: number | null
          products_published: number | null
          services_published: number | null
          slug: string | null
          verified: boolean | null
          verified_at: string | null
          views_30d: number | null
          views_7d: number | null
          visibility_score_sum: number | null
        }
        Relationships: []
      }
      organizations_with_owner: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string | null
          is_published: boolean | null
          name: string | null
          owner_email: string | null
          owner_name: string | null
          owner_user_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_organizations_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_organizations_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pg_policies_compat: {
        Row: {
          permissive: string | null
          polcmd: string | null
          polname: unknown
          polqual: string | null
          polroles: unknown[] | null
          polwithcheck: string | null
          roles: unknown[] | null
          schemaname: unknown
          tablename: unknown
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          default_config: Json | null
          display_order: number | null
          feature_id: string | null
          feature_key: string | null
          is_enabled: boolean | null
          is_required: boolean | null
          plan_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_v2_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_registry"
            referencedColumns: ["feature_id"]
          },
          {
            foreignKeyName: "plan_features_v2_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_features_v2_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_features_v2_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "v_plan_catalog"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "plan_features_v2_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "v_plan_catalog_v1"
            referencedColumns: ["plan_id"]
          },
        ]
      }
      posts_active: {
        Row: {
          base_path: string | null
          content: string | null
          content_hash: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          generation_source:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id: string | null
          interview_session_id: string | null
          is_ai_generated: boolean | null
          is_published: boolean | null
          locale: string | null
          meta: Json | null
          organization_id: string | null
          published_at: string | null
          region_code: string | null
          slug: string | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          base_path?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          organization_id?: string | null
          published_at?: string | null
          region_code?: string | null
          slug?: string | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          base_path?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          organization_id?: string | null
          published_at?: string | null
          region_code?: string | null
          slug?: string | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "posts_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "v_ai_interview_session_metrics"
            referencedColumns: ["session_id"]
          },
        ]
      }
      posts_public_minimal: {
        Row: {
          id: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      product_display_en_v1: {
        Row: {
          description: string | null
          is_primary: boolean | null
          lang: string | null
          name: string | null
          product_id: string | null
        }
        Relationships: []
      }
      product_display_ja_v1: {
        Row: {
          description: string | null
          is_primary: boolean | null
          lang: string | null
          name: string | null
          product_id: string | null
        }
        Relationships: []
      }
      products_active: {
        Row: {
          base_path: string | null
          content_hash: string | null
          created_at: string | null
          deleted_at: string | null
          id: string | null
          image_url: string | null
          is_published: boolean | null
          organization_id: string | null
          published_at: string | null
          sku: string | null
          slug: string | null
          tenant_id: string | null
          url: string | null
        }
        Insert: {
          base_path?: string | null
          content_hash?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          image_url?: string | null
          is_published?: boolean | null
          organization_id?: string | null
          published_at?: string | null
          sku?: string | null
          slug?: string | null
          tenant_id?: string | null
          url?: string | null
        }
        Update: {
          base_path?: string | null
          content_hash?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          image_url?: string | null
          is_published?: boolean | null
          organization_id?: string | null
          published_at?: string | null
          sku?: string | null
          slug?: string | null
          tenant_id?: string | null
          url?: string | null
        }
        Relationships: []
      }
      products_public_minimal: {
        Row: {
          id: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          summary?: never
          title?: never
          updated_at?: never
        }
        Update: {
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          summary?: never
          title?: never
          updated_at?: never
        }
        Relationships: []
      }
      public_case_studies: {
        Row: {
          hero_image_url: string | null
          id: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          hero_image_url?: never
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          hero_image_url?: never
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      public_case_studies_jsonld: {
        Row: {
          case_study_id: string | null
          inlanguage: string | null
          jsonld: Json | null
          last_modified: string | null
          organization_id: string | null
          service_id: string | null
        }
        Insert: {
          case_study_id?: string | null
          inlanguage?: never
          jsonld?: never
          last_modified?: string | null
          organization_id?: string | null
          service_id?: string | null
        }
        Update: {
          case_study_id?: string | null
          inlanguage?: never
          jsonld?: never
          last_modified?: string | null
          organization_id?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services_jsonld"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "view_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      public_content_view: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          entity_type: string | null
          id: string | null
          is_published: boolean | null
          lang: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Relationships: []
      }
      public_faqs_jsonld: {
        Row: {
          faq_id: string | null
          inlanguage: string | null
          jsonld: Json | null
          last_modified: string | null
          organization_id: string | null
          service_id: string | null
        }
        Insert: {
          faq_id?: string | null
          inlanguage?: never
          jsonld?: never
          last_modified?: string | null
          organization_id?: string | null
          service_id?: string | null
        }
        Update: {
          faq_id?: string | null
          inlanguage?: never
          jsonld?: never
          last_modified?: string | null
          organization_id?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services_jsonld"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "view_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      public_news: {
        Row: {
          id: string | null
          image_url: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          image_url?: never
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          image_url?: never
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      public_news_jsonld: {
        Row: {
          inlanguage: string | null
          jsonld: Json | null
          last_modified: string | null
          news_id: string | null
          organization_id: string | null
        }
        Insert: {
          inlanguage?: never
          jsonld?: never
          last_modified?: never
          news_id?: string | null
          organization_id?: string | null
        }
        Update: {
          inlanguage?: never
          jsonld?: never
          last_modified?: never
          news_id?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      public_organizations: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          description: string | null
          established_at: string | null
          id: string | null
          industries: string[] | null
          is_published: boolean | null
          logo_url: string | null
          name: string | null
          prefecture: string | null
          same_as: string[] | null
          slug: string | null
          source_urls: string[] | null
          updated_at: string | null
          url: string | null
          verification_source: string | null
          verified: boolean | null
          verified_at: string | null
          website_url: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          established_at?: string | null
          id?: string | null
          industries?: string[] | null
          is_published?: boolean | null
          logo_url?: string | null
          name?: string | null
          prefecture?: string | null
          same_as?: string[] | null
          slug?: string | null
          source_urls?: string[] | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          website_url?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          established_at?: string | null
          id?: string | null
          industries?: string[] | null
          is_published?: boolean | null
          logo_url?: string | null
          name?: string | null
          prefecture?: string | null
          same_as?: string[] | null
          slug?: string | null
          source_urls?: string[] | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      public_posts: {
        Row: {
          id: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      public_posts_jsonld: {
        Row: {
          inlanguage: string | null
          jsonld: Json | null
          last_modified: string | null
          organization_id: string | null
          post_id: string | null
        }
        Insert: {
          inlanguage?: never
          jsonld?: never
          last_modified?: never
          organization_id?: string | null
          post_id?: string | null
        }
        Update: {
          inlanguage?: never
          jsonld?: never
          last_modified?: never
          organization_id?: string | null
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      public_products: {
        Row: {
          created_at: string | null
          description: string | null
          image_url: string | null
          inlanguage: string | null
          name: string | null
          organization_id: string | null
          product_id: string | null
          schema_type: string | null
          sku: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          image_url?: never
          inlanguage?: string | null
          name?: string | null
          organization_id?: string | null
          product_id?: string | null
          schema_type?: never
          sku?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          image_url?: never
          inlanguage?: string | null
          name?: string | null
          organization_id?: string | null
          product_id?: string | null
          schema_type?: never
          sku?: string | null
          url?: string | null
        }
        Relationships: []
      }
      public_services: {
        Row: {
          icon_url: string | null
          id: string | null
          name: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          icon_url?: never
          id?: string | null
          name?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          icon_url?: never
          id?: string | null
          name?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      public_services_jsonld: {
        Row: {
          inlanguage: string | null
          jsonld: Json | null
          last_modified: string | null
          organization_id: string | null
          service_id: string | null
        }
        Insert: {
          inlanguage?: never
          jsonld?: never
          last_modified?: string | null
          organization_id?: string | null
          service_id?: string | null
        }
        Update: {
          inlanguage?: never
          jsonld?: never
          last_modified?: string | null
          organization_id?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      qna_stats: {
        Row: {
          answers: number | null
          org_id: string | null
          period_end: string | null
          period_start: string | null
          questions: number | null
          total_events: number | null
        }
        Relationships: [
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qna_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      rate_limit_statistics: {
        Row: {
          bot_requests: number | null
          critical_requests: number | null
          high_risk_requests: number | null
          hour: string | null
          suspicious_requests: number | null
          total_requests: number | null
          unique_ips: number | null
          unique_user_agents: number | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          id: string | null
          metrics: Json | null
          month_bucket: string | null
          organization_id: string | null
          period_end: string | null
          period_start: string | null
          sections: Json | null
          status: string | null
          summary_text: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          metrics?: Json | null
          month_bucket?: string | null
          organization_id?: string | null
          period_end?: string | null
          period_start?: string | null
          sections?: Json | null
          status?: never
          summary_text?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          metrics?: Json | null
          month_bucket?: string | null
          organization_id?: string | null
          period_end?: string | null
          period_start?: string | null
          sections?: Json | null
          status?: never
          summary_text?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      security_incident_statistics: {
        Row: {
          blocked_count: number | null
          critical_count: number | null
          hour: string | null
          incident_count: number | null
          incident_type: string | null
          unique_ips: number | null
        }
        Relationships: []
      }
      services_active: {
        Row: {
          api_available: boolean | null
          availability_note: string | null
          availability_status: string | null
          base_path: string | null
          categories: string[] | null
          category: string | null
          content_hash: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          duration_months: number | null
          features: string[] | null
          free_trial: boolean | null
          id: string | null
          image_url: string | null
          is_published: boolean | null
          locale: string | null
          logo_url: string | null
          name: string | null
          organization_id: string | null
          price: string | null
          price_range: string | null
          published_at: string | null
          region_code: string | null
          screenshots: string[] | null
          slug: string | null
          source_urls: string[] | null
          status: string | null
          summary: string | null
          supported_platforms: string[] | null
          updated_at: string | null
          url: string | null
          verification_source: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          video_url: string | null
        }
        Insert: {
          api_available?: boolean | null
          availability_note?: string | null
          availability_status?: string | null
          base_path?: string | null
          categories?: string[] | null
          category?: string | null
          content_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_months?: number | null
          features?: string[] | null
          free_trial?: boolean | null
          id?: string | null
          image_url?: string | null
          is_published?: boolean | null
          locale?: string | null
          logo_url?: string | null
          name?: string | null
          organization_id?: string | null
          price?: string | null
          price_range?: string | null
          published_at?: string | null
          region_code?: string | null
          screenshots?: string[] | null
          slug?: string | null
          source_urls?: string[] | null
          status?: string | null
          summary?: string | null
          supported_platforms?: string[] | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          video_url?: string | null
        }
        Update: {
          api_available?: boolean | null
          availability_note?: string | null
          availability_status?: string | null
          base_path?: string | null
          categories?: string[] | null
          category?: string | null
          content_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_months?: number | null
          features?: string[] | null
          free_trial?: boolean | null
          id?: string | null
          image_url?: string | null
          is_published?: boolean | null
          locale?: string | null
          logo_url?: string | null
          name?: string | null
          organization_id?: string | null
          price?: string | null
          price_range?: string | null
          published_at?: string | null
          region_code?: string | null
          screenshots?: string[] | null
          slug?: string | null
          source_urls?: string[] | null
          status?: string | null
          summary?: string | null
          supported_platforms?: string[] | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "services_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      services_public_minimal: {
        Row: {
          id: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          summary?: never
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          summary?: never
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string | null
          logo_url: string | null
          organization_id: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          theme_color: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string | null
          logo_url?: string | null
          organization_id?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          theme_color?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string | null
          logo_url?: string | null
          organization_id?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          theme_color?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_site_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      user_organizations: {
        Row: {
          entitlements: Json | null
          feature_flags: Json | null
          is_published: boolean | null
          name: string | null
          org_created_at: string | null
          organization_id: string | null
          plan_id: string | null
          role: string | null
          slug: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_members_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      user_violation_stats: {
        Row: {
          full_name: string | null
          high_violations_1y: number | null
          is_chronic_offender: boolean | null
          is_high_risk_1y: boolean | null
          is_often_violated_1y: boolean | null
          last_enforcement_action: string | null
          last_enforcement_at: string | null
          last_violation_at: string | null
          last_violation_rule: string | null
          last_violation_severity: string | null
          role: string | null
          total_violations: number | null
          user_id: string | null
          violations_1y: number | null
          violations_2y: number | null
          violations_3y: number | null
          violations_6m: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      v_admin_alerts_latest: {
        Row: {
          created_at: string | null
          description: string | null
          detected_at: string | null
          event_type: string | null
          id: string | null
          organization_id: string | null
          severity: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          detected_at?: string | null
          event_type?: string | null
          id?: string | null
          organization_id?: string | null
          severity?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          detected_at?: string | null
          event_type?: string | null
          id?: string | null
          organization_id?: string | null
          severity?: string | null
          title?: string | null
        }
        Relationships: []
      }
      v_ai_citations_aggregates: {
        Row: {
          avg_score: number | null
          citations_count: number | null
          last_cited_at: string | null
          max_score: number | null
          model: string | null
          organization_id: string | null
          response_created_at: string | null
          response_id: string | null
          session_id: string | null
          source_key: string | null
          title: string | null
          total_quoted_chars: number | null
          total_quoted_tokens: number | null
          total_weight: number | null
          url: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_ai_interview_session_metrics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "fk_acr_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ai_citations_compat: {
        Row: {
          content: string | null
          created_at: string | null
          id: string | null
          source_url: string | null
        }
        Relationships: []
      }
      v_ai_citations_daily: {
        Row: {
          answers: number | null
          cited_answers: number | null
          day: string | null
          organization_id: string | null
          orphan_items: number | null
          zero_cite_answers: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_ai_citations_integrity_daily: {
        Row: {
          day: string | null
          duplicate_pairs: number | null
          organization_id: string | null
          orphan_items: number | null
          responses_without_items: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_ai_content_units_compat: {
        Row: {
          content: string | null
          content_type: string | null
          description: string | null
          id: string | null
          last_updated: string | null
          meta: Json | null
          order_no: number | null
          organization_id: string | null
          section_key: string | null
          session_id: string | null
          title: string | null
          url: string | null
        }
        Insert: {
          content?: never
          content_type?: string | null
          description?: string | null
          id?: string | null
          last_updated?: string | null
          meta?: never
          order_no?: never
          organization_id?: string | null
          section_key?: never
          session_id?: never
          title?: string | null
          url?: string | null
        }
        Update: {
          content?: never
          content_type?: string | null
          description?: string | null
          id?: string | null
          last_updated?: string | null
          meta?: never
          order_no?: never
          organization_id?: string | null
          section_key?: never
          session_id?: never
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_ai_disclosure_published: {
        Row: {
          data_json: Json | null
          doc_type: string | null
          id: string | null
          public_slug: string | null
          published_at: string | null
          version: string | null
        }
        Insert: {
          data_json?: Json | null
          doc_type?: string | null
          id?: string | null
          public_slug?: string | null
          published_at?: string | null
          version?: string | null
        }
        Update: {
          data_json?: Json | null
          doc_type?: string | null
          id?: string | null
          public_slug?: string | null
          published_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      v_ai_generated_contents: {
        Row: {
          base_path: string | null
          content_id: string | null
          content_type: string | null
          created_at: string | null
          generation_source: string | null
          interview_session_id: string | null
          is_ai_generated: boolean | null
          locale: string | null
          organization_id: string | null
          region_code: string | null
          slug: string | null
          status: string | null
          table_name: string | null
        }
        Relationships: []
      }
      v_ai_interview_org_daily_metrics: {
        Row: {
          ai_call_count: number | null
          ai_used_session_count: number | null
          avg_question_count: number | null
          citations_item_count: number | null
          completed_session_count: number | null
          completion_rate: number | null
          day: string | null
          last_session_at: string | null
          organization_id: string | null
          quoted_tokens_sum: number | null
          session_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_ai_interview_session_metrics: {
        Row: {
          ai_response_count: number | null
          ai_used: boolean | null
          citations_item_count: number | null
          content_type:
            | Database["public"]["Enums"]["interview_content_type"]
            | null
          created_at: string | null
          day: string | null
          has_generated_content: boolean | null
          organization_id: string | null
          question_count: number | null
          quoted_tokens_sum: number | null
          session_id: string | null
          status: Database["public"]["Enums"]["interview_session_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_ai_monthly_reports_latest: {
        Row: {
          created_at: string | null
          id: string | null
          level: string | null
          metrics: Json | null
          organization_id: string | null
          period_end: string | null
          period_start: string | null
          plan_id: string | null
          sections: Json | null
          status: Database["public"]["Enums"]["report_status"] | null
          status_text: string | null
          suggestions: Json | null
          summary_text: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          level?: string | null
          metrics?: Json | null
          organization_id?: string | null
          period_end?: string | null
          period_start?: string | null
          plan_id?: string | null
          sections?: Json | null
          status?: Database["public"]["Enums"]["report_status"] | null
          status_text?: never
          suggestions?: Json | null
          summary_text?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          level?: string | null
          metrics?: Json | null
          organization_id?: string | null
          period_end?: string | null
          period_start?: string | null
          plan_id?: string | null
          sections?: Json | null
          status?: Database["public"]["Enums"]["report_status"] | null
          status_text?: never
          suggestions?: Json | null
          summary_text?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_ai_response_groups_v2: {
        Row: {
          model: string | null
          organization_id: string | null
          response_created_at: string | null
          response_id: string | null
          session_id: string | null
          sources: Json | null
          sources_count: number | null
          total_citations: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_acr_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_acr_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_ai_interview_session_metrics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "fk_acr_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      v_alert_events: {
        Row: {
          actual_value: string | null
          created_at: string | null
          details: Json | null
          event_key: string | null
          event_source_table: string | null
          event_type: string | null
          id: string | null
          ip_address: unknown
          organization_id: string | null
          severity: string | null
          source_id: string | null
          threshold_key: string | null
          threshold_value: string | null
        }
        Insert: {
          actual_value?: string | null
          created_at?: string | null
          details?: Json | null
          event_key?: string | null
          event_source_table?: string | null
          event_type?: string | null
          id?: string | null
          ip_address?: unknown
          organization_id?: string | null
          severity?: string | null
          source_id?: string | null
          threshold_key?: string | null
          threshold_value?: string | null
        }
        Update: {
          actual_value?: string | null
          created_at?: string | null
          details?: Json | null
          event_key?: string | null
          event_source_table?: string | null
          event_type?: string | null
          id?: string | null
          ip_address?: unknown
          organization_id?: string | null
          severity?: string | null
          source_id?: string | null
          threshold_key?: string | null
          threshold_value?: string | null
        }
        Relationships: []
      }
      v_alert_sources: {
        Row: {
          alert_source_id: number | null
          alert_source_table: string | null
          alert_where_key: string | null
          alert_where_sql: string | null
        }
        Insert: {
          alert_source_id?: number | null
          alert_source_table?: string | null
          alert_where_key?: string | null
          alert_where_sql?: string | null
        }
        Update: {
          alert_source_id?: number | null
          alert_source_table?: string | null
          alert_where_key?: string | null
          alert_where_sql?: string | null
        }
        Relationships: []
      }
      v_app_users_compat2: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string | null
          last_sign_in_at: string | null
          organization_id: string | null
          phone: string | null
          phone_verified: boolean | null
          plan: string | null
          role: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_case_studies: {
        Row: {
          availability_note: string | null
          availability_status: string | null
          base_path: string | null
          challenge: string | null
          client_industry: string | null
          client_name: string | null
          client_size: string | null
          content: string | null
          content_hash: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          generation_source:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id: string | null
          industry: string | null
          interview_session_id: string | null
          is_ai_generated: boolean | null
          is_anonymous: boolean | null
          is_published: boolean | null
          locale: string | null
          meta: Json | null
          metrics: Json | null
          organization_id: string | null
          outcome: string | null
          problem: string | null
          published_at: string | null
          published_date: string | null
          region_code: string | null
          result: string | null
          service_id: string | null
          slug: string | null
          solution: string | null
          source_urls: string[] | null
          status: string | null
          summary: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          url: string | null
          verification_source: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          availability_note?: string | null
          availability_status?: string | null
          base_path?: string | null
          challenge?: string | null
          client_industry?: string | null
          client_name?: string | null
          client_size?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string | null
          industry?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean | null
          is_anonymous?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          metrics?: Json | null
          organization_id?: string | null
          outcome?: string | null
          problem?: string | null
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          result?: string | null
          service_id?: string | null
          slug?: string | null
          solution?: string | null
          source_urls?: string[] | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          availability_note?: string | null
          availability_status?: string | null
          base_path?: string | null
          challenge?: string | null
          client_industry?: string | null
          client_name?: string | null
          client_size?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string | null
          industry?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean | null
          is_anonymous?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          metrics?: Json | null
          organization_id?: string | null
          outcome?: string | null
          problem?: string | null
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          result?: string | null
          service_id?: string | null
          slug?: string | null
          solution?: string | null
          source_urls?: string[] | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_studies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "v_ai_interview_session_metrics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services_jsonld"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "view_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_comprehensive_analytics_compat: {
        Row: {
          active_orgs: number | null
          generated_at: string | null
          total_answers: number | null
          total_interviews: number | null
          total_questions: number | null
        }
        Relationships: []
      }
      v_crawler_policy_current: {
        Row: {
          created_at: string | null
          created_by: string | null
          effective_from: string | null
          effective_to: string | null
          id: string | null
          policy_json: Json | null
        }
        Relationships: []
      }
      v_current_user_org: {
        Row: {
          organization_id: string | null
          role: string | null
          role_prio: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_members_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      v_current_user_orgs: {
        Row: {
          name: string | null
          organization_id: string | null
          plan: string | null
          role: string | null
          slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_dashboard_case_studies: {
        Row: {
          base_path: string | null
          created_at: string | null
          id: string | null
          is_published: boolean | null
          locale: string | null
          org_is_published: boolean | null
          org_slug: string | null
          org_status: Database["public"]["Enums"]["organization_status"] | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_dashboard_case_studies_secure: {
        Row: {
          client_name: string | null
          created_at: string | null
          id: string | null
          industry: string | null
          is_published: boolean | null
          organization_id: string | null
          problem: string | null
          published_at: string | null
          result: string | null
          slug: string | null
          solution: string | null
          status: string | null
          summary: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          client_name?: string | null
          created_at?: string | null
          id?: string | null
          industry?: string | null
          is_published?: boolean | null
          organization_id?: string | null
          problem?: string | null
          published_at?: string | null
          result?: string | null
          slug?: string | null
          solution?: string | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          client_name?: string | null
          created_at?: string | null
          id?: string | null
          industry?: string | null
          is_published?: boolean | null
          organization_id?: string | null
          problem?: string | null
          published_at?: string | null
          result?: string | null
          slug?: string | null
          solution?: string | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_dashboard_faqs_secure: {
        Row: {
          answer: string | null
          category: string | null
          created_at: string | null
          id: string | null
          is_published: boolean | null
          organization_id: string | null
          published_at: string | null
          question: string | null
          slug: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          answer?: string | null
          category?: string | null
          created_at?: string | null
          id?: string | null
          is_published?: boolean | null
          organization_id?: string | null
          published_at?: string | null
          question?: string | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          answer?: string | null
          category?: string | null
          created_at?: string | null
          id?: string | null
          is_published?: boolean | null
          organization_id?: string | null
          published_at?: string | null
          question?: string | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_dashboard_posts: {
        Row: {
          base_path: string | null
          content: string | null
          created_at: string | null
          id: string | null
          is_published: boolean | null
          locale: string | null
          org_is_published: boolean | null
          org_slug: string | null
          org_status: Database["public"]["Enums"]["organization_status"] | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_dashboard_posts_secure: {
        Row: {
          created_at: string | null
          id: string | null
          is_published: boolean | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_published?: boolean | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_published?: boolean | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_dashboard_services: {
        Row: {
          base_path: string | null
          content_url: string | null
          created_at: string | null
          id: string | null
          is_published: boolean | null
          locale: string | null
          org_is_published: boolean | null
          org_slug: string | null
          org_status: Database["public"]["Enums"]["organization_status"] | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_dashboard_services_secure: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          duration_months: number | null
          id: string | null
          is_published: boolean | null
          name: string | null
          organization_id: string | null
          price: number | null
          published_at: string | null
          slug: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_months?: number | null
          id?: string | null
          is_published?: boolean | null
          name?: string | null
          organization_id?: string | null
          price?: never
          published_at?: string | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_months?: number | null
          id?: string | null
          is_published?: boolean | null
          name?: string | null
          organization_id?: string | null
          price?: never
          published_at?: string | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_dashboard_stats_compat: {
        Row: {
          active_orgs: number | null
          alerts_count: number | null
          total_users: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_disclosures_admin_list: {
        Row: {
          created_at: string | null
          created_by: string | null
          doc_type: string | null
          effective_date: string | null
          id: string | null
          public_slug: string | null
          published_at: string | null
          published_by: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          doc_type?: string | null
          effective_date?: string | null
          id?: string | null
          public_slug?: string | null
          published_at?: string | null
          published_by?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          doc_type?: string | null
          effective_date?: string | null
          id?: string | null
          public_slug?: string | null
          published_at?: string | null
          published_by?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      v_disclosures_published_latest: {
        Row: {
          data_json: Json | null
          effective_date: string | null
          id: string | null
          pdf_object_path: string | null
          public_slug: string | null
          published_at: string | null
          summary_md: string | null
          title: string | null
          version: string | null
        }
        Relationships: []
      }
      v_faqs_published: {
        Row: {
          answer_html: string | null
          answer_plain: string | null
          base_locale: string | null
          base_path: string | null
          id: string | null
          is_published: boolean | null
          lang: string | null
          organization_id: string | null
          published_at: string | null
          question: string | null
          slug: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_faqs_published_v2: {
        Row: {
          answer: string | null
          answer_plain: string | null
          base_path: string | null
          has_translation: boolean | null
          id: string | null
          lang: string | null
          organization_id: string | null
          published_at: string | null
          question: string | null
          slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_gsc_analytics_compat: {
        Row: {
          clicks: number | null
          ctr: number | null
          generated_at: string | null
          impressions: number | null
          position: number | null
        }
        Relationships: []
      }
      v_job_failures_24h: {
        Row: {
          failures: number | null
          job_name: string | null
        }
        Relationships: []
      }
      v_job_runs_duration_7d: {
        Row: {
          avg_ms: number | null
          job_name: string | null
          p50_ms: number | null
          p90_ms: number | null
          p95_ms: number | null
          p99_ms: number | null
          running_now: number | null
        }
        Relationships: []
      }
      v_job_runs_failures_top_7d: {
        Row: {
          failed_count: number | null
          job_name: string | null
          last_failed_at: string | null
        }
        Relationships: []
      }
      v_job_runs_metrics_7d: {
        Row: {
          avg_duration_ms: number | null
          failed_runs: number | null
          job_name: string | null
          last_finished_at: string | null
          last_started_at: string | null
          p95_duration_ms: number | null
          succeeded_runs: number | null
          success_rate_pct: number | null
          total_runs: number | null
        }
        Relationships: []
      }
      v_materials_public: {
        Row: {
          created_at: string | null
          file_key: string | null
          id: string | null
          mime_type: string | null
          owner_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_key?: string | null
          id?: string | null
          mime_type?: string | null
          owner_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_key?: string | null
          id?: string | null
          mime_type?: string | null
          owner_id?: string | null
        }
        Relationships: []
      }
      v_monthly_reports_synced: {
        Row: {
          created_at: string | null
          id: string | null
          metrics: Json | null
          organization_id: string | null
          period_end: string | null
          period_start: string | null
          sections: Json | null
          status: string | null
          suggestions: Json | null
          summary_text: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          metrics?: Json | null
          organization_id?: string | null
          period_end?: string | null
          period_start?: string | null
          sections?: Json | null
          status?: never
          suggestions?: Json | null
          summary_text?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          metrics?: Json | null
          organization_id?: string | null
          period_end?: string | null
          period_start?: string | null
          sections?: Json | null
          status?: never
          suggestions?: Json | null
          summary_text?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_my_subscription: {
        Row: {
          ends_at: string | null
          id: string | null
          plan_id: string | null
          starts_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          ends_at?: string | null
          id?: string | null
          plan_id?: string | null
          starts_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          ends_at?: string | null
          id?: string | null
          plan_id?: string | null
          starts_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_news: {
        Row: {
          base_path: string | null
          category: string | null
          content: string | null
          content_hash: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string | null
          deleted_at: string | null
          id: string | null
          image_url: string | null
          is_featured: boolean | null
          is_published: boolean | null
          locale: string | null
          meta: Json | null
          organization_id: string | null
          published_at: string | null
          published_date: string | null
          region_code: string | null
          slug: string | null
          status: Database["public"]["Enums"]["cms_content_status"] | null
          summary: string | null
          title: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          base_path?: string | null
          category?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          organization_id?: string | null
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          base_path?: string | null
          category?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          organization_id?: string | null
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_orgs_visible: {
        Row: {
          address: string | null
          address_country: string | null
          address_locality: string | null
          address_postal_code: string | null
          address_region: string | null
          address_street: string | null
          availability_note: string | null
          availability_status: string | null
          capital: number | null
          city: string | null
          contact_email: string | null
          content_hash: string | null
          corporate_number: string | null
          corporate_type: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          data_status:
            | Database["public"]["Enums"]["organization_data_status"]
            | null
          default_locale: string | null
          description: string | null
          discount_group: string | null
          email: string | null
          email_public: boolean | null
          employees: number | null
          entitlements: Json | null
          established_at: string | null
          feature_flags: Json | null
          id: string | null
          industries: string[] | null
          is_published: boolean | null
          lat: number | null
          legal_form: string | null
          lng: number | null
          logo_url: string | null
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          name: string | null
          original_signup_campaign: string | null
          partner_id: string | null
          phone: string | null
          plan: string | null
          postal_code: string | null
          prefecture: string | null
          region_code: string | null
          representative_name: string | null
          same_as: string[] | null
          show_case_studies: boolean | null
          show_contact: boolean | null
          show_faqs: boolean | null
          show_news: boolean | null
          show_partnership: boolean | null
          show_posts: boolean | null
          show_qa: boolean | null
          show_services: boolean | null
          slug: string | null
          source_urls: string[] | null
          status: Database["public"]["Enums"]["organization_status"] | null
          street_address: string | null
          telephone: string | null
          updated_at: string | null
          url: string | null
          user_id: string | null
          verification_source: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          address_country?: string | null
          address_locality?: string | null
          address_postal_code?: string | null
          address_region?: string | null
          address_street?: string | null
          availability_note?: string | null
          availability_status?: string | null
          capital?: number | null
          city?: string | null
          contact_email?: string | null
          content_hash?: string | null
          corporate_number?: string | null
          corporate_type?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          data_status?:
            | Database["public"]["Enums"]["organization_data_status"]
            | null
          default_locale?: string | null
          description?: string | null
          discount_group?: string | null
          email?: string | null
          email_public?: boolean | null
          employees?: number | null
          entitlements?: Json | null
          established_at?: string | null
          feature_flags?: Json | null
          id?: string | null
          industries?: string[] | null
          is_published?: boolean | null
          lat?: number | null
          legal_form?: string | null
          lng?: number | null
          logo_url?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          name?: string | null
          original_signup_campaign?: string | null
          partner_id?: string | null
          phone?: string | null
          plan?: string | null
          postal_code?: string | null
          prefecture?: string | null
          region_code?: string | null
          representative_name?: string | null
          same_as?: string[] | null
          show_case_studies?: boolean | null
          show_contact?: boolean | null
          show_faqs?: boolean | null
          show_news?: boolean | null
          show_partnership?: boolean | null
          show_posts?: boolean | null
          show_qa?: boolean | null
          show_services?: boolean | null
          slug?: string | null
          source_urls?: string[] | null
          status?: Database["public"]["Enums"]["organization_status"] | null
          street_address?: string | null
          telephone?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          address_country?: string | null
          address_locality?: string | null
          address_postal_code?: string | null
          address_region?: string | null
          address_street?: string | null
          availability_note?: string | null
          availability_status?: string | null
          capital?: number | null
          city?: string | null
          contact_email?: string | null
          content_hash?: string | null
          corporate_number?: string | null
          corporate_type?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          data_status?:
            | Database["public"]["Enums"]["organization_data_status"]
            | null
          default_locale?: string | null
          description?: string | null
          discount_group?: string | null
          email?: string | null
          email_public?: boolean | null
          employees?: number | null
          entitlements?: Json | null
          established_at?: string | null
          feature_flags?: Json | null
          id?: string | null
          industries?: string[] | null
          is_published?: boolean | null
          lat?: number | null
          legal_form?: string | null
          lng?: number | null
          logo_url?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          name?: string | null
          original_signup_campaign?: string | null
          partner_id?: string | null
          phone?: string | null
          plan?: string | null
          postal_code?: string | null
          prefecture?: string | null
          region_code?: string | null
          representative_name?: string | null
          same_as?: string[] | null
          show_case_studies?: boolean | null
          show_contact?: boolean | null
          show_faqs?: boolean | null
          show_news?: boolean | null
          show_partnership?: boolean | null
          show_posts?: boolean | null
          show_qa?: boolean | null
          show_services?: boolean | null
          slug?: string | null
          source_urls?: string[] | null
          status?: Database["public"]["Enums"]["organization_status"] | null
          street_address?: string | null
          telephone?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_organizations_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_organizations_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organizations_partner"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organizations_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_organizations_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      v_plan_catalog: {
        Row: {
          default_config: Json | null
          display_order: number | null
          feature_id: string | null
          is_enabled: boolean | null
          is_required: boolean | null
          limit_key: string | null
          limit_value: number | null
          name: string | null
          period: string | null
          plan_id: string | null
          reset_day: number | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_v2_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_registry"
            referencedColumns: ["feature_id"]
          },
          {
            foreignKeyName: "plan_features_v2_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      v_plan_catalog_v1: {
        Row: {
          default_config: Json | null
          display_order: number | null
          feature_id: string | null
          feature_key: string | null
          feature_status: string | null
          is_enabled: boolean | null
          is_required: boolean | null
          limit_key: string | null
          limit_value: number | null
          period: string | null
          plan_id: string | null
          plan_name: string | null
          plan_status: string | null
          reset_day: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_v2_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_registry"
            referencedColumns: ["feature_id"]
          },
          {
            foreignKeyName: "plan_features_v2_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      v_posts: {
        Row: {
          base_path: string | null
          content: string | null
          content_hash: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          generation_source:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id: string | null
          interview_session_id: string | null
          is_ai_generated: boolean | null
          is_published: boolean | null
          locale: string | null
          meta: Json | null
          organization_id: string | null
          published_at: string | null
          region_code: string | null
          slug: string | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          base_path?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          organization_id?: string | null
          published_at?: string | null
          region_code?: string | null
          slug?: string | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          base_path?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          organization_id?: string | null
          published_at?: string | null
          region_code?: string | null
          slug?: string | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "posts_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "v_ai_interview_session_metrics"
            referencedColumns: ["session_id"]
          },
        ]
      }
      v_products: {
        Row: {
          base_path: string | null
          content_hash: string | null
          created_at: string | null
          deleted_at: string | null
          id: string | null
          image_url: string | null
          is_published: boolean | null
          organization_id: string | null
          published_at: string | null
          sku: string | null
          slug: string | null
          tenant_id: string | null
          url: string | null
        }
        Insert: {
          base_path?: string | null
          content_hash?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          image_url?: string | null
          is_published?: boolean | null
          organization_id?: string | null
          published_at?: string | null
          sku?: string | null
          slug?: string | null
          tenant_id?: string | null
          url?: string | null
        }
        Update: {
          base_path?: string | null
          content_hash?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          image_url?: string | null
          is_published?: boolean | null
          organization_id?: string | null
          published_at?: string | null
          sku?: string | null
          slug?: string | null
          tenant_id?: string | null
          url?: string | null
        }
        Relationships: []
      }
      v_project_tasks: {
        Row: {
          owner_id: string | null
          project_created_at: string | null
          project_id: string | null
          project_name: string | null
          task_created_at: string | null
          task_created_by: string | null
          task_id: string | null
          task_status: string | null
          task_title: string | null
          tenant_id: string | null
        }
        Relationships: []
      }
      v_public_case_studies: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string | null
          is_published: boolean | null
          lang: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      v_public_case_studies_new: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string | null
          is_published: boolean | null
          lang: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      v_public_content_base: {
        Row: {
          body_html: string | null
          body_text: string | null
          canonical_path: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string | null
          lang: string | null
          org_id: string | null
          published_at: string | null
          slug: string | null
          summary: string | null
          title: string | null
          type: string | null
        }
        Relationships: []
      }
      v_public_jobs: {
        Row: {
          active: boolean | null
          command: string | null
          job_id: number | null
          job_name: string | null
          schedule: string | null
        }
        Relationships: []
      }
      v_public_jobs_readable: {
        Row: {
          active: boolean | null
          command: string | null
          job_id: number | null
          job_name: string | null
          schedule: string | null
        }
        Relationships: []
      }
      v_public_news: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string | null
          is_published: boolean | null
          lang: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      v_public_news_new: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string | null
          is_published: boolean | null
          lang: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      v_public_ops_audit: {
        Row: {
          action: string | null
          created_at: string | null
          details: Json | null
          id: number | null
          scope: string | null
          title: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: number | null
          scope?: string | null
          title?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: number | null
          scope?: string | null
          title?: string | null
        }
        Relationships: []
      }
      v_public_ops_audit_daily: {
        Row: {
          action: string | null
          cnt: number | null
          day: string | null
          scope: string | null
        }
        Relationships: []
      }
      v_public_organizations: {
        Row: {
          address_locality: string | null
          address_region: string | null
          created_at: string | null
          description: string | null
          email: string | null
          email_public: boolean | null
          id: string | null
          industries: string[] | null
          is_published: boolean | null
          logo_url: string | null
          name: string | null
          slug: string | null
          status: Database["public"]["Enums"]["organization_status"] | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          address_locality?: string | null
          address_region?: string | null
          created_at?: string | null
          description?: string | null
          email?: never
          email_public?: boolean | null
          id?: string | null
          industries?: string[] | null
          is_published?: boolean | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["organization_status"] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          address_locality?: string | null
          address_region?: string | null
          created_at?: string | null
          description?: string | null
          email?: never
          email_public?: boolean | null
          id?: string | null
          industries?: string[] | null
          is_published?: boolean | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["organization_status"] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      v_public_posts: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string | null
          is_published: boolean | null
          lang: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      v_public_posts_new: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string | null
          is_published: boolean | null
          lang: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      v_public_products: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string | null
          is_published: boolean | null
          lang: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      v_public_products_new: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string | null
          is_published: boolean | null
          lang: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      v_public_qa_entries: {
        Row: {
          answer: string | null
          category_id: string | null
          created_at: string | null
          id: string | null
          organization_id: string | null
          published_at: string | null
          question: string | null
          status: Database["public"]["Enums"]["cms_content_status"] | null
          tags: string[] | null
          updated_at: string | null
          visibility: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qa_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "qa_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_qa_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      v_public_services: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string | null
          is_published: boolean | null
          lang: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      v_public_services_new: {
        Row: {
          base_path: string | null
          body_html: string | null
          canonical_url: string | null
          content_hash: string | null
          id: string | null
          is_published: boolean | null
          lang: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          source_ids: Json | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          base_path?: string | null
          body_html?: string | null
          canonical_url?: string | null
          content_hash?: string | null
          id?: string | null
          is_published?: boolean | null
          lang?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          source_ids?: Json | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      v_qna_stats: {
        Row: {
          org_id: string | null
          period_end: string | null
          period_start: string | null
          total_archived: number | null
          total_draft: number | null
          total_published: number | null
          updates_last_7d: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      v_qna_stats_compat: {
        Row: {
          total_answers: number | null
          total_questions: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_questions: {
        Row: {
          answer: string | null
          category_id: string | null
          created_at: string | null
          id: string | null
          organization_id: string | null
          published_at: string | null
          question: string | null
          slug: string | null
          status: Database["public"]["Enums"]["cms_content_status"] | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          answer?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          question?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          answer?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          question?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qa_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "qa_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_qa_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      v_questions_compat: {
        Row: {
          answer_text: string | null
          answered_at: string | null
          answered_by: string | null
          answered_by_full_name: string | null
          author_email: string | null
          author_full_name: string | null
          body: string | null
          company_id: string | null
          created_at: string | null
          id: string | null
          organization_name: string | null
          question_text: string | null
          status: Database["public"]["Enums"]["cms_content_status"] | null
          title: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qa_entries_last_edited_by_fkey"
            columns: ["answered_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      v_rate_limit_logs_current: {
        Row: {
          bot_type: string | null
          created_at: string | null
          id: string | null
          ip_address: unknown
          is_bot: boolean | null
          limit_exceeded: boolean | null
          method: string | null
          path: string | null
          response_time_ms: number | null
          status_code: number | null
          timestamp: string | null
          user_agent: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at?: string | null
          id?: string | null
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string | null
          path?: string | null
          response_time_ms?: number | null
          status_code?: number | null
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string | null
          id?: string | null
          ip_address?: unknown
          is_bot?: boolean | null
          limit_exceeded?: boolean | null
          method?: string | null
          path?: string | null
          response_time_ms?: number | null
          status_code?: number | null
          timestamp?: string | null
          user_agent?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      v_rate_limit_write_health_latest: {
        Row: {
          created_at: string | null
          fail_rate: number | null
          failed_attempts: number | null
          total_attempts: number | null
          window_start: string | null
        }
        Relationships: []
      }
      v_rate_limit_write_paths: {
        Row: {
          callers: string | null
          code_lines: string | null
          created_at_explicit: boolean | null
          function_name: string | null
          notes: string | null
          required_role: string | null
          table_name: string | null
        }
        Relationships: []
      }
      v_recent_publications: {
        Row: {
          created_at: string | null
          entity: string | null
          id: string | null
          published_at: string | null
          title: string | null
        }
        Relationships: []
      }
      v_recent_rls_denied: {
        Row: {
          api_endpoint: string | null
          created_at: string | null
          details: Json | null
          id: string | null
          ip: unknown
          operation: string | null
          org_id: string | null
          reason: Database["public"]["Enums"]["rls_denied_reason"] | null
          request_id: string | null
          resource: string | null
          screen_path: string | null
          session_id: string | null
          source: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
          user_role: string | null
        }
        Relationships: []
      }
      v_rls_denied_24h: {
        Row: {
          denied_count: number | null
          hour: string | null
          operation: string | null
          reason: Database["public"]["Enums"]["rls_denied_reason"] | null
          table_name: string | null
        }
        Relationships: []
      }
      v_schema_diff_recent: {
        Row: {
          columns_changed: number | null
          constraints_changed: number | null
          diff: Json | null
          diff_at: string | null
          environment: string | null
          functions_changed: number | null
          id: number | null
          indexes_changed: number | null
          policies_changed: number | null
          severity: string | null
          summary: Json | null
          tables_added: number | null
          tables_removed: number | null
        }
        Insert: {
          columns_changed?: never
          constraints_changed?: never
          diff?: Json | null
          diff_at?: string | null
          environment?: string | null
          functions_changed?: never
          id?: number | null
          indexes_changed?: never
          policies_changed?: never
          severity?: string | null
          summary?: Json | null
          tables_added?: never
          tables_removed?: never
        }
        Update: {
          columns_changed?: never
          constraints_changed?: never
          diff?: Json | null
          diff_at?: string | null
          environment?: string | null
          functions_changed?: never
          id?: number | null
          indexes_changed?: never
          policies_changed?: never
          severity?: string | null
          summary?: Json | null
          tables_added?: never
          tables_removed?: never
        }
        Relationships: []
      }
      v_security_activity_24h: {
        Row: {
          active_blocks: number | null
          rate_limit_hits: number | null
          security_incidents: number | null
          window_end: string | null
          window_start: string | null
        }
        Relationships: []
      }
      v_security_incidents_current: {
        Row: {
          blocked: boolean | null
          country_code: string | null
          created_at: string | null
          details: Json | null
          id: string | null
          incident_type: string | null
          ip_address: unknown
          method: string | null
          path: string | null
          risk_level: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string | null
          incident_type?: string | null
          ip_address?: unknown
          method?: string | null
          path?: string | null
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked?: boolean | null
          country_code?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string | null
          incident_type?: string | null
          ip_address?: unknown
          method?: string | null
          path?: string | null
          risk_level?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_services: {
        Row: {
          api_available: boolean | null
          availability_note: string | null
          availability_status: string | null
          base_path: string | null
          categories: string[] | null
          category: string | null
          content_hash: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          duration_months: number | null
          features: string[] | null
          free_trial: boolean | null
          id: string | null
          image_url: string | null
          is_published: boolean | null
          locale: string | null
          logo_url: string | null
          name: string | null
          organization_id: string | null
          price: string | null
          price_range: string | null
          published_at: string | null
          region_code: string | null
          screenshots: string[] | null
          slug: string | null
          source_urls: string[] | null
          status: string | null
          summary: string | null
          supported_platforms: string[] | null
          updated_at: string | null
          url: string | null
          verification_source: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          video_url: string | null
        }
        Insert: {
          api_available?: boolean | null
          availability_note?: string | null
          availability_status?: string | null
          base_path?: string | null
          categories?: string[] | null
          category?: string | null
          content_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_months?: number | null
          features?: string[] | null
          free_trial?: boolean | null
          id?: string | null
          image_url?: string | null
          is_published?: boolean | null
          locale?: string | null
          logo_url?: string | null
          name?: string | null
          organization_id?: string | null
          price?: string | null
          price_range?: string | null
          published_at?: string | null
          region_code?: string | null
          screenshots?: string[] | null
          slug?: string | null
          source_urls?: string[] | null
          status?: string | null
          summary?: string | null
          supported_platforms?: string[] | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          video_url?: string | null
        }
        Update: {
          api_available?: boolean | null
          availability_note?: string | null
          availability_status?: string | null
          base_path?: string | null
          categories?: string[] | null
          category?: string | null
          content_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_months?: number | null
          features?: string[] | null
          free_trial?: boolean | null
          id?: string | null
          image_url?: string | null
          is_published?: boolean | null
          locale?: string | null
          logo_url?: string | null
          name?: string | null
          organization_id?: string | null
          price?: string | null
          price_range?: string | null
          published_at?: string | null
          region_code?: string | null
          screenshots?: string[] | null
          slug?: string | null
          source_urls?: string[] | null
          status?: string | null
          summary?: string | null
          supported_platforms?: string[] | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "services_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      v_subscription_audit: {
        Row: {
          cnt: number | null
          expiry_bucket: string | null
          status: string | null
        }
        Relationships: []
      }
      v_task_comments: {
        Row: {
          comment_body: string | null
          comment_created_at: string | null
          comment_created_by: string | null
          comment_id: string | null
          project_id: string | null
          task_id: string | null
          task_title: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "v_project_tasks"
            referencedColumns: ["project_id"]
          },
        ]
      }
      v_user_org_memberships: {
        Row: {
          created_at: string | null
          organization_id: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          organization_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          organization_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      view_activities_daily_7d: {
        Row: {
          day: string | null
          events: number | null
        }
        Relationships: []
      }
      view_ai_bot_daily_7d: {
        Row: {
          day: string | null
          hits: number | null
        }
        Relationships: []
      }
      view_ai_content_units: {
        Row: {
          content_hash: string | null
          content_type: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string | null
          jsonld_id: string | null
          last_updated: string | null
          organization_id: string | null
          structured_data_complete: boolean | null
          title: string | null
          url: string | null
        }
        Insert: {
          content_hash?: string | null
          content_type?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string | null
          jsonld_id?: string | null
          last_updated?: string | null
          organization_id?: string | null
          structured_data_complete?: boolean | null
          title?: string | null
          url?: string | null
        }
        Update: {
          content_hash?: string | null
          content_type?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string | null
          jsonld_id?: string | null
          last_updated?: string | null
          organization_id?: string | null
          structured_data_complete?: boolean | null
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      view_ai_starter_caps_current: {
        Row: {
          monthly_limit: number | null
          organization_id: string | null
          remaining: number | null
          used_count: number | null
        }
        Relationships: []
      }
      view_ai_visibility_scores: {
        Row: {
          ai_access_score: number | null
          ai_bot_hits_count: number | null
          calculated_at: string | null
          calculation_period_end: string | null
          calculation_period_start: string | null
          content_unit_id: string | null
          created_at: string | null
          deleted_at: string | null
          id: string | null
          organization_id: string | null
          seo_performance_score: number | null
          structured_data_score: number | null
          total_visibility_score: number | null
          unique_bots_count: number | null
          url: string | null
        }
        Insert: {
          ai_access_score?: number | null
          ai_bot_hits_count?: number | null
          calculated_at?: string | null
          calculation_period_end?: string | null
          calculation_period_start?: string | null
          content_unit_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          organization_id?: string | null
          seo_performance_score?: number | null
          structured_data_score?: number | null
          total_visibility_score?: number | null
          unique_bots_count?: number | null
          url?: string | null
        }
        Update: {
          ai_access_score?: number | null
          ai_bot_hits_count?: number | null
          calculated_at?: string | null
          calculation_period_end?: string | null
          calculation_period_start?: string | null
          content_unit_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          organization_id?: string | null
          seo_performance_score?: number | null
          structured_data_score?: number | null
          total_visibility_score?: number | null
          unique_bots_count?: number | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_visibility_scores_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "ai_content_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_visibility_scores_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "v_ai_content_units_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_visibility_scores_content_unit_id_fkey"
            columns: ["content_unit_id"]
            isOneToOne: false
            referencedRelation: "view_ai_content_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_visibility_scores_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      view_analytics_events_daily_7d: {
        Row: {
          day: string | null
          hits: number | null
        }
        Relationships: []
      }
      view_audit_log_tail_current_month: {
        Row: {
          actor_id: string | null
          at: string | null
          data: Json | null
          op: string | null
          table_name: string | null
        }
        Relationships: []
      }
      view_case_studies: {
        Row: {
          availability_note: string | null
          availability_status: string | null
          base_path: string | null
          challenge: string | null
          client_industry: string | null
          client_name: string | null
          client_size: string | null
          content: string | null
          content_hash: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          generation_source:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id: string | null
          industry: string | null
          interview_session_id: string | null
          is_ai_generated: boolean | null
          is_anonymous: boolean | null
          is_published: boolean | null
          locale: string | null
          meta: Json | null
          metrics: Json | null
          organization_id: string | null
          outcome: string | null
          problem: string | null
          published_at: string | null
          published_date: string | null
          region_code: string | null
          result: string | null
          service_id: string | null
          slug: string | null
          solution: string | null
          source_urls: string[] | null
          status: string | null
          summary: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          url: string | null
          verification_source: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          availability_note?: string | null
          availability_status?: string | null
          base_path?: string | null
          challenge?: string | null
          client_industry?: string | null
          client_name?: string | null
          client_size?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string | null
          industry?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean | null
          is_anonymous?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          metrics?: Json | null
          organization_id?: string | null
          outcome?: string | null
          problem?: string | null
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          result?: string | null
          service_id?: string | null
          slug?: string | null
          solution?: string | null
          source_urls?: string[] | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          availability_note?: string | null
          availability_status?: string | null
          base_path?: string | null
          challenge?: string | null
          client_industry?: string | null
          client_name?: string | null
          client_size?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string | null
          industry?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean | null
          is_anonymous?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          metrics?: Json | null
          organization_id?: string | null
          outcome?: string | null
          problem?: string | null
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          result?: string | null
          service_id?: string | null
          slug?: string | null
          solution?: string | null
          source_urls?: string[] | null
          status?: string | null
          summary?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_studies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "v_ai_interview_session_metrics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services_jsonld"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "view_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_case_studies_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      view_chatbot_interactions: {
        Row: {
          answer_text: string | null
          bot_id: string | null
          created_at: string | null
          deleted_at: string | null
          id: string | null
          metadata: Json | null
          organization_id: string | null
          page_url: string | null
          question_text: string | null
          user_id: string | null
          user_session_id: string | null
        }
        Insert: {
          answer_text?: string | null
          bot_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          page_url?: string | null
          question_text?: string | null
          user_id?: string | null
          user_session_id?: string | null
        }
        Update: {
          answer_text?: string | null
          bot_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string | null
          metadata?: Json | null
          organization_id?: string | null
          page_url?: string | null
          question_text?: string | null
          user_id?: string | null
          user_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_interactions_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "view_chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "chatbot_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      view_chatbots: {
        Row: {
          bot_type: string | null
          created_at: string | null
          created_by: string | null
          default_language: string | null
          deleted_at: string | null
          display_name: string | null
          id: string | null
          organization_id: string | null
          settings: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at?: string | null
          created_by?: string | null
          default_language?: string | null
          deleted_at?: string | null
          display_name?: string | null
          id?: string | null
          organization_id?: string | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string | null
          created_by?: string | null
          default_language?: string | null
          deleted_at?: string | null
          display_name?: string | null
          id?: string | null
          organization_id?: string | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      view_content_counts: {
        Row: {
          contents: number | null
          organization_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      view_faqs: {
        Row: {
          answer: string | null
          base_path: string | null
          category: string | null
          content_hash: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          display_order: number | null
          generation_source:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id: string | null
          interview_session_id: string | null
          is_ai_generated: boolean | null
          is_published: boolean | null
          locale: string | null
          meta: Json | null
          order_index: number | null
          organization_id: string | null
          published_at: string | null
          question: string | null
          region_code: string | null
          service_id: string | null
          slug: string | null
          sort_order: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          answer?: string | null
          base_path?: string | null
          category?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          display_order?: number | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          order_index?: number | null
          organization_id?: string | null
          published_at?: string | null
          question?: string | null
          region_code?: string | null
          service_id?: string | null
          slug?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          answer?: string | null
          base_path?: string | null
          category?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          display_order?: number | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          order_index?: number | null
          organization_id?: string | null
          published_at?: string | null
          question?: string | null
          region_code?: string | null
          service_id?: string | null
          slug?: string | null
          sort_order?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faqs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "v_ai_interview_session_metrics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services_jsonld"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public_minimal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_services_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "v_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "view_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_faqs_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      view_monthly_report_basics: {
        Row: {
          created_at: string | null
          id: string | null
          month: string | null
          organization_id: string | null
          organization_name: string | null
          status: string | null
          summary_text: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      view_news: {
        Row: {
          base_path: string | null
          category: string | null
          content: string | null
          content_hash: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          id: string | null
          image_url: string | null
          is_featured: boolean | null
          is_published: boolean | null
          locale: string | null
          meta: Json | null
          organization_id: string | null
          published_at: string | null
          published_date: string | null
          region_code: string | null
          slug: string | null
          status: Database["public"]["Enums"]["cms_content_status"] | null
          summary: string | null
          title: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          base_path?: string | null
          category?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string | null
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          organization_id?: string | null
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          base_path?: string | null
          category?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string | null
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          organization_id?: string | null
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_news_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      view_organizations: {
        Row: {
          address: string | null
          address_country: string | null
          address_locality: string | null
          address_postal_code: string | null
          address_region: string | null
          address_street: string | null
          availability_note: string | null
          availability_status: string | null
          capital: number | null
          city: string | null
          contact_email: string | null
          content_hash: string | null
          corporate_number: string | null
          corporate_type: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          data_status:
            | Database["public"]["Enums"]["organization_data_status"]
            | null
          default_locale: string | null
          deleted_at: string | null
          description: string | null
          discount_group: string | null
          email: string | null
          email_public: boolean | null
          employees: number | null
          entitlements: Json | null
          established_at: string | null
          feature_flags: Json | null
          id: string | null
          industries: string[] | null
          is_published: boolean | null
          lat: number | null
          legal_form: string | null
          lng: number | null
          logo_url: string | null
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          name: string | null
          original_signup_campaign: string | null
          partner_id: string | null
          phone: string | null
          plan: string | null
          postal_code: string | null
          prefecture: string | null
          region_code: string | null
          representative_name: string | null
          same_as: string[] | null
          show_case_studies: boolean | null
          show_contact: boolean | null
          show_faqs: boolean | null
          show_news: boolean | null
          show_partnership: boolean | null
          show_posts: boolean | null
          show_products: boolean | null
          show_qa: boolean | null
          show_services: boolean | null
          slug: string | null
          source_urls: string[] | null
          status: Database["public"]["Enums"]["organization_status"] | null
          street_address: string | null
          telephone: string | null
          updated_at: string | null
          url: string | null
          user_id: string | null
          verification_source: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          address_country?: string | null
          address_locality?: string | null
          address_postal_code?: string | null
          address_region?: string | null
          address_street?: string | null
          availability_note?: string | null
          availability_status?: string | null
          capital?: number | null
          city?: string | null
          contact_email?: string | null
          content_hash?: string | null
          corporate_number?: string | null
          corporate_type?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          data_status?:
            | Database["public"]["Enums"]["organization_data_status"]
            | null
          default_locale?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_group?: string | null
          email?: string | null
          email_public?: boolean | null
          employees?: number | null
          entitlements?: Json | null
          established_at?: string | null
          feature_flags?: Json | null
          id?: string | null
          industries?: string[] | null
          is_published?: boolean | null
          lat?: number | null
          legal_form?: string | null
          lng?: number | null
          logo_url?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          name?: string | null
          original_signup_campaign?: string | null
          partner_id?: string | null
          phone?: string | null
          plan?: string | null
          postal_code?: string | null
          prefecture?: string | null
          region_code?: string | null
          representative_name?: string | null
          same_as?: string[] | null
          show_case_studies?: boolean | null
          show_contact?: boolean | null
          show_faqs?: boolean | null
          show_news?: boolean | null
          show_partnership?: boolean | null
          show_posts?: boolean | null
          show_products?: boolean | null
          show_qa?: boolean | null
          show_services?: boolean | null
          slug?: string | null
          source_urls?: string[] | null
          status?: Database["public"]["Enums"]["organization_status"] | null
          street_address?: string | null
          telephone?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          address_country?: string | null
          address_locality?: string | null
          address_postal_code?: string | null
          address_region?: string | null
          address_street?: string | null
          availability_note?: string | null
          availability_status?: string | null
          capital?: number | null
          city?: string | null
          contact_email?: string | null
          content_hash?: string | null
          corporate_number?: string | null
          corporate_type?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          data_status?:
            | Database["public"]["Enums"]["organization_data_status"]
            | null
          default_locale?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_group?: string | null
          email?: string | null
          email_public?: boolean | null
          employees?: number | null
          entitlements?: Json | null
          established_at?: string | null
          feature_flags?: Json | null
          id?: string | null
          industries?: string[] | null
          is_published?: boolean | null
          lat?: number | null
          legal_form?: string | null
          lng?: number | null
          logo_url?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          name?: string | null
          original_signup_campaign?: string | null
          partner_id?: string | null
          phone?: string | null
          plan?: string | null
          postal_code?: string | null
          prefecture?: string | null
          region_code?: string | null
          representative_name?: string | null
          same_as?: string[] | null
          show_case_studies?: boolean | null
          show_contact?: boolean | null
          show_faqs?: boolean | null
          show_news?: boolean | null
          show_partnership?: boolean | null
          show_posts?: boolean | null
          show_products?: boolean | null
          show_qa?: boolean | null
          show_services?: boolean | null
          slug?: string | null
          source_urls?: string[] | null
          status?: Database["public"]["Enums"]["organization_status"] | null
          street_address?: string | null
          telephone?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_organizations_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_organizations_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organizations_partner"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_organizations_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_organizations_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      view_posts: {
        Row: {
          base_path: string | null
          content: string | null
          content_hash: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          generation_source:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id: string | null
          interview_session_id: string | null
          is_ai_generated: boolean | null
          is_published: boolean | null
          locale: string | null
          meta: Json | null
          organization_id: string | null
          published_at: string | null
          region_code: string | null
          slug: string | null
          status: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          base_path?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          organization_id?: string | null
          published_at?: string | null
          region_code?: string | null
          slug?: string | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          base_path?: string | null
          content?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          meta?: Json | null
          organization_id?: string | null
          published_at?: string | null
          region_code?: string | null
          slug?: string | null
          status?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "posts_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "v_ai_interview_session_metrics"
            referencedColumns: ["session_id"]
          },
        ]
      }
      view_products: {
        Row: {
          base_path: string | null
          content_hash: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          id: string | null
          image_url: string | null
          is_published: boolean | null
          organization_id: string | null
          published_at: string | null
          sku: string | null
          slug: string | null
          tenant_id: string | null
          url: string | null
        }
        Insert: {
          base_path?: string | null
          content_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string | null
          image_url?: string | null
          is_published?: boolean | null
          organization_id?: string | null
          published_at?: string | null
          sku?: string | null
          slug?: string | null
          tenant_id?: string | null
          url?: string | null
        }
        Update: {
          base_path?: string | null
          content_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string | null
          image_url?: string | null
          is_published?: boolean | null
          organization_id?: string | null
          published_at?: string | null
          sku?: string | null
          slug?: string | null
          tenant_id?: string | null
          url?: string | null
        }
        Relationships: []
      }
      view_qa_categories: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          organization_id: string | null
          slug: string | null
          sort_order: number | null
          updated_at: string | null
          updated_by: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          organization_id?: string | null
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
          updated_by?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          organization_id?: string | null
          slug?: string | null
          sort_order?: number | null
          updated_at?: string | null
          updated_by?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qa_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qa_categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      view_qa_entries: {
        Row: {
          answer: string | null
          base_path: string | null
          category_id: string | null
          content_hash: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          generation_source:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id: string | null
          interview_session_id: string | null
          is_ai_generated: boolean | null
          jsonld_cache: Json | null
          last_edited_at: string | null
          last_edited_by: string | null
          locale: string | null
          meta: Json | null
          organization_id: string | null
          published_at: string | null
          question: string | null
          refresh_suggested_at: string | null
          region_code: string | null
          search_vector: unknown
          slug: string | null
          status: Database["public"]["Enums"]["cms_content_status"] | null
          tags: string[] | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          answer?: string | null
          base_path?: string | null
          category_id?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean | null
          jsonld_cache?: Json | null
          last_edited_at?: string | null
          last_edited_by?: string | null
          locale?: string | null
          meta?: Json | null
          organization_id?: string | null
          published_at?: string | null
          question?: string | null
          refresh_suggested_at?: string | null
          region_code?: string | null
          search_vector?: unknown
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          tags?: string[] | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          answer?: string | null
          base_path?: string | null
          category_id?: string | null
          content_hash?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          generation_source?:
            | Database["public"]["Enums"]["cms_generation_source"]
            | null
          id?: string | null
          interview_session_id?: string | null
          is_ai_generated?: boolean | null
          jsonld_cache?: Json | null
          last_edited_at?: string | null
          last_edited_by?: string | null
          locale?: string | null
          meta?: Json | null
          organization_id?: string | null
          published_at?: string | null
          question?: string | null
          refresh_suggested_at?: string | null
          region_code?: string | null
          search_vector?: unknown
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          tags?: string[] | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_qa_entries_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qa_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "qa_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_qa_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_entries_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_entries_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "v_ai_interview_session_metrics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "qa_entries_last_edited_by_fkey"
            columns: ["last_edited_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      view_qa_question_templates: {
        Row: {
          category_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          sort_order: number | null
          tags: string[] | null
          template_text: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          tags?: string[] | null
          template_text?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          tags?: string[] | null
          template_text?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qa_question_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "qa_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_question_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_qa_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      view_rate_limit_logs_daily_7d: {
        Row: {
          day: string | null
          hits: number | null
        }
        Relationships: []
      }
      view_rate_limit_requests_daily_7d: {
        Row: {
          day: string | null
          hits: number | null
        }
        Relationships: []
      }
      view_report_regen_counts: {
        Row: {
          month_bucket: string | null
          organization_id: string | null
          regen_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_regen_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      view_report_regen_limit_current: {
        Row: {
          monthly_limit: number | null
          organization_id: string | null
          remaining: number | null
          used_count: number | null
        }
        Relationships: []
      }
      view_sales_materials: {
        Row: {
          base_path: string | null
          content_type: Database["public"]["Enums"]["cms_content_type"] | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          file_path: string | null
          id: string | null
          is_public: boolean | null
          locale: string | null
          meta: Json | null
          mime_type: string | null
          organization_id: string | null
          published_at: string | null
          region_code: string | null
          size_bytes: number | null
          slug: string | null
          status: Database["public"]["Enums"]["cms_content_status"] | null
          title: string | null
        }
        Insert: {
          base_path?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string | null
          is_public?: boolean | null
          locale?: string | null
          meta?: Json | null
          mime_type?: string | null
          organization_id?: string | null
          published_at?: string | null
          region_code?: string | null
          size_bytes?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          title?: string | null
        }
        Update: {
          base_path?: string | null
          content_type?: Database["public"]["Enums"]["cms_content_type"] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string | null
          is_public?: boolean | null
          locale?: string | null
          meta?: Json | null
          mime_type?: string | null
          organization_id?: string | null
          published_at?: string | null
          region_code?: string | null
          size_bytes?: number | null
          slug?: string | null
          status?: Database["public"]["Enums"]["cms_content_status"] | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sales_materials_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "sales_materials_created_by_auth_users_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      view_security_incidents_daily_7d: {
        Row: {
          day: string | null
          incidents: number | null
        }
        Relationships: []
      }
      view_security_overview: {
        Row: {
          generated_at: string | null
          incidents_24h: number | null
          rate_suspicious_24h: number | null
          rls_denies_24h: number | null
        }
        Relationships: []
      }
      view_services: {
        Row: {
          api_available: boolean | null
          availability_note: string | null
          availability_status: string | null
          base_path: string | null
          categories: string[] | null
          category: string | null
          content_hash: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          duration_months: number | null
          features: string[] | null
          free_trial: boolean | null
          id: string | null
          image_url: string | null
          is_published: boolean | null
          locale: string | null
          logo_url: string | null
          name: string | null
          organization_id: string | null
          price: string | null
          price_range: string | null
          published_at: string | null
          region_code: string | null
          screenshots: string[] | null
          slug: string | null
          source_urls: string[] | null
          status: string | null
          summary: string | null
          supported_platforms: string[] | null
          updated_at: string | null
          url: string | null
          verification_source: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          video_url: string | null
        }
        Insert: {
          api_available?: boolean | null
          availability_note?: string | null
          availability_status?: string | null
          base_path?: string | null
          categories?: string[] | null
          category?: string | null
          content_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_months?: number | null
          features?: string[] | null
          free_trial?: boolean | null
          id?: string | null
          image_url?: string | null
          is_published?: boolean | null
          locale?: string | null
          logo_url?: string | null
          name?: string | null
          organization_id?: string | null
          price?: string | null
          price_range?: string | null
          published_at?: string | null
          region_code?: string | null
          screenshots?: string[] | null
          slug?: string | null
          source_urls?: string[] | null
          status?: string | null
          summary?: string | null
          supported_platforms?: string[] | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          video_url?: string | null
        }
        Update: {
          api_available?: boolean | null
          availability_note?: string | null
          availability_status?: string | null
          base_path?: string | null
          categories?: string[] | null
          category?: string | null
          content_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_months?: number | null
          features?: string[] | null
          free_trial?: boolean | null
          id?: string | null
          image_url?: string | null
          is_published?: boolean | null
          locale?: string | null
          logo_url?: string | null
          name?: string | null
          organization_id?: string | null
          price?: string | null
          price_range?: string | null
          published_at?: string | null
          region_code?: string | null
          screenshots?: string[] | null
          slug?: string | null
          source_urls?: string[] | null
          status?: string | null
          summary?: string | null
          supported_platforms?: string[] | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_services_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "services_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_app_users_compat2"
            referencedColumns: ["id"]
          },
        ]
      }
      view_storage_bucket_kpi: {
        Row: {
          bucket_id: string | null
          bucket_name: string | null
          last_object_update: string | null
          object_count: number | null
        }
        Relationships: []
      }
      vw_campaign_details: {
        Row: {
          campaign_type: string | null
          created_at: string | null
          discount_rate: number | null
          end_at: string | null
          is_active: boolean | null
          is_public: boolean | null
          link_id: string | null
          link_label: string | null
          period_status: string | null
          plan_type: string | null
          start_at: string | null
          stripe_price_id: string | null
          target_organizations: number | null
        }
        Insert: {
          campaign_type?: string | null
          created_at?: string | null
          discount_rate?: never
          end_at?: string | null
          is_active?: never
          is_public?: never
          link_id?: string | null
          link_label?: never
          period_status?: never
          plan_type?: string | null
          start_at?: string | null
          stripe_price_id?: string | null
          target_organizations?: never
        }
        Update: {
          campaign_type?: string | null
          created_at?: string | null
          discount_rate?: never
          end_at?: string | null
          is_active?: never
          is_public?: never
          link_id?: string | null
          link_label?: never
          period_status?: never
          plan_type?: string | null
          start_at?: string | null
          stripe_price_id?: string | null
          target_organizations?: never
        }
        Relationships: []
      }
      vw_campaign_summary: {
        Row: {
          active_organizations: number | null
          active_private_links: number | null
          active_public_links: number | null
          avg_discount_rate: number | null
          campaign_type: string | null
          current_period_active_links: number | null
          last_updated_jst: string | null
          max_discount_rate: number | null
          plan_type: string | null
          total_links: number | null
          total_organizations: number | null
        }
        Relationships: []
      }
      vw_org_slug_duplicates: {
        Row: {
          dup_count: number | null
          org_ids: string[] | null
          slug: string | null
        }
        Relationships: []
      }
      vw_posts_pub_inconsistencies: {
        Row: {
          id: string | null
          organization_id: string | null
          published_at: string | null
          slug: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          organization_id?: string | null
          published_at?: string | null
          slug?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_counters"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_orgs_visible"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_ai_starter_caps_current"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "view_report_regen_limit_current"
            referencedColumns: ["organization_id"]
          },
        ]
      }
    }
    Functions: {
      _assert_actor_is_org_admin: {
        Args: { p_org_id: string }
        Returns: undefined
      }
      _guard_admin: { Args: never; Returns: undefined }
      _is_site_admin: { Args: never; Returns: boolean }
      _log_quota_event: {
        Args: {
          p_event_key: string
          p_feature_id: string
          p_plan_id: string
          p_props: Json
          p_user_id: string
        }
        Returns: undefined
      }
      _mask_pii_cols: { Args: { payload: Json }; Returns: Json }
      _org_below_cap: {
        Args: { p_org_id: string; p_table: string }
        Returns: boolean
      }
      _validate_org_role: { Args: { p_role: string }; Returns: string }
      activities_daily_7d: {
        Args: never
        Returns: {
          day: string
          events: number
        }[]
      }
      admin_backfill_canonical: {
        Args: { p_dry_run?: boolean; p_limit?: number; p_org_id: string }
        Returns: Json
      }
      admin_check_legacy_views_overdue: {
        Args: never
        Returns: {
          comment: string
          remove_after: string
          view_name: string
        }[]
      }
      admin_create_month_partition: {
        Args: { p_table_name: string; p_year_month: string }
        Returns: string
      }
      admin_create_next_month_partitions: {
        Args: { p_months_ahead?: number }
        Returns: {
          date_range: string
          partition_name: string
          status: string
          table_name: string
        }[]
      }
      admin_drop_old_partitions: {
        Args: { p_keep_months?: number; p_parent_table: string }
        Returns: {
          data_size: string
          drop_date: string
          partition_name: string
          status: string
        }[]
      }
      admin_get_audit_logs: {
        Args: {
          p_limit?: number
          p_since?: string
          p_table?: string
          p_until?: string
          p_user_email?: string
        }
        Returns: {
          action: string
          after_state: Json | null
          api_endpoint: string | null
          at: string | null
          before_state: Json | null
          changed_fields: string[] | null
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          old_data: Json | null
          request_method: string | null
          row_data: Json | null
          session_id: string | null
          table_name: string
          target_id: string | null
          target_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "audit_logs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_get_content_refresh_history: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Database["public"]["CompositeTypes"]["admin_get_content_refresh_history_row"][]
        SetofOptions: {
          from: "*"
          to: "admin_get_content_refresh_history_row"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_get_content_refresh_history_guarded: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Database["public"]["CompositeTypes"]["admin_get_content_refresh_history_row"][]
        SetofOptions: {
          from: "*"
          to: "admin_get_content_refresh_history_row"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_get_edge_failure_stats: {
        Args: never
        Returns: {
          failed_runs: number
          failure_rate: number
          job_name: string
          last_run_at: string
          total_runs: number
        }[]
      }
      admin_get_public_tables_freshness: {
        Args: never
        Returns: {
          last_updated_at: string
          seconds_since_last_update: number
          table_name: string
        }[]
      }
      admin_get_rls_denies_top5: {
        Args: never
        Returns: {
          deny_count: number
          endpoint: string
          last_denied_at: string
          table_name: string
        }[]
      }
      admin_get_schema_diff_candidates: {
        Args: never
        Returns: {
          object_name: string
          object_type: string
        }[]
      }
      admin_hard_delete: {
        Args: { p_id: string; p_reason: string; p_table: unknown }
        Returns: undefined
      }
      admin_restore: {
        Args: { p_id: string; p_reason: string; p_table: unknown }
        Returns: undefined
      }
      admin_soft_delete: {
        Args: { p_id: string; p_reason: string; p_table: unknown }
        Returns: undefined
      }
      admin_toggle_custom_domain_verified: {
        Args: { p_org_id: string; p_verified: boolean }
        Returns: {
          allowed_domains: string[]
          branding: Json | null
          canonical_base_path: string
          created_at: string
          custom_domain_verified: boolean
          default_scheme: string
          force_trailing_slash: boolean
          hosted_domain_base: string
          id: string
          lang_default: string
          org_id: string
          org_slug: string | null
          ownership_proof: Json | null
          primary_domain: string | null
          robots_path: string | null
          site_mode: string
          sitemap_path: string | null
          strip_query_params: boolean
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "ai_sites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_upsert_site_settings: {
        Args: {
          p_allowed_domains?: string[]
          p_branding?: Json
          p_canonical_base_path?: string
          p_custom_domain_verified?: boolean
          p_force_trailing_slash?: boolean
          p_hosted_domain_base?: string
          p_lang_default?: string
          p_org_id: string
          p_org_slug?: string
          p_primary_domain?: string
          p_site_mode?: string
          p_strip_query_params?: boolean
        }
        Returns: {
          allowed_domains: string[]
          branding: Json | null
          canonical_base_path: string
          created_at: string
          custom_domain_verified: boolean
          default_scheme: string
          force_trailing_slash: boolean
          hosted_domain_base: string
          id: string
          lang_default: string
          org_id: string
          org_slug: string | null
          ownership_proof: Json | null
          primary_domain: string | null
          robots_path: string | null
          site_mode: string
          sitemap_path: string | null
          strip_query_params: boolean
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "ai_sites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_upsert_source: {
        Args: {
          p_attribution: string
          p_content_hash: string
          p_input_url: string
          p_is_public: boolean
          p_lang: string
          p_license: string
          p_org_id: string
          p_published_at: string
          p_title: string
        }
        Returns: {
          attribution: string | null
          canonical_url: string
          content_hash: string
          id: string
          is_public: boolean
          lang: string
          license: string | null
          org_id: string | null
          published_at: string | null
          title: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "ai_sources"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ai_bot_daily_7d: {
        Args: never
        Returns: {
          day: string
          hits: number
        }[]
      }
      ai_citations_summary_v1: {
        Args: { p_days?: number; p_org_id: string }
        Returns: {
          items_count: number
          organization_id: string
          quoted_tokens_sum: number
          responses_count: number
        }[]
      }
      ai_normalize_canonical: {
        Args: { p_input_url: string; p_org_id: string }
        Returns: string
      }
      ai_resolve_canonical_base: { Args: { p_org_id: string }; Returns: string }
      ai_validate_hreflang_group: {
        Args: { p_group_key: string; p_org_id: string }
        Returns: Json
      }
      aiis_save_answers_with_version: {
        Args: { p_answers: Json; p_client_version: number; p_id: string }
        Returns: {
          new_version: number
          updated: boolean
          updated_at: string
        }[]
      }
      alert_count: {
        Args: {
          source_table: string
          where_key: string
          window_seconds: number
        }
        Returns: number
      }
      analytics_event_write_v1: {
        Args: {
          p_event_key: string
          p_org?: string
          p_page_url?: string
          p_properties?: Json
          p_user_agent?: string
        }
        Returns: string
      }
      analytics_events_daily_7d: {
        Args: never
        Returns: {
          day: string
          hits: number
        }[]
      }
      analyze_behavioral_patterns: {
        Args: { target_user_id?: string }
        Returns: Json
      }
      apply_embeddings_result: {
        Args: {
          p_chunks: Json
          p_content_hash: string
          p_embedding_model: string
          p_org_id: string
          p_source_field: string
          p_source_id: string
          p_source_table: string
        }
        Returns: undefined
      }
      apply_translation_result: {
        Args: {
          p_lang: string
          p_source_field: string
          p_source_id: string
          p_source_table: string
          p_translated: string
        }
        Returns: undefined
      }
      approve_join_request: {
        Args: { p_invite_code: string; p_request_id: string }
        Returns: undefined
      }
      assert_site_admin: { Args: never; Returns: undefined }
      assign_partner_to_organization: {
        Args: {
          access_level?: string
          expires_at?: string
          org_id: string
          partner_email: string
          permissions?: Json
        }
        Returns: string
      }
      audit_log_tail_current_month: {
        Args: never
        Returns: {
          actor_id: string
          at: string
          data: Json
          op: string
          table_name: string
        }[]
      }
      audit_log_write: {
        Args: {
          p_action: string
          p_context?: Json
          p_diff?: Json
          p_entity_id?: string
          p_entity_type: string
        }
        Returns: undefined
      }
      audit_logs_recent: {
        Args: { p_days?: number; p_target_type?: string }
        Returns: {
          action: string | null
          created_at: string | null
          id: string | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "audit_log_events_v2"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      auto_block_ip: {
        Args: {
          block_duration_minutes?: number
          block_reason: string
          target_ip: unknown
        }
        Returns: string
      }
      auto_block_malicious_ip: {
        Args: { duration_minutes?: number; reason?: string; target_ip: unknown }
        Returns: boolean
      }
      build_public_url: {
        Args: {
          p_base_path: string
          p_lang: string
          p_org_id: string
          p_slug: string
          p_table: string
        }
        Returns: string
      }
      can_consume_ai: {
        Args: { p_org_id: string; p_usage_type: string }
        Returns: boolean
      }
      can_insert_content: {
        Args: { p_org_id: string; p_type: string }
        Returns: boolean
      }
      check_ai_quota: {
        Args: { p_kind: string; p_org_id: string }
        Returns: undefined
      }
      check_and_consume_quota:
        | {
            Args: {
              _amount: number
              _period?: string
              _quota_key: string
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_amount?: number
              p_feature_key: string
              p_user_id?: string
            }
            Returns: Json
          }
        | {
            Args: { p_amount?: number; p_feature_key: string; p_user: string }
            Returns: boolean
          }
        | {
            Args: {
              p_amount: number
              p_feature_id: string
              p_idempotency_key: string
              p_now?: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              amount: number
              feature_key: string
              idempotency_key?: string
              limit_key: string
              period: string
              subject_id: string
              subject_type: string
            }
            Returns: Json
          }
      check_rate_limit_db: {
        Args: {
          limit_key: string
          max_requests?: number
          window_seconds?: number
        }
        Returns: Json
      }
      check_rate_limit_violation: {
        Args: { p_ip: unknown; p_limit?: number; p_window_seconds?: number }
        Returns: boolean
      }
      cleanup_job_runs_v2: { Args: { p_older_than?: unknown }; Returns: number }
      cleanup_old_visibility_scores: { Args: never; Returns: undefined }
      cleanup_rate_limit_data: {
        Args: { retention_hours?: number }
        Returns: number
      }
      cleanup_rate_limit_logs: {
        Args: { retention_days?: number }
        Returns: number
      }
      cleanup_service_role_audit: {
        Args: { retention_days?: number }
        Returns: number
      }
      content_hash_from_jsonb: { Args: { in_val: Json }; Returns: string }
      content_search_i18n_v1: {
        Args: {
          p_content_type?: string
          p_fallback_lang?: string
          p_lang: string
          p_limit?: number
          p_offset?: number
          p_org_id?: string
          p_query: string
        }
        Returns: {
          base_path: string
          canonical_url: string
          content: string
          content_type: string
          id: string
          is_primary: boolean
          is_published: boolean
          lang: string
          organization_id: string
          published_at: string
          rank: number
          slug: string
          source_table: string
          summary: string
          title: string
        }[]
      }
      content_search_i18n_v2: {
        Args: {
          p_content_type?: string
          p_fallback_lang?: string
          p_lang: string
          p_limit?: number
          p_offset?: number
          p_org_id?: string
          p_query: string
        }
        Returns: {
          availability_note: string
          availability_status: string
          base_path: string
          canonical_url: string
          content: string
          content_type: string
          created_at: string
          id: string
          is_primary: boolean
          is_published: boolean
          lang: string
          organization_id: string
          published_at: string
          rank: number
          slug: string
          source_table: string
          summary: string
          title: string
          updated_at: string
          verified: boolean
          verified_at: string
        }[]
      }
      content_search_v1: {
        Args: {
          p_content_type?: string
          p_limit?: number
          p_offset?: number
          p_org_id?: string
          p_query: string
        }
        Returns: {
          base_path: string
          canonical_url: string
          content_type: string
          id: string
          is_published: boolean
          organization_id: string
          published_at: string
          rank: number
          slug: string
          source_table: string
          title: string
        }[]
      }
      content_union_i18n_v1: {
        Args: {
          p_content_type?: string
          p_fallback_lang?: string
          p_lang: string
          p_limit?: number
          p_offset?: number
          p_org_id?: string
        }
        Returns: {
          availability_note: string
          availability_status: string
          base_path: string
          canonical_url: string
          content: string
          content_type: string
          created_at: string
          id: string
          is_primary: boolean
          is_published: boolean
          lang: string
          organization_id: string
          published_at: string
          slug: string
          source_table: string
          summary: string
          title: string
          updated_at: string
          verified: boolean
          verified_at: string
        }[]
      }
      count_content_by_type: {
        Args: { p_org_id: string; p_type: string }
        Returns: number
      }
      count_incidents_window: {
        Args: {
          p_incident_type: string
          p_table: string
          p_window_minutes: number
        }
        Returns: {
          c: number
        }[]
      }
      count_regenerations: {
        Args: { p_e: string; p_org_id: string; p_s: string }
        Returns: number
      }
      count_report_regenerations: {
        Args: { p_org_id: string; p_period_end: string; p_period_start: string }
        Returns: number
      }
      count_status_window: {
        Args: {
          p_max_code: number
          p_min_code: number
          p_table: string
          p_window_minutes: number
        }
        Returns: {
          c: number
        }[]
      }
      create_task: {
        Args: { p_description?: string; p_project_id: string; p_title: string }
        Returns: string
      }
      current_user_id: { Args: never; Returns: string }
      current_user_role: { Args: never; Returns: string }
      current_yyyymm: { Args: never; Returns: string }
      debug_call_rls_public: { Args: never; Returns: Json }
      debug_call_run_rls: { Args: { target?: string }; Returns: Json }
      debug_role_switch_probe: { Args: never; Returns: Json }
      debug_rpc_identity: { Args: never; Returns: Json }
      debug_run_get_my_organizations_slim: { Args: never; Returns: Json[] }
      detect_data_leakage: { Args: never; Returns: Json }
      detect_rate_limit_anomalies: { Args: never; Returns: Json }
      detect_service_role_anomalies: { Args: never; Returns: Json }
      enqueue_cache_invalidation:
        | { Args: { _path: string; _source_id: string }; Returns: undefined }
        | {
            Args: {
              p_lang: string
              p_org_id: string
              p_path: string
              p_scope: string
              p_source_id: string
              p_source_table: string
            }
            Returns: undefined
          }
      enqueue_embedding_job: {
        Args: {
          p_chunk_strategy?: string
          p_content_text: string
          p_embedding_model?: string
          p_org_id: string
          p_priority?: number
          p_source_field: string
          p_source_id: string
          p_source_table: string
        }
        Returns: string
      }
      enqueue_last_month_if_window: { Args: never; Returns: undefined }
      enqueue_monthly_report: {
        Args: { p_end: string; p_meta?: Json; p_org: string; p_start: string }
        Returns: string
      }
      enqueue_monthly_reports: {
        Args: { p_period_end: string; p_period_start: string }
        Returns: undefined
      }
      enqueue_monthly_reports_for_month: {
        Args: { p_month: number; p_year: number }
        Returns: undefined
      }
      enqueue_translation_job: {
        Args: {
          p_org_id: string
          p_priority?: number
          p_service?: string
          p_source_field: string
          p_source_id: string
          p_source_lang: string
          p_source_table: string
          p_source_text: string
          p_target_lang: string
        }
        Returns: string
      }
      ensure_activities_partition: {
        Args: { p_start: string }
        Returns: undefined
      }
      ensure_ai_bot_logs_partition: {
        Args: { p_start: string }
        Returns: undefined
      }
      ensure_analytics_events_partition: {
        Args: { p_start: string }
        Returns: undefined
      }
      ensure_audit_log_partition: {
        Args: { p_start: string }
        Returns: undefined
      }
      ensure_audit_partition_for: {
        Args: { month_start: string }
        Returns: undefined
      }
      ensure_can_write: {
        Args: { p_op: string; p_org: string; p_pk?: Json; p_table: string }
        Returns: undefined
      }
      ensure_rate_limit_logs_partition: {
        Args: { p_start: string }
        Returns: undefined
      }
      ensure_rate_limit_requests_partition: {
        Args: { p_start: string }
        Returns: undefined
      }
      ensure_security_incidents_partition: {
        Args: { p_start: string }
        Returns: undefined
      }
      ensure_unique_slug: {
        Args: {
          _base_slug: string
          _id: string
          _slug_col?: unknown
          _table: unknown
        }
        Returns: string
      }
      execute_intrusion_detection: { Args: never; Returns: Json }
      filter_sensitive_data: { Args: { input_text: string }; Returns: string }
      filter_sensitive_jsonb: { Args: { input_jsonb: Json }; Returns: Json }
      first_day_utc: { Args: { d: string }; Returns: string }
      fn_add_member: {
        Args: { p_org_id: string; p_role: string; p_user_id: string }
        Returns: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "organization_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_admin_publish: {
        Args: {
          p_id: string
          p_org: string
          p_published: boolean
          p_table: string
        }
        Returns: undefined
      }
      fn_admin_restore: {
        Args: { p_id: string; p_org: string; p_table: string }
        Returns: undefined
      }
      fn_admin_soft_delete: {
        Args: { p_id: string; p_org: string; p_table: string }
        Returns: undefined
      }
      fn_admin_update_slug: {
        Args: { p_id: string; p_org: string; p_slug: string; p_table: string }
        Returns: undefined
      }
      fn_archive_disclosure: { Args: { p_id: string }; Returns: undefined }
      fn_attach_disclosure_pdf: {
        Args: { p_id: string; p_object_path: string }
        Returns: undefined
      }
      fn_build_monthly_kpis: {
        Args: { p_org_id: string; p_period_end: string; p_period_start: string }
        Returns: Json
      }
      fn_create_disclosure:
        | {
            Args: {
              p_data_json: Json
              p_doc_type: string
              p_effective_date: string
              p_public_slug?: string
              p_summary_md: string
              p_title: string
              p_version: string
            }
            Returns: string
          }
        | {
            Args: {
              p_data_json: Json
              p_effective_date: string
              p_public_slug: string
              p_summary_md: string
              p_title: string
              p_version: string
            }
            Returns: string
          }
      fn_create_disclosure_draft: {
        Args: {
          p_data_json: Json
          p_effective_date: string
          p_public_slug: string
          p_summary_md: string
          p_title: string
          p_version: string
        }
        Returns: string
      }
      fn_get_current_disclosure:
        | { Args: never; Returns: Json }
        | {
            Args: { p_doc_type: string }
            Returns: {
              changelog_url: string | null
              crawler_policy_ref: string | null
              doc_type: string | null
              effective_date: string | null
              ip_contact_url: string | null
              model_identifier: string | null
              pdf_object_path: string | null
              public_slug: string | null
              published_at: string | null
              summary_md: string | null
              title: string | null
              training_data_summary: string | null
              version: string | null
            }[]
            SetofOptions: {
              from: "*"
              to: "ai_disclosure_public"
              isOneToOne: false
              isSetofReturn: true
            }
          }
      fn_is_admin: { Args: never; Returns: boolean }
      fn_publish_disclosure:
        | { Args: { p_id: string }; Returns: undefined }
        | {
            Args: { p_id: string; p_published_at?: string }
            Returns: undefined
          }
      fn_remove_member: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: undefined
      }
      fn_set_member_role: {
        Args: { p_org_id: string; p_role: string; p_user_id: string }
        Returns: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "organization_members"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_update_disclosure:
        | {
            Args: {
              p_data_json?: Json
              p_effective_date?: string
              p_id: string
              p_public_slug?: string
              p_status?: string
              p_summary_md?: string
              p_title?: string
              p_version?: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_data_json: Json
              p_effective_date: string
              p_id: string
              p_status: string
              p_summary_md: string
              p_title: string
            }
            Returns: undefined
          }
      generate_ai_manifest: { Args: { p_org_id: string }; Returns: Json }
      generate_base64url_token: { Args: { bits?: number }; Returns: string }
      generate_monthly_report: {
        Args: { p_org_id: string; p_period_end: string; p_period_start: string }
        Returns: undefined
      }
      generate_openapi_for_org: { Args: { p_org_id: string }; Returns: Json }
      generate_qa_content_hash: {
        Args: { answer: string; question: string; tags: string[] }
        Returns: string
      }
      generate_sensitive_data_report: {
        Args: { end_date?: string; start_date?: string }
        Returns: Json
      }
      get_ai_usage_counts: { Args: { p_org_id: string }; Returns: Json }
      get_billing_summary: {
        Args: never
        Returns: {
          last_updated_jst: string
          organizations_by_campaign: Json
          overall_avg_discount_rate: number
          total_active_public_links: number
          total_campaigns: number
          total_links: number
        }[]
      }
      get_billing_trends: {
        Args: {
          p_days?: number
          p_filter_campaign_type?: string
          p_period?: string
        }
        Returns: {
          campaign_type: string
          daily_activations: number
          daily_signups: number
          date_jst: string
        }[]
      }
      get_campaign_analytics_detailed: {
        Args: { filter_campaign_type?: string; filter_plan_type?: string }
        Returns: {
          active_organizations: number
          active_private_links: number
          active_public_links: number
          avg_discount_rate: number
          campaign_type: string
          current_period_active_links: number
          last_updated_jst: string
          link_utilization_rate: number
          max_discount_rate: number
          plan_type: string
          signup_rate: number
          total_links: number
          total_organizations: number
        }[]
      }
      get_case_study_translation: {
        Args: {
          p_case_study_id: string
          p_fallback_lang?: string
          p_lang: string
        }
        Returns: {
          case_study_id: string
          content: string
          is_primary: boolean
          lang: string
          summary: string
          title: string
        }[]
      }
      get_content_limits: {
        Args: { p_plan: string; p_type: string }
        Returns: number
      }
      get_crawler_policy: { Args: never; Returns: Json }
      get_cron_jobs: {
        Args: never
        Returns: {
          active: boolean
          command: string
          job_id: number
          job_name: string
          schedule: string
        }[]
      }
      get_current_plan:
        | { Args: never; Returns: string }
        | { Args: { p_org_id: string }; Returns: string }
        | {
            Args: { subject_id: string; subject_type: string }
            Returns: {
              plan_id: string
              plan_meta: Json
              plan_name: string
            }[]
          }
      get_current_plan_for_user: {
        Args: { _user_id?: string }
        Returns: string
      }
      get_current_plan_for_user_v1: {
        Args: { p_user: string }
        Returns: {
          organization_id: string
          plan_id: string
          plan_meta: Json
          plan_name: string
        }[]
      }
      get_current_tenant_ids: { Args: never; Returns: string[] }
      get_current_uid: { Args: never; Returns: string }
      get_current_user_role: { Args: { p_org_id: string }; Returns: string }
      get_database_stats: { Args: never; Returns: Json }
      get_effective_feature_set:
        | { Args: { _user_id?: string }; Returns: Json }
        | { Args: { subject_id: string; subject_type: string }; Returns: Json }
      get_effective_org_features: { Args: { p_org_id: string }; Returns: Json }
      get_effective_org_limits: {
        Args: { org_id: string }
        Returns: Record<string, unknown>[]
      }
      get_faq_translation: {
        Args: { p_fallback_lang?: string; p_faq_id: string; p_lang: string }
        Returns: {
          answer: string
          faq_id: string
          is_primary: boolean
          lang: string
          question: string
        }[]
      }
      get_faqs_published: {
        Args: { p_lang?: string; p_org_id: string }
        Returns: {
          answer: string
          answer_plain: string
          base_path: string
          id: string
          lang: string
          published_at: string
          question: string
          slug: string
        }[]
      }
      get_feature_config: {
        Args: { p_feature_key: string; p_user: string }
        Returns: Json
      }
      get_feature_flags: {
        Args: { p_org_id: string }
        Returns: {
          enabled: boolean
          feature_key: string
          value: Json
        }[]
      }
      get_latest_monthly_report: {
        Args: { p_org_id: string }
        Returns: {
          created_at: string
          id: string
          level: string
          metrics: Json
          month_bucket: string | null
          organization_id: string
          period_end: string
          period_start: string
          plan_id: string
          sections: Json
          status: Database["public"]["Enums"]["report_status"]
          suggestions: Json
          summary_text: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "ai_monthly_reports"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_monthly_report:
        | {
            Args: { p_end: string; p_org: string; p_start: string }
            Returns: {
              created_at: string | null
              id: string | null
              level: string | null
              metrics: Json | null
              organization_id: string | null
              period_end: string | null
              period_start: string | null
              plan_id: string | null
              sections: Json | null
              status: string | null
              suggestions: Json | null
              summary_text: string | null
              updated_at: string | null
            }
            SetofOptions: {
              from: "*"
              to: "ai_monthly_reports_compat"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { p_month: number; p_org_id: string; p_year: number }
            Returns: Json
          }
      get_my_organizations_slim: {
        Args: never
        Returns: {
          address: string | null
          address_country: string | null
          address_locality: string | null
          address_postal_code: string | null
          address_region: string | null
          address_street: string | null
          archived: boolean
          availability_note: string | null
          availability_status: string | null
          capital: number | null
          city: string | null
          contact_email: string
          content_hash: string | null
          corporate_number: string | null
          corporate_type: string | null
          country: string | null
          created_at: string
          created_by: string | null
          data_status: Database["public"]["Enums"]["organization_data_status"]
          default_locale: string | null
          deleted_at: string | null
          description: string | null
          discount_group: string | null
          email: string | null
          email_public: boolean | null
          employees: number | null
          entitlements: Json | null
          established_at: string | null
          feature_flags: Json | null
          id: string
          industries: string[] | null
          is_published: boolean
          lat: number | null
          legal_form: string | null
          lng: number | null
          logo_url: string | null
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          name: string
          original_signup_campaign: string | null
          partner_id: string | null
          phone: string | null
          plan: string | null
          plan_id: string
          postal_code: string | null
          prefecture: string | null
          region_code: string | null
          representative_name: string | null
          same_as: string[] | null
          show_case_studies: boolean | null
          show_contact: boolean | null
          show_faqs: boolean | null
          show_news: boolean | null
          show_partnership: boolean | null
          show_posts: boolean | null
          show_products: boolean | null
          show_qa: boolean | null
          show_services: boolean | null
          slug: string
          source_urls: string[] | null
          status: Database["public"]["Enums"]["organization_status"]
          street_address: string | null
          telephone: string | null
          trial_end: string | null
          updated_at: string | null
          url: string | null
          user_id: string
          verification_source: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          website_url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "organizations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_navigation: {
        Args: { p_org_id: string }
        Returns: {
          key: string
          label: string
          parent_key: string
          path: string
          sort_order: number
        }[]
      }
      get_news_translation: {
        Args: { p_fallback_lang?: string; p_lang: string; p_news_id: string }
        Returns: {
          content: string
          is_primary: boolean
          lang: string
          news_id: string
          summary: string
          title: string
        }[]
      }
      get_org_quota_usage: {
        Args: { p_feature_key: string; p_org_id: string }
        Returns: Json
      }
      get_partner_organizations: {
        Args: { user_id?: string }
        Returns: {
          access_level: string
          organization_id: string
          permissions: Json
        }[]
      }
      get_plan_features: { Args: { p_org_id: string }; Returns: Json }
      get_post_translation: {
        Args: { p_fallback_lang?: string; p_lang: string; p_post_id: string }
        Returns: {
          content: string
          is_primary: boolean
          lang: string
          post_id: string
          summary: string
          title: string
        }[]
      }
      get_product_translation: {
        Args: { p_fallback_lang?: string; p_lang: string; p_product_id: string }
        Returns: {
          description: string
          is_primary: boolean
          lang: string
          name: string
          product_id: string
        }[]
      }
      get_rate_limit_stats: {
        Args: { end_time?: string; start_time?: string }
        Returns: {
          blocked_requests: number
          bot_requests: number
          top_paths: Json
          top_user_agents: Json
          total_requests: number
          unique_ips: number
          violation_summary: Json
        }[]
      }
      get_report_level: { Args: { p_org_id: string }; Returns: string }
      get_service_role_usage_stats: {
        Args: { end_date?: string; start_date?: string }
        Returns: Json
      }
      get_service_translation: {
        Args: { p_fallback_lang?: string; p_lang: string; p_service_id: string }
        Returns: {
          description: string
          is_primary: boolean
          lang: string
          name: string
          service_id: string
        }[]
      }
      get_storage_metrics: {
        Args: { p_window?: string }
        Returns: {
          error_count: number
          error_rate_pct: number
          p50_latency_ms: number
          p95_latency_ms: number
          total: number
          window_label: string
        }[]
      }
      get_user_access_summary: { Args: { user_id?: string }; Returns: Json }
      get_user_org_id: { Args: never; Returns: string }
      get_user_org_roles: {
        Args: { p_user: string }
        Returns: {
          organization_id: string
          role: string
        }[]
      }
      get_user_org_roles_v2: {
        Args: { p_user_id: string }
        Returns: {
          organization_id: string
          role: string
        }[]
      }
      get_user_organizations: {
        Args: { user_id?: string }
        Returns: {
          organization_id: string
          role: string
        }[]
      }
      get_user_role: { Args: { user_id?: string }; Returns: string }
      get_user_tenant: { Args: never; Returns: string }
      get_user_tenants: { Args: never; Returns: string[] }
      get_violation_enforcement_recommendation: {
        Args: { p_user_id: string }
        Returns: Json
      }
      has_any_role: {
        Args: { roles: string[]; user_id?: string }
        Returns: boolean
      }
      has_org_role: {
        Args: { org_id: string; roles: string[] }
        Returns: boolean
      }
      has_organization_role: {
        Args: { org_id: string; required_role: string; user_id?: string }
        Returns: boolean
      }
      has_partner_permission: {
        Args: { org_id: string; permission: string; user_id?: string }
        Returns: boolean
      }
      increment_job_retry: { Args: { p_job_id: string }; Returns: undefined }
      increment_org_interview_stats: {
        Args: {
          p_interview_count?: number
          p_message_count?: number
          p_org_id: string
        }
        Returns: undefined
      }
      increment_retry_count: { Args: { p_id: number }; Returns: undefined }
      increment_used_count: { Args: { p_code: string }; Returns: undefined }
      insert_content_guarded: {
        Args: { p_payload: Json; p_type: string }
        Returns: string
      }
      is_active_account: { Args: { uid: string }; Returns: boolean }
      is_admin: { Args: { user_id?: string }; Returns: boolean }
      is_app_admin: { Args: never; Returns: boolean }
      is_editor_or_admin: { Args: never; Returns: boolean }
      is_ip_blocked: { Args: { check_ip: unknown }; Returns: boolean }
      is_org_admin: { Args: { p_org: string }; Returns: boolean }
      is_org_member: { Args: { p_org: string }; Returns: boolean }
      is_org_role: {
        Args: { allowed_roles: string[]; org_id: string }
        Returns: boolean
      }
      is_organization_member: {
        Args: { org_id: string; user_id?: string }
        Returns: boolean
      }
      is_owner: { Args: { user_id?: string }; Returns: boolean }
      is_partner: { Args: { user_id?: string }; Returns: boolean }
      is_partner_with_access: {
        Args: { org_id: string; required_level?: string; user_id?: string }
        Returns: boolean
      }
      is_service_role: { Args: never; Returns: boolean }
      is_site_admin:
        | { Args: never; Returns: boolean }
        | { Args: { uid: string }; Returns: boolean }
      is_user_admin_of_org: { Args: { p_org_id: string }; Returns: boolean }
      last_day_utc: { Args: { d: string }; Returns: string }
      list_monthly_reports_by_year_month: {
        Args: {
          p_before?: string
          p_limit?: number
          p_month: number
          p_org_id: string
          p_year: number
        }
        Returns: {
          created_at: string
          id: string
          level: string
          metrics: Json
          month_bucket: string | null
          organization_id: string
          period_end: string
          period_start: string
          plan_id: string
          sections: Json
          status: Database["public"]["Enums"]["report_status"]
          suggestions: Json
          summary_text: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "ai_monthly_reports"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      log_ai_usage: {
        Args: { p_kind: string; p_org_id: string }
        Returns: undefined
      }
      log_analytics_event: {
        Args: {
          p_event_key: string
          p_feature_key?: string
          p_payload?: Json
          p_user_id?: string
        }
        Returns: undefined
      }
      log_ops: {
        Args: {
          action: string
          actor: string
          endpoint: string
          entity_ids?: string[]
          entity_kind?: string
          error_summary?: string
          reason?: string
          request_id: string
          status?: string
          user_agent?: string
        }
        Returns: undefined
      }
      log_rls_denied: {
        Args: {
          p_api_endpoint?: string
          p_details?: Json
          p_operation: string
          p_org_id?: string
          p_reason: Database["public"]["Enums"]["rls_denied_reason"]
          p_request_id?: string
          p_resource?: string
          p_screen_path?: string
          p_session_id?: string
          p_table_name: string
          p_user_role?: string
        }
        Returns: undefined
      }
      log_schema_change: {
        Args: { p_details?: Json; p_title: string }
        Returns: undefined
      }
      log_service_role_action: {
        Args: {
          p_affected_row_count: number
          p_error_code: string
          p_expected_row_count: number
          p_job_name: string
          p_meta: Json
          p_request_id: string
        }
        Returns: undefined
      }
      make_base_path: { Args: { _content_type: string }; Returns: string }
      make_canonical_url: {
        Args: { _base_path: string; _slug: string }
        Returns: string
      }
      make_embedding_idempotency_key: {
        Args: {
          p_content_hash: string
          p_embedding_model: string
          p_org_id: string
          p_source_field: string
          p_source_id: string
          p_source_table: string
        }
        Returns: string
      }
      make_period_key: {
        Args: { period: string; reset_day?: number; ts?: string }
        Returns: string
      }
      make_translation_idempotency_key: {
        Args: {
          p_org_id: string
          p_source_field: string
          p_source_id: string
          p_source_lang: string
          p_source_table: string
          p_source_text: string
          p_target_lang: string
        }
        Returns: string
      }
      manage_sensitive_pattern: {
        Args: {
          action: string
          description_param?: string
          pattern_name_param: string
          regex_pattern_param?: string
          replacement_text_param?: string
          severity_level_param?: string
        }
        Returns: boolean
      }
      month_bounds: {
        Args: { p_date?: string }
        Returns: {
          end_date: string
          start_date: string
        }[]
      }
      month_period_key: { Args: { ts: string }; Returns: string }
      normalize_ddl_object_kind: { Args: { kind: string }; Returns: string }
      normalize_jsonb: { Args: { in_val: Json }; Returns: Json }
      normalize_jsonb_any: { Args: { in_val: Json }; Returns: Json }
      ops_check_org_schema: { Args: never; Returns: Json }
      ops_fix_org_schema: { Args: never; Returns: Json }
      org_role: { Args: { org: string }; Returns: string }
      pick_pending_jobs: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          job_name: string
          max_retries: number
          meta: Json
          retry_count: number
        }[]
      }
      process_enforcement_deadlines: { Args: never; Returns: number }
      process_enforcement_deadlines_test: { Args: never; Returns: number }
      proj_ai_content_units: {
        Args: { r: Database["public"]["Tables"]["ai_content_units"]["Row"] }
        Returns: Json
      }
      proj_case_studies: {
        Args: { r: Database["public"]["Tables"]["case_studies"]["Row"] }
        Returns: Json
      }
      proj_case_study_translations: {
        Args: {
          r: Database["public"]["Tables"]["case_study_translations"]["Row"]
        }
        Returns: Json
      }
      proj_faq_translations: {
        Args: { r: Database["public"]["Tables"]["faq_translations"]["Row"] }
        Returns: Json
      }
      proj_faqs: {
        Args: { r: Database["public"]["Tables"]["faqs"]["Row"] }
        Returns: Json
      }
      proj_news: {
        Args: { r: Database["public"]["Tables"]["news"]["Row"] }
        Returns: Json
      }
      proj_news_translations: {
        Args: { r: Database["public"]["Tables"]["news_translations"]["Row"] }
        Returns: Json
      }
      proj_organization_keywords: {
        Args: {
          r: Database["public"]["Tables"]["organization_keywords"]["Row"]
        }
        Returns: Json
      }
      proj_organizations: {
        Args: { r: Database["public"]["Tables"]["organizations"]["Row"] }
        Returns: Json
      }
      proj_post_translations: {
        Args: { r: Database["public"]["Tables"]["post_translations"]["Row"] }
        Returns: Json
      }
      proj_posts: {
        Args: { r: Database["public"]["Tables"]["posts"]["Row"] }
        Returns: Json
      }
      proj_product_translations: {
        Args: { r: Database["public"]["Tables"]["product_translations"]["Row"] }
        Returns: Json
      }
      proj_products: {
        Args: { r: Database["public"]["Tables"]["products"]["Row"] }
        Returns: Json
      }
      proj_service_translations: {
        Args: { r: Database["public"]["Tables"]["service_translations"]["Row"] }
        Returns: Json
      }
      proj_services: {
        Args: { r: Database["public"]["Tables"]["services"]["Row"] }
        Returns: Json
      }
      provision_monthly_reporting: {
        Args: {
          p_org_id: string
          p_org_name: string
          p_org_slug: string
          p_owner_user_id: string
        }
        Returns: Json
      }
      prune_activities_partitions: { Args: never; Returns: undefined }
      prune_ai_bot_logs: { Args: never; Returns: undefined }
      prune_analytics_events: { Args: never; Returns: undefined }
      prune_audit_log_partitions: { Args: never; Returns: undefined }
      prune_old_partitions: {
        Args: { dry_run?: boolean; retention_months: number }
        Returns: {
          action: string
          partition_table: string
        }[]
      }
      prune_rate_limit_logs: { Args: never; Returns: undefined }
      prune_rate_limit_requests: { Args: never; Returns: undefined }
      prune_security_incidents: { Args: never; Returns: undefined }
      public_get_chunks: {
        Args: {
          p_lang?: string
          p_limit?: number
          p_offset?: number
          p_org_id?: string
          p_since?: string
        }
        Returns: {
          attribution: string
          canonical_url: string
          chunk_id: string
          excerpt: string
          lang: string
          license: string
          published_at: string
          section_anchor: string
          updated_at: string
        }[]
      }
      public_get_jsonld:
        | { Args: { p_canonical_url: string }; Returns: Json }
        | {
            Args: {
              p_lang?: string
              p_limit?: number
              p_offset?: number
              p_org_id?: string
            }
            Returns: {
              canonical_url: string
              jsonld: Json
              lang: string
              schema_types: string[]
              source_id: string
              updated_at: string
              version: number
            }[]
          }
      publish_ai_disclosure: { Args: { p_doc_id: string }; Returns: boolean }
      publish_disclosure: {
        Args: { p_actor: string; p_doc_id: string; p_request_id?: string }
        Returns: Json
      }
      rate_limit_logs_daily_7d: {
        Args: never
        Returns: {
          day: string
          hits: number
        }[]
      }
      rate_limit_requests_daily_7d: {
        Args: never
        Returns: {
          day: string
          hits: number
        }[]
      }
      refresh_rate_limit_write_health: { Args: never; Returns: undefined }
      refresh_rate_limit_write_health_if_needed: {
        Args: { max_stale_seconds?: number }
        Returns: undefined
      }
      regenerate_monthly_report: {
        Args: { p_end: string; p_meta?: Json; p_org: string; p_start: string }
        Returns: string
      }
      report_level_from_plan: { Args: { p_plan: string }; Returns: string }
      report_public_view_stats: {
        Args: never
        Returns: {
          row_count: number
          view_name: string
        }[]
      }
      report_publish_candidates: {
        Args: never
        Returns: {
          need_publish_visibility_fix: number
          table_name: string
          total: number
          visibility_null: number
        }[]
      }
      request_regenerate_monthly_report: {
        Args: { p_month: number; p_org_id: string; p_year: number }
        Returns: Json
      }
      request_report_regeneration: {
        Args: {
          p_idempotency_key: string
          p_max_retries?: number
          p_org_id: string
          p_period_end: string
          p_period_start: string
        }
        Returns: string
      }
      resolve_intrusion_alert: {
        Args: {
          alert_id: string
          mark_false_positive?: boolean
          resolution_notes_param?: string
        }
        Returns: boolean
      }
      restrict_service_role_operations: {
        Args: {
          enable_restriction?: boolean
          operation_types?: string[]
          table_names?: string[]
        }
        Returns: boolean
      }
      revoke_shared_link: { Args: { p_link_id: string }; Returns: undefined }
      role_priority: { Args: { p_role: string }; Returns: number }
      rollback_public_content: {
        Args: {
          p_entity: string
          p_lang: string
          p_slug: string
          p_version?: string
        }
        Returns: Json
      }
      rotate_audit_partitions: {
        Args: { retain_months: number }
        Returns: undefined
      }
      row_content_projection: { Args: { tbl: unknown }; Returns: Json }
      run_enqueue_last_month_reports: { Args: never; Returns: undefined }
      run_ensure_next_month_partitions: { Args: never; Returns: undefined }
      run_monthly_report_jobs: { Args: { p_limit?: number }; Returns: Json }
      run_prune_old_partitions: {
        Args: { dry_run: boolean; retention_months: number }
        Returns: undefined
      }
      run_rls_regression_tests: { Args: { target?: string }; Returns: Json }
      run_rls_tests: { Args: { _trigger_type?: string }; Returns: string }
      run_rls_tests_full: { Args: { _trigger_type?: string }; Returns: string }
      run_single_rls_test: {
        Args: {
          p_scenario_id: string
          p_test_run_id: string
          p_test_user_id: string
        }
        Returns: Json
      }
      safe_partition: { Args: { rel_prefix: string }; Returns: unknown }
      sanitize_ident: { Args: { p_name: string }; Returns: string }
      scheduled_intrusion_detection: { Args: never; Returns: undefined }
      search_embeddings_by_vector: {
        Args: {
          p_lang?: string
          p_min_score?: number
          p_org_id: string
          p_query_embedding: string
          p_source_table?: string
          p_top_k?: number
        }
        Returns: {
          chunk_index: number
          chunk_text: string
          organization_id: string
          score: number
          source_field: string
          source_id: string
          source_table: string
        }[]
      }
      secure_delete_case_studies: { Args: { p_id: string }; Returns: undefined }
      secure_delete_faqs: { Args: { p_id: string }; Returns: undefined }
      secure_delete_news: { Args: { p_id: string }; Returns: undefined }
      secure_delete_posts: { Args: { p_id: string }; Returns: undefined }
      secure_delete_services: { Args: { p_id: string }; Returns: undefined }
      secure_insert_case_studies: { Args: { p_row: Json }; Returns: string }
      secure_insert_faqs: { Args: { p_row: Json }; Returns: string }
      secure_insert_news: { Args: { p_row: Json }; Returns: string }
      secure_insert_posts: { Args: { p_row: Json }; Returns: string }
      secure_insert_services: { Args: { p_row: Json }; Returns: string }
      secure_update_case_studies: {
        Args: { p_id: string; p_patch: Json }
        Returns: undefined
      }
      secure_update_faqs: {
        Args: { p_id: string; p_patch: Json }
        Returns: undefined
      }
      secure_update_news: {
        Args: { p_id: string; p_patch: Json }
        Returns: undefined
      }
      secure_update_post: {
        Args: { p_id: string; p_patch: Json }
        Returns: undefined
      }
      secure_update_posts: {
        Args: { p_id: string; p_patch: Json }
        Returns: undefined
      }
      secure_update_services: {
        Args: { p_id: string; p_patch: Json }
        Returns: undefined
      }
      security_incidents_daily_7d: {
        Args: never
        Returns: {
          day: string
          incidents: number
        }[]
      }
      seed_ai_monthly_reports_last_month: { Args: never; Returns: undefined }
      sha256_text: { Args: { p_text: string }; Returns: string }
      soft_delete_comment: { Args: { p_id: string }; Returns: undefined }
      soft_delete_task: { Args: { p_id: string }; Returns: undefined }
      sync_all_public_content: { Args: never; Returns: undefined }
      sync_public_after_translation: {
        Args: { p_source_table: string }
        Returns: undefined
      }
      sync_public_case_studies_tbl: { Args: never; Returns: undefined }
      sync_public_faqs_tbl: { Args: never; Returns: undefined }
      sync_public_news_tbl: { Args: never; Returns: undefined }
      sync_public_posts_tbl: { Args: never; Returns: undefined }
      sync_public_products_tbl: { Args: never; Returns: undefined }
      sync_to_public: {
        Args: { source_table: string; target_table: string }
        Returns: undefined
      }
      to_slug: { Args: { input: string }; Returns: string }
      unblock_ip: {
        Args: { target_ip: unknown; unblock_reason?: string }
        Returns: boolean
      }
      unpublish_org_public_content_for_user: {
        Args: { p_user_id: string }
        Returns: number
      }
      update_row_with_version: {
        Args: {
          p_expected_version: number
          p_id: string
          p_new_values: Json
          p_table: string
        }
        Returns: boolean
      }
      update_user_role: {
        Args: { new_role: string; target_user_id: string }
        Returns: boolean
      }
      upsert_monthly_report: {
        Args: { p_end: string; p_org: string; p_start: string }
        Returns: string
      }
      user_can_access_post: {
        Args: { post_id: string; user_id?: string }
        Returns: boolean
      }
      user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      validate_org_access: {
        Args: { org_id: string; required_permission?: string; user_id?: string }
        Returns: boolean
      }
      verify_shared_link_password: {
        Args: { p_link_id: string; p_password: string }
        Returns: boolean
      }
    }
    Enums: {
      cms_content_status: "draft" | "published" | "archived"
      cms_content_type:
        | "qna"
        | "faq"
        | "blog"
        | "news"
        | "case_study"
        | "material"
        | "interview"
        | "product"
        | "service"
      cms_generation_source:
        | "manual"
        | "interview_blog"
        | "interview_qna"
        | "interview_case_study"
      contract_violation_type:
        | "INVALID_ENUM"
        | "NULL_NOT_ALLOWED"
        | "LENGTH_OVER"
        | "FORMAT_INVALID"
        | "RANGE_VIOLATION"
        | "TYPE_MISMATCH"
        | "UNIQUE_VIOLATION"
        | "FK_VIOLATION"
        | "CHECK_CONSTRAINT"
        | "PAYLOAD_MALFORMED"
        | "REQUIRED_FIELD_MISSING"
        | "DUPLICATE_REQUEST"
        | "BUSINESS_RULE_VIOLATION"
        | "UNSUPPORTED_VALUE"
        | "JSON_SCHEMA_VIOLATION"
      interview_content_type:
        | "service"
        | "product"
        | "post"
        | "news"
        | "faq"
        | "case_study"
      interview_session_status: "draft" | "in_progress" | "completed"
      organization_data_status: "ai_generated" | "user_verified"
      organization_status: "draft" | "published" | "archived"
      partnership_type:
        | "strategic"
        | "technology"
        | "distribution"
        | "investment"
      report_status: "pending" | "generating" | "completed" | "failed"
      rls_denied_reason:
        | "RLS_DENY"
        | "NOT_MEMBER"
        | "INSUFFICIENT_ROLE"
        | "MISSING_JWT"
        | "TENANT_MISMATCH"
        | "POLICY_CONDITION_FAILED"
        | "PRIVATE_CHANNEL_REQUIRED"
        | "BUCKET_POLICY_DENY"
        | "EXPIRED_SESSION"
      user_role: "admin" | "editor" | "viewer"
    }
    CompositeTypes: {
      admin_get_content_refresh_history_row: {
        job_id: string | null
        started_at: string | null
        finished_at: string | null
        duration_ms: number | null
        entity_type: string | null
        entity_id: string | null
        content_version: number | null
        status: string | null
        trigger_source: string | null
        steps: Json | null
      }
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
      cms_content_status: ["draft", "published", "archived"],
      cms_content_type: [
        "qna",
        "faq",
        "blog",
        "news",
        "case_study",
        "material",
        "interview",
        "product",
        "service",
      ],
      cms_generation_source: [
        "manual",
        "interview_blog",
        "interview_qna",
        "interview_case_study",
      ],
      contract_violation_type: [
        "INVALID_ENUM",
        "NULL_NOT_ALLOWED",
        "LENGTH_OVER",
        "FORMAT_INVALID",
        "RANGE_VIOLATION",
        "TYPE_MISMATCH",
        "UNIQUE_VIOLATION",
        "FK_VIOLATION",
        "CHECK_CONSTRAINT",
        "PAYLOAD_MALFORMED",
        "REQUIRED_FIELD_MISSING",
        "DUPLICATE_REQUEST",
        "BUSINESS_RULE_VIOLATION",
        "UNSUPPORTED_VALUE",
        "JSON_SCHEMA_VIOLATION",
      ],
      interview_content_type: [
        "service",
        "product",
        "post",
        "news",
        "faq",
        "case_study",
      ],
      interview_session_status: ["draft", "in_progress", "completed"],
      organization_data_status: ["ai_generated", "user_verified"],
      organization_status: ["draft", "published", "archived"],
      partnership_type: [
        "strategic",
        "technology",
        "distribution",
        "investment",
      ],
      report_status: ["pending", "generating", "completed", "failed"],
      rls_denied_reason: [
        "RLS_DENY",
        "NOT_MEMBER",
        "INSUFFICIENT_ROLE",
        "MISSING_JWT",
        "TENANT_MISMATCH",
        "POLICY_CONDITION_FAILED",
        "PRIVATE_CHANNEL_REQUIRED",
        "BUCKET_POLICY_DENY",
        "EXPIRED_SESSION",
      ],
      user_role: ["admin", "editor", "viewer"],
    },
  },
} as const
