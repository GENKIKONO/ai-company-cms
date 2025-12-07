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
      activities_202512: {
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
      activities_202601: {
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
      activities_202602: {
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
      activities_202603: {
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
      activities_202604: {
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
        Relationships: []
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
      ai_bot_logs_202512: {
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
      ai_bot_logs_202601: {
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
      ai_bot_logs_202602: {
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
      ai_bot_logs_202603: {
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
      ai_bot_logs_202604: {
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
      ai_bot_logs_202605: {
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
            foreignKeyName: "ai_citations_items_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "ai_citations_responses"
            referencedColumns: ["id"]
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
        }
        Relationships: [
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
        ]
      }
      ai_content_units: {
        Row: {
          content_type: string
          created_at: string | null
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
          content_type: string
          created_at?: string | null
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
          content_type?: string
          created_at?: string | null
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
        ]
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
      ai_interview_question_logs: {
        Row: {
          id: string
          organization_id: string
          session_id: string | null
          question_id: string | null
          turn_index: number
          asked_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          session_id?: string | null
          question_id?: string | null
          turn_index: number
          asked_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          session_id?: string | null
          question_id?: string | null
          turn_index?: number
          asked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_interview_question_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_question_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interview_question_logs_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "ai_interview_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          price_id: string
          name: string
          monthly_interview_questions: number
          monthly_token_quota: number | null
          features: Json | null
        }
        Insert: {
          price_id: string
          name: string
          monthly_interview_questions: number
          monthly_token_quota?: number | null
          features?: Json | null
        }
        Update: {
          price_id?: string
          name?: string
          monthly_interview_questions?: number
          monthly_token_quota?: number | null
          features?: Json | null
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
          generated_content: string | null
          id: string
          meta: Json | null
          notes: string | null
          organization_id: string | null
          status: Database["public"]["Enums"]["interview_session_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          answers?: Json
          content_type: Database["public"]["Enums"]["interview_content_type"]
          created_at?: string
          generated_content?: string | null
          id?: string
          meta?: Json | null
          notes?: string | null
          organization_id?: string | null
          status?: Database["public"]["Enums"]["interview_session_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          answers?: Json
          content_type?: Database["public"]["Enums"]["interview_content_type"]
          created_at?: string
          generated_content?: string | null
          id?: string
          meta?: Json | null
          notes?: string | null
          organization_id?: string | null
          status?: Database["public"]["Enums"]["interview_session_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
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
          created_at: string | null
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
          created_at?: string | null
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
          created_at?: string | null
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
            foreignKeyName: "ai_visibility_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_visibility_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ai_visibility_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_visibility_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
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
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          event_properties: Json | null
          id: string
          ip_address: unknown
          page_url: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at: string
          event_name: string
          event_properties?: Json | null
          id: string
          ip_address?: unknown
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          event_properties?: Json | null
          id?: string
          ip_address?: unknown
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events_202511: {
        Row: {
          created_at: string
          event_name: string
          event_properties: Json | null
          id: string
          ip_address: unknown
          page_url: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at: string
          event_name: string
          event_properties?: Json | null
          id: string
          ip_address?: unknown
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          event_properties?: Json | null
          id?: string
          ip_address?: unknown
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events_202512: {
        Row: {
          created_at: string
          event_name: string
          event_properties: Json | null
          id: string
          ip_address: unknown
          page_url: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at: string
          event_name: string
          event_properties?: Json | null
          id: string
          ip_address?: unknown
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          event_properties?: Json | null
          id?: string
          ip_address?: unknown
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events_202601: {
        Row: {
          created_at: string
          event_name: string
          event_properties: Json | null
          id: string
          ip_address: unknown
          page_url: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at: string
          event_name: string
          event_properties?: Json | null
          id: string
          ip_address?: unknown
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          event_properties?: Json | null
          id?: string
          ip_address?: unknown
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events_202602: {
        Row: {
          created_at: string
          event_name: string
          event_properties: Json | null
          id: string
          ip_address: unknown
          page_url: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at: string
          event_name: string
          event_properties?: Json | null
          id: string
          ip_address?: unknown
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          event_properties?: Json | null
          id?: string
          ip_address?: unknown
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events_202603: {
        Row: {
          created_at: string
          event_name: string
          event_properties: Json | null
          id: string
          ip_address: unknown
          page_url: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at: string
          event_name: string
          event_properties?: Json | null
          id: string
          ip_address?: unknown
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          event_properties?: Json | null
          id?: string
          ip_address?: unknown
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events_202604: {
        Row: {
          created_at: string
          event_name: string
          event_properties: Json | null
          id: string
          ip_address: unknown
          page_url: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at: string
          event_name: string
          event_properties?: Json | null
          id: string
          ip_address?: unknown
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          event_properties?: Json | null
          id?: string
          ip_address?: unknown
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events_202605: {
        Row: {
          created_at: string
          event_name: string
          event_properties: Json | null
          id: string
          ip_address: unknown
          page_url: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at: string
          event_name: string
          event_properties?: Json | null
          id: string
          ip_address?: unknown
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          event_properties?: Json | null
          id?: string
          ip_address?: unknown
          page_url?: string | null
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
            foreignKeyName: "app_users_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          actor_id: string | null
          at: string
          id: number
          ip: unknown
          new_data: Json | null
          old_data: Json | null
          op: string
          table_name: string
          ua: string | null
        }
        Insert: {
          actor_id?: string | null
          at?: string
          id?: number
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
          op: string
          table_name: string
          ua?: string | null
        }
        Update: {
          actor_id?: string | null
          at?: string
          id?: number
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
          op?: string
          table_name?: string
          ua?: string | null
        }
        Relationships: []
      }
      audit_log_202511: {
        Row: {
          actor_id: string | null
          at: string
          id: number
          ip: unknown
          new_data: Json | null
          old_data: Json | null
          op: string
          table_name: string
          ua: string | null
        }
        Insert: {
          actor_id?: string | null
          at?: string
          id?: number
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
          op: string
          table_name: string
          ua?: string | null
        }
        Update: {
          actor_id?: string | null
          at?: string
          id?: number
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
          op?: string
          table_name?: string
          ua?: string | null
        }
        Relationships: []
      }
      audit_log_202512: {
        Row: {
          actor_id: string | null
          at: string
          id: number
          ip: unknown
          new_data: Json | null
          old_data: Json | null
          op: string
          table_name: string
          ua: string | null
        }
        Insert: {
          actor_id?: string | null
          at?: string
          id?: number
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
          op: string
          table_name: string
          ua?: string | null
        }
        Update: {
          actor_id?: string | null
          at?: string
          id?: number
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
          op?: string
          table_name?: string
          ua?: string | null
        }
        Relationships: []
      }
      audit_log_202601: {
        Row: {
          actor_id: string | null
          at: string
          id: number
          ip: unknown
          new_data: Json | null
          old_data: Json | null
          op: string
          table_name: string
          ua: string | null
        }
        Insert: {
          actor_id?: string | null
          at?: string
          id?: number
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
          op: string
          table_name: string
          ua?: string | null
        }
        Update: {
          actor_id?: string | null
          at?: string
          id?: number
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
          op?: string
          table_name?: string
          ua?: string | null
        }
        Relationships: []
      }
      audit_log_202602: {
        Row: {
          actor_id: string | null
          at: string
          id: number
          ip: unknown
          new_data: Json | null
          old_data: Json | null
          op: string
          table_name: string
          ua: string | null
        }
        Insert: {
          actor_id?: string | null
          at?: string
          id?: number
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
          op: string
          table_name: string
          ua?: string | null
        }
        Update: {
          actor_id?: string | null
          at?: string
          id?: number
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
          op?: string
          table_name?: string
          ua?: string | null
        }
        Relationships: []
      }
      audit_log_202603: {
        Row: {
          actor_id: string | null
          at: string
          id: number
          ip: unknown
          new_data: Json | null
          old_data: Json | null
          op: string
          table_name: string
          ua: string | null
        }
        Insert: {
          actor_id?: string | null
          at?: string
          id?: number
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
          op: string
          table_name: string
          ua?: string | null
        }
        Update: {
          actor_id?: string | null
          at?: string
          id?: number
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
          op?: string
          table_name?: string
          ua?: string | null
        }
        Relationships: []
      }
      audit_log_202604: {
        Row: {
          actor_id: string | null
          at: string
          id: number
          ip: unknown
          new_data: Json | null
          old_data: Json | null
          op: string
          table_name: string
          ua: string | null
        }
        Insert: {
          actor_id?: string | null
          at?: string
          id?: number
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
          op: string
          table_name: string
          ua?: string | null
        }
        Update: {
          actor_id?: string | null
          at?: string
          id?: number
          ip?: unknown
          new_data?: Json | null
          old_data?: Json | null
          op?: string
          table_name?: string
          ua?: string | null
        }
        Relationships: []
      }
      audit_logs: {
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
      behavioral_patterns: {
        Row: {
          anomaly_score: number | null
          created_at: string | null
          id: string
          ip_address: unknown
          last_analysis: string | null
          normal_patterns: Json | null
          pattern_data: Json | null
          session_fingerprint: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          anomaly_score?: number | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          last_analysis?: string | null
          normal_patterns?: Json | null
          pattern_data?: Json | null
          session_fingerprint?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          anomaly_score?: number | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          last_analysis?: string | null
          normal_patterns?: Json | null
          pattern_data?: Json | null
          session_fingerprint?: string | null
          updated_at?: string | null
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
        Relationships: []
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
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          industry: string | null
          is_anonymous: boolean | null
          is_published: boolean | null
          locale: string | null
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
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          industry?: string | null
          is_anonymous?: boolean | null
          is_published?: boolean | null
          locale?: string | null
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
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          industry?: string | null
          is_anonymous?: boolean | null
          is_published?: boolean | null
          locale?: string | null
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
            foreignKeyName: "case_studies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "case_studies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["service_id"]
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
        ]
      }
      case_study_translations: {
        Row: {
          case_study_id: string
          content: string | null
          is_primary: boolean
          lang: string
          summary: string | null
          title: string | null
        }
        Insert: {
          case_study_id: string
          content?: string | null
          is_primary?: boolean
          lang: string
          summary?: string | null
          title?: string | null
        }
        Update: {
          case_study_id?: string
          content?: string | null
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
            referencedRelation: "public_case_studies"
            referencedColumns: ["case_study_id"]
          },
          {
            foreignKeyName: "case_study_translations_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "public_case_studies_jsonld"
            referencedColumns: ["case_study_id"]
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
        ]
      }
      chatbots: {
        Row: {
          bot_type: string
          created_at: string
          created_by: string | null
          default_language: string
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
          display_name?: string
          id?: string
          organization_id?: string | null
          settings?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
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
        ]
      }
      cms_site_settings: {
        Row: {
          created_at: string
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
        ]
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
          faq_id: string
          is_primary: boolean
          lang: string
          question: string | null
        }
        Insert: {
          answer?: string | null
          faq_id: string
          is_primary?: boolean
          lang: string
          question?: string | null
        }
        Update: {
          answer?: string | null
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
          created_at: string | null
          created_by: string
          display_order: number | null
          id: string
          is_published: boolean
          locale: string | null
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
          created_at?: string | null
          created_by: string
          display_order?: number | null
          id?: string
          is_published?: boolean
          locale?: string | null
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
          created_at?: string | null
          created_by?: string
          display_order?: number | null
          id?: string
          is_published?: boolean
          locale?: string | null
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
            foreignKeyName: "faqs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "faqs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["service_id"]
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
        ]
      }
      feature_registry: {
        Row: {
          category: string | null
          control_type: string
          created_at: string | null
          description: string | null
          display_name: string
          feature_key: string
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          control_type: string
          created_at?: string | null
          description?: string | null
          display_name: string
          feature_key: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          control_type?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          feature_key?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
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
        Relationships: []
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
      news: {
        Row: {
          base_path: string | null
          category: string | null
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_published: boolean | null
          locale: string | null
          organization_id: string | null
          published_at: string | null
          published_date: string | null
          region_code: string | null
          slug: string | null
          summary: string | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          base_path?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          organization_id?: string | null
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          slug?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          base_path?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          locale?: string | null
          organization_id?: string | null
          published_at?: string | null
          published_date?: string | null
          region_code?: string | null
          slug?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "news_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      news_translations: {
        Row: {
          content: string | null
          is_primary: boolean
          lang: string
          news_id: string
          summary: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          is_primary?: boolean
          lang: string
          news_id: string
          summary?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
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
            referencedRelation: "public_news"
            referencedColumns: ["news_id"]
          },
          {
            foreignKeyName: "news_translations_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "public_news_jsonld"
            referencedColumns: ["news_id"]
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
            foreignKeyName: "org_group_invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "organization_groups"
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
            foreignKeyName: "org_group_join_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "organization_groups"
            referencedColumns: ["id"]
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
        Relationships: []
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
        ]
      }
      organization_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_keywords: {
        Row: {
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
            foreignKeyName: "organization_members_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_members_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
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
          availability_note: string | null
          availability_status: string | null
          capital: number | null
          city: string | null
          contact_email: string
          corporate_number: string | null
          corporate_type: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          data_status: Database["public"]["Enums"]["organization_data_status"]
          default_locale: string | null
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
          slug: string
          source_urls: string[] | null
          status: Database["public"]["Enums"]["organization_status"] | null
          street_address: string | null
          telephone: string | null
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
          availability_note?: string | null
          availability_status?: string | null
          capital?: number | null
          city?: string | null
          contact_email?: string
          corporate_number?: string | null
          corporate_type?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          data_status?: Database["public"]["Enums"]["organization_data_status"]
          default_locale?: string | null
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
          slug: string
          source_urls?: string[] | null
          status?: Database["public"]["Enums"]["organization_status"] | null
          street_address?: string | null
          telephone?: string | null
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
          availability_note?: string | null
          availability_status?: string | null
          capital?: number | null
          city?: string | null
          contact_email?: string
          corporate_number?: string | null
          corporate_type?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          data_status?: Database["public"]["Enums"]["organization_data_status"]
          default_locale?: string | null
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
          slug?: string
          source_urls?: string[] | null
          status?: Database["public"]["Enums"]["organization_status"] | null
          street_address?: string | null
          telephone?: string | null
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
            foreignKeyName: "fk_organizations_partner"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_organizations: {
        Row: {
          access_level: string
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          organization_id: string
          partner_user_id: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          access_level?: string
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          partner_user_id: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          access_level?: string
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          partner_user_id?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partner_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
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
      partnerships: {
        Row: {
          created_at: string | null
          description: string | null
          ended_at: string | null
          id: string
          is_active: boolean | null
          organization_a_id: string | null
          organization_b_id: string | null
          partnership_type:
            | Database["public"]["Enums"]["partnership_type"]
            | null
          started_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_a_id?: string | null
          organization_b_id?: string | null
          partnership_type?:
            | Database["public"]["Enums"]["partnership_type"]
            | null
          started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          organization_a_id?: string | null
          organization_b_id?: string | null
          partnership_type?:
            | Database["public"]["Enums"]["partnership_type"]
            | null
          started_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partnerships_organization_a_id_fkey"
            columns: ["organization_a_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnerships_organization_a_id_fkey"
            columns: ["organization_a_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partnerships_organization_a_id_fkey"
            columns: ["organization_a_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnerships_organization_a_id_fkey"
            columns: ["organization_a_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnerships_organization_b_id_fkey"
            columns: ["organization_b_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnerships_organization_b_id_fkey"
            columns: ["organization_b_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "partnerships_organization_b_id_fkey"
            columns: ["organization_b_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partnerships_organization_b_id_fkey"
            columns: ["organization_b_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_feature_configs: {
        Row: {
          config_value: Json
          created_at: string | null
          feature_key: string
          id: string
          plan_type: string
          updated_at: string | null
        }
        Insert: {
          config_value?: Json
          created_at?: string | null
          feature_key: string
          id?: string
          plan_type: string
          updated_at?: string | null
        }
        Update: {
          config_value?: Json
          created_at?: string | null
          feature_key?: string
          id?: string
          plan_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "feature_registry"
            referencedColumns: ["feature_key"]
          },
        ]
      }
      post_translations: {
        Row: {
          content: string | null
          is_primary: boolean
          lang: string
          post_id: string
          summary: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          is_primary?: boolean
          lang: string
          post_id: string
          summary?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
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
            referencedRelation: "public_posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_translations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "public_posts_jsonld"
            referencedColumns: ["post_id"]
          },
        ]
      }
      posts: {
        Row: {
          base_path: string | null
          content: string | null
          created_at: string
          created_by: string
          id: string
          is_published: boolean
          locale: string | null
          organization_id: string | null
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
          created_at?: string
          created_by?: string
          id?: string
          is_published?: boolean
          locale?: string | null
          organization_id?: string | null
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
          created_at?: string
          created_by?: string
          id?: string
          is_published?: boolean
          locale?: string | null
          organization_id?: string | null
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
            foreignKeyName: "posts_organization_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_organization_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "posts_organization_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_organization_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_translations: {
        Row: {
          description: string | null
          is_primary: boolean
          lang: string
          name: string
          product_id: string
        }
        Insert: {
          description?: string | null
          is_primary?: boolean
          lang: string
          name: string
          product_id: string
        }
        Update: {
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
            referencedRelation: "public_products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      products: {
        Row: {
          base_path: string | null
          created_at: string
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
          created_at?: string
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
          created_at?: string
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
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: []
      }
      qa_categories: {
        Row: {
          created_at: string | null
          created_by: string | null
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
            foreignKeyName: "qa_content_logs_qa_entry_id_fkey"
            columns: ["qa_entry_id"]
            isOneToOne: false
            referencedRelation: "qa_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_entries: {
        Row: {
          answer: string
          category_id: string | null
          content_hash: string | null
          created_at: string | null
          created_by: string | null
          id: string
          jsonld_cache: Json | null
          last_edited_at: string | null
          last_edited_by: string
          organization_id: string
          published_at: string | null
          question: string
          refresh_suggested_at: string | null
          search_vector: unknown
          status: string | null
          tags: string[] | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          answer: string
          category_id?: string | null
          content_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jsonld_cache?: Json | null
          last_edited_at?: string | null
          last_edited_by: string
          organization_id: string
          published_at?: string | null
          question: string
          refresh_suggested_at?: string | null
          search_vector?: unknown
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          answer?: string
          category_id?: string | null
          content_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          jsonld_cache?: Json | null
          last_edited_at?: string | null
          last_edited_by?: string
          organization_id?: string
          published_at?: string | null
          question?: string
          refresh_suggested_at?: string | null
          search_vector?: unknown
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qa_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "qa_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_entries_last_edited_by_fkey"
            columns: ["last_edited_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "qa_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qa_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      qa_question_templates: {
        Row: {
          category_id: string | null
          created_at: string | null
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
        ]
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
        Relationships: []
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
      rate_limit_logs_202512: {
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
      rate_limit_requests_202512: {
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
        ]
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
        Relationships: []
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
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
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
        ]
      }
      sales_materials: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          file_path: string
          id: string
          is_public: boolean
          mime_type: string | null
          organization_id: string | null
          size_bytes: number | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path: string
          id?: string
          is_public?: boolean
          mime_type?: string | null
          organization_id?: string | null
          size_bytes?: number | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_path?: string
          id?: string
          is_public?: boolean
          mime_type?: string | null
          organization_id?: string | null
          size_bytes?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_materials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_materials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "sales_materials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_materials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_materials_stats: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
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
            foreignKeyName: "sales_materials_stats_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "sales_materials"
            referencedColumns: ["id"]
          },
        ]
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
      security_incidents_202512: {
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
        Relationships: []
      }
      service_role_audit: {
        Row: {
          additional_data: Json | null
          created_at: string | null
          execution_time_ms: number | null
          function_name: string | null
          id: string
          is_service_role: boolean | null
          operation_type: string
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
          additional_data?: Json | null
          created_at?: string | null
          execution_time_ms?: number | null
          function_name?: string | null
          id?: string
          is_service_role?: boolean | null
          operation_type: string
          query_text?: string | null
          request_ip?: unknown
          risk_level?: string | null
          row_count?: number | null
          session_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          additional_data?: Json | null
          created_at?: string | null
          execution_time_ms?: number | null
          function_name?: string | null
          id?: string
          is_service_role?: boolean | null
          operation_type?: string
          query_text?: string | null
          request_ip?: unknown
          risk_level?: string | null
          row_count?: number | null
          session_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_translations: {
        Row: {
          description: string | null
          is_primary: boolean
          lang: string
          name: string | null
          service_id: string
        }
        Insert: {
          description?: string | null
          is_primary?: boolean
          lang: string
          name?: string | null
          service_id: string
        }
        Update: {
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
            referencedRelation: "public_services"
            referencedColumns: ["service_id"]
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
          created_at: string | null
          created_by: string
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
          created_at?: string | null
          created_by: string
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
          created_at?: string | null
          created_by?: string
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
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
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
          created_at: string | null
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
          created_at?: string | null
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
          created_at?: string | null
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
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
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
        ]
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
        Relationships: []
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
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_user_overview"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
      public_case_studies: {
        Row: {
          availability_note: string | null
          availability_status: string | null
          case_study_id: string | null
          client_industry: string | null
          client_name: string | null
          client_size: string | null
          content: string | null
          created_at: string | null
          description: string | null
          inlanguage: string | null
          is_anonymous: boolean | null
          metrics: Json | null
          organization_id: string | null
          outcome: string | null
          problem: string | null
          published_date: string | null
          region_code: string | null
          result: string | null
          schema_type: string | null
          service_id: string | null
          solution: string | null
          source_urls: string[] | null
          summary: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          url: string | null
          verification_source: string | null
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          availability_note?: string | null
          availability_status?: string | null
          case_study_id?: string | null
          client_industry?: string | null
          client_name?: string | null
          client_size?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          inlanguage?: never
          is_anonymous?: boolean | null
          metrics?: Json | null
          organization_id?: string | null
          outcome?: string | null
          problem?: string | null
          published_date?: string | null
          region_code?: string | null
          result?: string | null
          schema_type?: never
          service_id?: string | null
          solution?: string | null
          source_urls?: string[] | null
          summary?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          availability_note?: string | null
          availability_status?: string | null
          case_study_id?: string | null
          client_industry?: string | null
          client_name?: string | null
          client_size?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          inlanguage?: never
          is_anonymous?: boolean | null
          metrics?: Json | null
          organization_id?: string | null
          outcome?: string | null
          problem?: string | null
          published_date?: string | null
          region_code?: string | null
          result?: string | null
          schema_type?: never
          service_id?: string | null
          solution?: string | null
          source_urls?: string[] | null
          summary?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_studies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "case_studies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["service_id"]
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
        ]
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
            foreignKeyName: "case_studies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "case_studies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_studies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["service_id"]
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
        ]
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
            foreignKeyName: "faqs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "faqs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["service_id"]
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
        ]
      }
      public_news: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          image_url: string | null
          inlanguage: string | null
          news_id: string | null
          organization_id: string | null
          published_date: string | null
          region_code: string | null
          schema_type: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          image_url?: string | null
          inlanguage?: never
          news_id?: string | null
          organization_id?: string | null
          published_date?: string | null
          region_code?: string | null
          schema_type?: never
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          image_url?: string | null
          inlanguage?: never
          news_id?: string | null
          organization_id?: string | null
          published_date?: string | null
          region_code?: string | null
          schema_type?: never
          summary?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "news_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "news_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "news_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
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
          content: string | null
          created_at: string | null
          inlanguage: string | null
          organization_id: string | null
          post_id: string | null
          published_at: string | null
          region_code: string | null
          schema_type: string | null
          slug: string | null
          summary: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          inlanguage?: never
          organization_id?: string | null
          post_id?: string | null
          published_at?: string | null
          region_code?: string | null
          schema_type?: never
          slug?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          inlanguage?: never
          organization_id?: string | null
          post_id?: string | null
          published_at?: string | null
          region_code?: string | null
          schema_type?: never
          slug?: string | null
          summary?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_organization_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_organization_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "posts_organization_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_organization_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "posts_organization_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_organization_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "posts_organization_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_organization_id_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
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
        Relationships: [
          {
            foreignKeyName: "product_translations_lang_fk"
            columns: ["inlanguage"]
            isOneToOne: false
            referencedRelation: "supported_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      public_services: {
        Row: {
          api_available: boolean | null
          availability_note: string | null
          availability_status: string | null
          categories: string[] | null
          category: string | null
          created_at: string | null
          description: string | null
          features: string[] | null
          free_trial: boolean | null
          image_url: string | null
          inlanguage: string | null
          logo_url: string | null
          name: string | null
          organization_id: string | null
          price: string | null
          price_range: string | null
          region_code: string | null
          schema_type: string | null
          screenshots: string[] | null
          service_id: string | null
          slug: string | null
          source_urls: string[] | null
          summary: string | null
          supported_platforms: string[] | null
          updated_at: string | null
          url: string | null
          verification_source: string | null
          verified: boolean | null
          verified_at: string | null
          video_url: string | null
        }
        Insert: {
          api_available?: boolean | null
          availability_note?: string | null
          availability_status?: string | null
          categories?: string[] | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          free_trial?: boolean | null
          image_url?: string | null
          inlanguage?: never
          logo_url?: string | null
          name?: string | null
          organization_id?: string | null
          price?: string | null
          price_range?: string | null
          region_code?: string | null
          schema_type?: never
          screenshots?: string[] | null
          service_id?: string | null
          slug?: string | null
          source_urls?: string[] | null
          summary?: string | null
          supported_platforms?: string[] | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          video_url?: string | null
        }
        Update: {
          api_available?: boolean | null
          availability_note?: string | null
          availability_status?: string | null
          categories?: string[] | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          free_trial?: boolean | null
          image_url?: string | null
          inlanguage?: never
          logo_url?: string | null
          name?: string | null
          organization_id?: string | null
          price?: string | null
          price_range?: string | null
          region_code?: string | null
          schema_type?: never
          screenshots?: string[] | null
          service_id?: string | null
          slug?: string | null
          source_urls?: string[] | null
          summary?: string | null
          supported_platforms?: string[] | null
          updated_at?: string | null
          url?: string | null
          verification_source?: string | null
          verified?: boolean | null
          verified_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
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
      user_organizations: {
        Row: {
          created_at: string | null
          id: string | null
          organization_id: string | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          organization_id?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          organization_id?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_overview_v2"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_members_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_with_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_org_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "public_organizations"
            referencedColumns: ["id"]
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
        Relationships: []
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
      view_security_incidents_daily_7d: {
        Row: {
          day: string | null
          incidents: number | null
        }
        Relationships: []
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
      org_monthly_question_usage: {
        Row: {
          organization_id: string | null
          month: string | null
          question_count: number | null
        }
        Insert: {
          organization_id?: string | null
          month?: string | null
          question_count?: number | null
        }
        Update: {
          organization_id?: string | null
          month?: string | null
          question_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "org_monthly_question_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      activities_daily_7d: {
        Args: never
        Returns: {
          day: string
          events: number
        }[]
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
      alert_count: {
        Args: {
          source_table: string
          where_key: string
          window_seconds: number
        }
        Returns: number
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
      current_user_id: { Args: never; Returns: string }
      current_user_role: { Args: never; Returns: string }
      current_yyyymm: { Args: never; Returns: string }
      detect_data_leakage: { Args: never; Returns: Json }
      detect_rate_limit_anomalies: { Args: never; Returns: Json }
      detect_service_role_anomalies: { Args: never; Returns: Json }
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
      generate_ai_manifest: { Args: { p_org_id: string }; Returns: Json }
      generate_openapi_for_org: { Args: { p_org_id: string }; Returns: Json }
      generate_qa_content_hash: {
        Args: { answer: string; question: string; tags: string[] }
        Returns: string
      }
      generate_sensitive_data_report: {
        Args: { end_date?: string; start_date?: string }
        Returns: Json
      }
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
      get_current_tenant_ids: { Args: never; Returns: string[] }
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
      get_partner_organizations: {
        Args: { user_id?: string }
        Returns: {
          access_level: string
          organization_id: string
          permissions: Json
        }[]
      }
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
      get_user_org_ids: { Args: never; Returns: string[] }
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
      has_organization_role: {
        Args: { org_id: string; required_role: string; user_id?: string }
        Returns: boolean
      }
      has_partner_permission: {
        Args: { org_id: string; permission: string; user_id?: string }
        Returns: boolean
      }
      is_admin: { Args: { user_id?: string }; Returns: boolean }
      is_editor_or_admin: { Args: never; Returns: boolean }
      is_ip_blocked: { Args: { check_ip: unknown }; Returns: boolean }
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
      is_user_admin_of_org: { Args: { p_org_id: string }; Returns: boolean }
      make_base_path: { Args: { _content_type: string }; Returns: string }
      make_canonical_url: {
        Args: { _base_path: string; _slug: string }
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
      ops_check_org_schema: { Args: never; Returns: Json }
      ops_fix_org_schema: { Args: never; Returns: Json }
      process_enforcement_deadlines: { Args: never; Returns: number }
      process_enforcement_deadlines_test: { Args: never; Returns: number }
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
      run_ensure_next_month_partitions: { Args: never; Returns: undefined }
      run_prune_old_partitions: {
        Args: { dry_run: boolean; retention_months: number }
        Returns: undefined
      }
      safe_partition: { Args: { rel_prefix: string }; Returns: unknown }
      scheduled_intrusion_detection: { Args: never; Returns: undefined }
      security_incidents_daily_7d: {
        Args: never
        Returns: {
          day: string
          incidents: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      soft_delete_comment: { Args: { p_id: string }; Returns: undefined }
      soft_delete_task: { Args: { p_id: string }; Returns: undefined }
      to_slug: { Args: { input: string }; Returns: string }
      unblock_ip: {
        Args: { target_ip: unknown; unblock_reason?: string }
        Returns: boolean
      }
      unpublish_org_public_content_for_user: {
        Args: { p_user_id: string }
        Returns: number
      }
      update_user_role: {
        Args: { new_role: string; target_user_id: string }
        Returns: boolean
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
    }
    Enums: {
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
      user_role: "admin" | "editor" | "viewer"
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
      user_role: ["admin", "editor", "viewer"],
    },
  },
} as const
