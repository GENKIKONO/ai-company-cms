/**
 * Complete Supabase Database Type Definitions
 * Phase 4: Type Safety - Comprehensive Database Schema Types
 */

// Re-export base types from database.ts for compatibility
export * from '@/types/database'

// =====================================================
// SUPABASE DATABASE SCHEMA TYPE DEFINITIONS
// =====================================================

/**
 * Complete Supabase Database Schema
 * Generated from actual database schema with full type safety
 */
export interface SupabaseDatabase {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          legal_form: string | null
          representative_name: string | null
          corporate_number: string | null
          verified: boolean | null
          established_at: string | null
          capital: number | null
          employees: number | null
          address_country: string
          address_region: string | null
          address_locality: string | null
          address_postal_code: string | null
          address_street: string | null
          lat: number | null
          lng: number | null
          telephone: string | null
          email: string | null
          email_public: boolean
          url: string | null
          logo_url: string | null
          same_as: string[] | null
          industries: string[] | null
          status: 'draft' | 'waiting_approval' | 'public_unverified' | 'published' | 'paused' | 'archived'
          is_published: boolean
          partner_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          meta_title: string | null
          meta_description: string | null
          meta_keywords: string[] | null
          keywords: string[] | null
          website: string | null
          website_url: string | null
          size: number | null
          favicon_url: string | null
          brand_color_primary: string | null
          brand_color_secondary: string | null
          social_media: Record<string, unknown> | null
          business_hours: Record<string, unknown>[] | null
          timezone: string | null
          languages_supported: string[] | null
          certifications: string[] | null
          awards: string[] | null
          company_culture: string | null
          mission_statement: string | null
          vision_statement: string | null
          values: string[] | null
          feature_flags: Record<string, unknown> | null
          entitlements: Record<string, unknown> | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan: 'starter' | 'pro' | 'business' | null
          subscription_status: 'active' | 'inactive' | 'canceled' | 'past_due' | null
          current_period_end: string | null
          trial_end_date: string | null
          show_services: boolean | null
          show_posts: boolean | null
          show_case_studies: boolean | null
          show_faqs: boolean | null
          show_qa: boolean | null
          show_news: boolean | null
          show_partnership: boolean | null
          show_contact: boolean | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          legal_form?: string | null
          representative_name?: string | null
          corporate_number?: string | null
          verified?: boolean | null
          established_at?: string | null
          capital?: number | null
          employees?: number | null
          address_country: string
          address_region?: string | null
          address_locality?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          lat?: number | null
          lng?: number | null
          telephone?: string | null
          email?: string | null
          email_public?: boolean
          url?: string | null
          logo_url?: string | null
          same_as?: string[] | null
          industries?: string[] | null
          status?: 'draft' | 'waiting_approval' | 'public_unverified' | 'published' | 'paused' | 'archived'
          is_published?: boolean
          partner_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          keywords?: string[] | null
          website?: string | null
          website_url?: string | null
          size?: number | null
          favicon_url?: string | null
          brand_color_primary?: string | null
          brand_color_secondary?: string | null
          social_media?: Record<string, unknown> | null
          business_hours?: Record<string, unknown>[] | null
          timezone?: string | null
          languages_supported?: string[] | null
          certifications?: string[] | null
          awards?: string[] | null
          company_culture?: string | null
          mission_statement?: string | null
          vision_statement?: string | null
          values?: string[] | null
          feature_flags?: Record<string, unknown> | null
          entitlements?: Record<string, unknown> | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: 'starter' | 'pro' | 'business' | null
          subscription_status?: 'active' | 'inactive' | 'canceled' | 'past_due' | null
          current_period_end?: string | null
          trial_end_date?: string | null
          show_services?: boolean | null
          show_posts?: boolean | null
          show_case_studies?: boolean | null
          show_faqs?: boolean | null
          show_qa?: boolean | null
          show_news?: boolean | null
          show_partnership?: boolean | null
          show_contact?: boolean | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          legal_form?: string | null
          representative_name?: string | null
          corporate_number?: string | null
          verified?: boolean | null
          established_at?: string | null
          capital?: number | null
          employees?: number | null
          address_country?: string
          address_region?: string | null
          address_locality?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          lat?: number | null
          lng?: number | null
          telephone?: string | null
          email?: string | null
          email_public?: boolean
          url?: string | null
          logo_url?: string | null
          same_as?: string[] | null
          industries?: string[] | null
          status?: 'draft' | 'waiting_approval' | 'public_unverified' | 'published' | 'paused' | 'archived'
          is_published?: boolean
          partner_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          keywords?: string[] | null
          website?: string | null
          website_url?: string | null
          size?: number | null
          favicon_url?: string | null
          brand_color_primary?: string | null
          brand_color_secondary?: string | null
          social_media?: Record<string, unknown> | null
          business_hours?: Record<string, unknown>[] | null
          timezone?: string | null
          languages_supported?: string[] | null
          certifications?: string[] | null
          awards?: string[] | null
          company_culture?: string | null
          mission_statement?: string | null
          vision_statement?: string | null
          values?: string[] | null
          feature_flags?: Record<string, unknown> | null
          entitlements?: Record<string, unknown> | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: 'starter' | 'pro' | 'business' | null
          subscription_status?: 'active' | 'inactive' | 'canceled' | 'past_due' | null
          current_period_end?: string | null
          trial_end_date?: string | null
          show_services?: boolean | null
          show_posts?: boolean | null
          show_case_studies?: boolean | null
          show_faqs?: boolean | null
          show_qa?: boolean | null
          show_news?: boolean | null
          show_partnership?: boolean | null
          show_contact?: boolean | null
        }
      }
      services: {
        Row: {
          id: string
          organization_id: string
          name: string
          price: number | null
          duration_months: number | null
          category: string | null
          description: string | null
          features: string[] | null
          image_url: string | null
          video_url: string | null
          cta_text: string | null
          cta_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          price?: number | null
          duration_months?: number | null
          category?: string | null
          description?: string | null
          features?: string[] | null
          image_url?: string | null
          video_url?: string | null
          cta_text?: string | null
          cta_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          price?: number | null
          duration_months?: number | null
          category?: string | null
          description?: string | null
          features?: string[] | null
          image_url?: string | null
          video_url?: string | null
          cta_text?: string | null
          cta_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          organization_id: string
          title: string
          slug: string
          content_markdown: string | null
          content_html: string | null
          status: 'draft' | 'published' | 'archived'
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          slug: string
          content_markdown?: string | null
          content_html?: string | null
          status?: 'draft' | 'published' | 'archived'
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          slug?: string
          content_markdown?: string | null
          content_html?: string | null
          status?: 'draft' | 'published' | 'archived'
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      case_studies: {
        Row: {
          id: string
          organization_id: string
          title: string
          problem: string | null
          solution: string | null
          result: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          problem?: string | null
          solution?: string | null
          result?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          problem?: string | null
          solution?: string | null
          result?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      faqs: {
        Row: {
          id: string
          organization_id: string
          question: string
          answer: string
          category: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          question: string
          answer: string
          category?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          question?: string
          answer?: string
          category?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      qa_categories: {
        Row: {
          id: string
          organization_id: string | null
          name: string
          slug: string
          description: string | null
          visibility: 'public' | 'private' | 'organization'
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          organization_id?: string | null
          name: string
          slug: string
          description?: string | null
          visibility?: 'public' | 'private' | 'organization'
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          visibility?: 'public' | 'private' | 'organization'
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
      qa_entries: {
        Row: {
          id: string
          organization_id: string
          category_id: string | null
          question: string
          answer: string
          tags: string[]
          visibility: 'public' | 'private' | 'organization'
          status: 'active' | 'inactive' | 'archived'
          published_at: string | null
          last_edited_by: string
          last_edited_at: string
          created_at: string
          updated_at: string
          content_hash: string | null
          refresh_suggested_at: string | null
          jsonld_cache: Record<string, unknown> | null
          search_vector: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          category_id?: string | null
          question: string
          answer: string
          tags?: string[]
          visibility?: 'public' | 'private' | 'organization'
          status?: 'active' | 'inactive' | 'archived'
          published_at?: string | null
          last_edited_by: string
          last_edited_at?: string
          created_at?: string
          updated_at?: string
          content_hash?: string | null
          refresh_suggested_at?: string | null
          jsonld_cache?: Record<string, unknown> | null
          search_vector?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          category_id?: string | null
          question?: string
          answer?: string
          tags?: string[]
          visibility?: 'public' | 'private' | 'organization'
          status?: 'active' | 'inactive' | 'archived'
          published_at?: string | null
          last_edited_by?: string
          last_edited_at?: string
          created_at?: string
          updated_at?: string
          content_hash?: string | null
          refresh_suggested_at?: string | null
          jsonld_cache?: Record<string, unknown> | null
          search_vector?: string | null
        }
      }
      user_favorites: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          created_at?: string
        }
      }
      user_saved_searches: {
        Row: {
          id: string
          user_id: string
          name: string
          search_params: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          search_params: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          search_params?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferences: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferences: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferences?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      partners: {
        Row: {
          id: string
          name: string
          description: string | null
          website_url: string | null
          logo_url: string | null
          brand_logo_url: string | null
          contact_email: string | null
          partnership_type: 'strategic' | 'technology' | 'distribution' | 'investment' | null
          contract_start_date: string | null
          contract_end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          website_url?: string | null
          logo_url?: string | null
          brand_logo_url?: string | null
          contact_email?: string | null
          partnership_type?: 'strategic' | 'technology' | 'distribution' | 'investment' | null
          contract_start_date?: string | null
          contract_end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          website_url?: string | null
          logo_url?: string | null
          brand_logo_url?: string | null
          contact_email?: string | null
          partnership_type?: 'strategic' | 'technology' | 'distribution' | 'investment' | null
          contract_start_date?: string | null
          contract_end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          event_name: string
          event_properties: Record<string, unknown> | null
          page_url: string | null
          user_agent: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          event_name: string
          event_properties?: Record<string, unknown> | null
          page_url?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          event_name?: string
          event_properties?: Record<string, unknown> | null
          page_url?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
      }
      monthly_reports: {
        Row: {
          id: string
          organization_id: string
          year: number
          month: number
          status: 'pending' | 'completed' | 'failed'
          format: 'pdf' | 'csv' | 'json'
          file_url: string | null
          file_size: number | null
          data_summary: Record<string, unknown>
          generated_at: string | null
          sent_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          year: number
          month: number
          status?: 'pending' | 'completed' | 'failed'
          format?: 'pdf' | 'csv' | 'json'
          file_url?: string | null
          file_size?: number | null
          data_summary: Record<string, unknown>
          generated_at?: string | null
          sent_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          year?: number
          month?: number
          status?: 'pending' | 'completed' | 'failed'
          format?: 'pdf' | 'csv' | 'json'
          file_url?: string | null
          file_size?: number | null
          data_summary?: Record<string, unknown>
          generated_at?: string | null
          sent_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sales_materials: {
        Row: {
          id: string
          organization_id: string
          title: string
          file_path: string
          file_type: string | null
          file_size: number | null
          uploaded_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          file_path: string
          file_type?: string | null
          file_size?: number | null
          uploaded_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          file_path?: string
          file_type?: string | null
          file_size?: number | null
          uploaded_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      sales_material_stats: {
        Row: {
          id: string
          material_id: string
          user_id: string | null
          company_id: string | null
          action: 'create' | 'update' | 'delete'
          user_agent: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          material_id: string
          user_id?: string | null
          company_id?: string | null
          action: 'create' | 'update' | 'delete'
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          material_id?: string
          user_id?: string | null
          company_id?: string | null
          action?: 'create' | 'update' | 'delete'
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
      }
      qa_view_stats: {
        Row: {
          id: string
          qna_id: string
          user_id: string | null
          company_id: string | null
          action: 'create' | 'update' | 'delete'
          user_agent: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          qna_id: string
          user_id?: string | null
          company_id?: string | null
          action?: 'create' | 'update' | 'delete'
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          qna_id?: string
          user_id?: string | null
          company_id?: string | null
          action?: 'create' | 'update' | 'delete'
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          company_id: string
          user_id: string
          question_text: string
          status: 'active' | 'inactive' | 'archived'
          answer_text: string | null
          created_at: string
          answered_at: string | null
          answered_by: string | null
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          question_text: string
          status?: 'active' | 'inactive' | 'archived'
          answer_text?: string | null
          created_at?: string
          answered_at?: string | null
          answered_by?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          question_text?: string
          status?: 'active' | 'inactive' | 'archived'
          answer_text?: string | null
          created_at?: string
          answered_at?: string | null
          answered_by?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          org_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          status: 'active' | 'inactive' | 'canceled' | 'past_due'
          plan_id: string
          current_period_start: string
          current_period_end: string
          cancelled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          status?: 'active' | 'inactive' | 'canceled' | 'past_due'
          plan_id: string
          current_period_start: string
          current_period_end: string
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          stripe_subscription_id?: string
          stripe_customer_id?: string
          status?: 'active' | 'inactive' | 'canceled' | 'past_due'
          plan_id?: string
          current_period_start?: string
          current_period_end?: string
          cancelled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stripe_customers: {
        Row: {
          id: string
          organization_id: string
          stripe_customer_id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          stripe_customer_id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          stripe_customer_id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      organizations_with_owner: {
        Row: {
          id: string
          name: string
          slug: string
          status: 'draft' | 'waiting_approval' | 'public_unverified' | 'published' | 'paused' | 'archived'
          is_published: boolean
          created_at: string
          updated_at: string
          owner_email: string | null
          owner_full_name: string | null
          owner_avatar_url: string | null
          owner_role: 'admin' | 'editor' | 'viewer' | null
        }
        Insert: never
        Update: never
      }
      sales_material_stats_summary: {
        Row: {
          material_id: string
          material_title: string
          organization_name: string
          total_views: number
          total_downloads: number
          unique_viewers: number
          unique_downloaders: number
          last_viewed_at: string | null
          last_downloaded_at: string | null
        }
        Insert: never
        Update: never
      }
      qa_stats_summary: {
        Row: {
          qna_id: string
          question: string
          organization_name: string
          category_name: string | null
          total_views: number
          unique_viewers: number
          last_viewed_at: string | null
        }
        Insert: never
        Update: never
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'editor' | 'viewer'
      organization_status: 'draft' | 'waiting_approval' | 'public_unverified' | 'published' | 'paused' | 'archived'
      partnership_type: 'strategic' | 'technology' | 'distribution' | 'investment'
      post_status: 'draft' | 'published'
      qa_visibility: 'global' | 'org'
      qa_entry_visibility: 'public' | 'private'
      qa_entry_status: 'draft' | 'published' | 'archived'
      report_status: 'generating' | 'completed' | 'failed'
      report_format: 'html' | 'pdf'
      sales_action: 'view' | 'download'
      qa_stats_action: 'view'
      question_status: 'open' | 'answered' | 'closed'
      subscription_status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | 'paused'
      subscription_plan: 'trial' | 'starter' | 'pro' | 'business' | 'enterprise'
      qa_log_action: 'create' | 'update' | 'publish' | 'unpublish' | 'archive' | 'delete' | 'category_create' | 'category_update' | 'category_delete'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// =====================================================
// TYPE-SAFE SUPABASE CLIENT WRAPPER
// =====================================================

/**
 * Type-safe Supabase client interface
 * Ensures all database operations are properly typed
 */
export type TypedSupabaseClient = {
  from<T extends keyof SupabaseDatabase['public']['Tables']>(
    table: T
  ): {
    select: <K extends keyof SupabaseDatabase['public']['Tables'][T]['Row'] | '*'>(
      columns?: K | string
    ) => Promise<{
      data: K extends '*' 
        ? SupabaseDatabase['public']['Tables'][T]['Row'][] | null
        : Pick<SupabaseDatabase['public']['Tables'][T]['Row'], K extends keyof SupabaseDatabase['public']['Tables'][T]['Row'] ? K : never>[] | null
      error: Error | null
    }>
    
    insert: (
      values: SupabaseDatabase['public']['Tables'][T]['Insert'] | SupabaseDatabase['public']['Tables'][T]['Insert'][]
    ) => Promise<{
      data: SupabaseDatabase['public']['Tables'][T]['Row'][] | null
      error: Error | null
    }>
    
    update: (
      values: SupabaseDatabase['public']['Tables'][T]['Update']
    ) => Promise<{
      data: SupabaseDatabase['public']['Tables'][T]['Row'][] | null
      error: Error | null
    }>
    
    delete: () => Promise<{
      data: null
      error: Error | null
    }>
    
    upsert: (
      values: SupabaseDatabase['public']['Tables'][T]['Insert'] | SupabaseDatabase['public']['Tables'][T]['Insert'][]
    ) => Promise<{
      data: SupabaseDatabase['public']['Tables'][T]['Row'][] | null
      error: Error | null
    }>
  }
}

// =====================================================
// QUERY BUILDER TYPES
// =====================================================

/**
 * Type-safe query builder for complex database operations
 */
export interface TypedQueryBuilder<T> {
  eq<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  neq<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  gt<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  gte<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  lt<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  lte<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  like<K extends keyof T>(column: K, pattern: string): TypedQueryBuilder<T>
  ilike<K extends keyof T>(column: K, pattern: string): TypedQueryBuilder<T>
  is<K extends keyof T>(column: K, value: null): TypedQueryBuilder<T>
  in<K extends keyof T>(column: K, values: T[K][]): TypedQueryBuilder<T>
  contains<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  containedBy<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  rangeGt<K extends keyof T>(column: K, range: string): TypedQueryBuilder<T>
  rangeGte<K extends keyof T>(column: K, range: string): TypedQueryBuilder<T>
  rangeLt<K extends keyof T>(column: K, range: string): TypedQueryBuilder<T>
  rangeLte<K extends keyof T>(column: K, range: string): TypedQueryBuilder<T>
  rangeAdjacent<K extends keyof T>(column: K, range: string): TypedQueryBuilder<T>
  overlaps<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  textSearch<K extends keyof T>(column: K, query: string, config?: string): TypedQueryBuilder<T>
  match<K extends keyof T>(query: { [P in K]?: T[P] }): TypedQueryBuilder<T>
  not<K extends keyof T>(column: K, operator: string, value: T[K]): TypedQueryBuilder<T>
  or(filters: string): TypedQueryBuilder<T>
  filter<K extends keyof T>(column: K, operator: string, value: T[K]): TypedQueryBuilder<T>
  single(): Promise<{ data: T | null; error: Error | null }>
  maybeSingle(): Promise<{ data: T | null; error: Error | null }>
  limit(count: number): TypedQueryBuilder<T>
  order<K extends keyof T>(
    column: K, 
    options?: { ascending?: boolean; nullsFirst?: boolean; foreignTable?: string }
  ): TypedQueryBuilder<T>
  range(from: number, to: number): TypedQueryBuilder<T>
  abortSignal(signal: AbortSignal): TypedQueryBuilder<T>
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Extract table row type
 */
export type TableRow<T extends keyof SupabaseDatabase['public']['Tables']> = 
  SupabaseDatabase['public']['Tables'][T]['Row']

/**
 * Extract table insert type
 */
export type TableInsert<T extends keyof SupabaseDatabase['public']['Tables']> = 
  SupabaseDatabase['public']['Tables'][T]['Insert']

/**
 * Extract table update type
 */
export type TableUpdate<T extends keyof SupabaseDatabase['public']['Tables']> = 
  SupabaseDatabase['public']['Tables'][T]['Update']

/**
 * Extract enum values
 */
export type EnumValues<T extends keyof SupabaseDatabase['public']['Enums']> = 
  SupabaseDatabase['public']['Enums'][T]

/**
 * Database error type
 */
export interface DatabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}

/**
 * Type guard for database errors
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as DatabaseError).message === 'string'
  )
}

/**
 * Type-safe database operation result
 */
export interface DatabaseResult<T> {
  data: T | null
  error: DatabaseError | null
  count?: number | null
}

/**
 * Generic database operation function type
 */
export type DatabaseOperation<TInput, TOutput> = (
  input: TInput
) => Promise<DatabaseResult<TOutput>>

// =====================================================
// RELATION TYPES
// =====================================================

/**
 * Organization with related data
 */
export type OrganizationWithRelations = TableRow<'organizations'> & {
  services?: TableRow<'services'>[]
  posts?: TableRow<'posts'>[]
  case_studies?: TableRow<'case_studies'>[]
  faqs?: TableRow<'faqs'>[]
  qa_entries?: TableRow<'qa_entries'>[]
  partner?: TableRow<'partners'>
  creator?: TableRow<'profiles'>
}

/**
 * QA Entry with category
 */
export type QAEntryWithCategory = TableRow<'qa_entries'> & {
  qa_categories?: Pick<TableRow<'qa_categories'>, 'id' | 'name' | 'slug'> | null
}

/**
 * User with profile
 */
export type UserWithProfile = {
  id: string
  email: string | null
  profile: TableRow<'profiles'> | null
}

/**
 * Question with details
 */
export type QuestionWithDetails = TableRow<'questions'> & {
  user_email?: string
  user_full_name?: string
  company_name?: string
  answerer_name?: string
}

// =====================================================
// ADVANCED TYPE UTILITIES
// =====================================================

/**
 * Make all properties except specified ones optional
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Exclude null and undefined
 */
export type NonNullable<T> = T extends null | undefined ? never : T

/**
 * Extract non-nullable properties
 */
export type NonNullableKeys<T> = {
  [K in keyof T]: T[K] extends null | undefined ? never : K
}[keyof T]

/**
 * Make specified properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * JSON value type for database storage
 */
export type Json = 
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Type-safe JSON object
 */
export interface JsonObject {
  [key: string]: Json | undefined
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number
  limit: number
  offset?: number
}

/**
 * Sort parameters
 */
export interface SortParams<T = Record<string, unknown>> {
  column: keyof T
  ascending?: boolean
  nullsFirst?: boolean
}

/**
 * Filter parameters
 */
export interface FilterParams<T = Record<string, unknown>> {
  [key: string]: {
    column: keyof T
    operator: string
    value: unknown
  }
}

/**
 * Complete query parameters
 */
export interface QueryParams<T = Record<string, unknown>> {
  pagination?: PaginationParams
  sort?: SortParams<T>[]
  filters?: FilterParams<T>
  search?: {
    query: string
    columns?: (keyof T)[]
  }
}