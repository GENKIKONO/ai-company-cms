/**
 * Organization Summary Types
 * get_my_organizations_slim RPC レスポンス型定義
 * 
 * Note: Supabase の get_my_organizations_slim() RPC の戻り値に準拠
 * フィールド追加・変更時は Supabase 側と整合性を保つこと
 */

// Supabase RPC の生戻り値型（organizations テーブルベース）
export interface GetMyOrganizationsSlimRow {
  id: string; // organizations.id
  name: string;
  slug: string;
  plan: string;
  show_services: boolean;
  show_posts: boolean;
  show_case_studies: boolean;
  show_faqs: boolean;
  show_qa: boolean;
  show_news: boolean;
  show_partnership: boolean;
  show_contact: boolean;
  is_demo_guess: boolean;
}

// フロントエンド用の正規化型（camelCase + 追加フィールド）
export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'pro' | 'business' | 'enterprise';
  
  // 表示設定（UIで使用）
  showServices: boolean;
  showPosts: boolean;
  showCaseStudies: boolean;
  showFaqs: boolean;
  showQa: boolean;
  showNews: boolean;
  showPartnership: boolean;
  showContact: boolean;
  
  // フラグ
  isDemoGuess: boolean;
  
  // 後方互換（既存の organization インターフェースとの互換性）
  feature_flags?: Record<string, boolean>;
}

// /api/me レスポンス型（拡張版）
export interface MeApiResponse {
  user: {
    id: string;
    email: string | null;
    full_name: string | null;
  } | null;
  
  // 新形式
  organizations: OrganizationSummary[];
  selectedOrganization: OrganizationSummary | null;
  
  // 後方互換
  organization: OrganizationSummary | null;
  
  // エラー情報（正常時は undefined）
  error?: string;
}

// ヘルパー関数：RPC結果を正規化
export function normalizeOrganizationSummary(row: GetMyOrganizationsSlimRow): OrganizationSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    plan: (row.plan as OrganizationSummary['plan']) || 'free',
    
    showServices: row.show_services,
    showPosts: row.show_posts,
    showCaseStudies: row.show_case_studies,
    showFaqs: row.show_faqs,
    showQa: row.show_qa,
    showNews: row.show_news,
    showPartnership: row.show_partnership,
    showContact: row.show_contact,
    
    isDemoGuess: row.is_demo_guess,
    
    // 後方互換用の空オブジェクト（必要に応じて別途取得）
    feature_flags: {}
  };
}