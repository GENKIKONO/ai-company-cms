'use client';

import { supabaseBrowser } from '@/lib/supabase/client';

interface AdminApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

interface AdminApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Admin API Client
 * 
 * Supabase Edge Function (admin-api) との統合クライアント
 * 認証とエラーハンドリングを統合
 */
export class AdminApiClient {
  private baseUrl: string;
  private defaultTimeout: number = 30000; // 30秒

  constructor() {
    // Supabase Edge Function URL
    this.baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-api`;
  }

  /**
   * 認証トークン取得
   */
  private async getAuthToken(): Promise<string | null> {
    const supabase = supabaseBrowser;
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      // [AdminApi] 認証トークンの取得に失敗: error?.message
      return null;
    }
    
    return session.access_token;
  }

  /**
   * APIリクエスト実行
   */
  private async request<T = any>(
    endpoint: string, 
    options: AdminApiRequestOptions = {}
  ): Promise<AdminApiResponse<T>> {
    const { method = 'GET', body, headers = {}, timeout = this.defaultTimeout } = options;

    try {
      // 認証トークン取得
      const authToken = await this.getAuthToken();
      if (!authToken) {
        return {
          success: false,
          error: '認証が必要です。ログインしてください。',
          statusCode: 401
        };
      }

      // リクエスト設定
      const requestConfig: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          ...headers
        },
        signal: AbortSignal.timeout(timeout)
      };

      if (body && method !== 'GET') {
        requestConfig.body = JSON.stringify(body);
      }

      // API呼び出し
      const response = await fetch(`${this.baseUrl}${endpoint}`, requestConfig);
      
      // レスポンス処理
      let responseData: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = { message: await response.text() };
      }

      if (!response.ok) {
        return {
          success: false,
          error: responseData?.error || responseData?.message || `HTTP ${response.status}`,
          statusCode: response.status,
          data: responseData
        };
      }

      return {
        success: true,
        data: responseData,
        statusCode: response.status
      };

    } catch (error) {
      // [AdminApi] リクエストエラー: error
      
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          return {
            success: false,
            error: 'リクエストがタイムアウトしました',
            statusCode: 408
          };
        }
        
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'リクエストが中断されました',
            statusCode: 499
          };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'ネットワークエラーが発生しました',
        statusCode: 500
      };
    }
  }

  // CMS操作メソッド
  
  /**
   * サイト設定を取得
   */
  async getSiteSettings(organizationId: string): Promise<AdminApiResponse<any[]>> {
    return this.request(`/site-settings?organization_id=${organizationId}`);
  }

  /**
   * サイト設定を更新/作成
   */
  async upsertSiteSetting(organizationId: string, setting: {
    key: string;
    value: string;
    data_type: string;
    description?: string;
    is_public: boolean;
  }): Promise<AdminApiResponse<any>> {
    return this.request('/site-settings', {
      method: 'POST',
      body: { organization_id: organizationId, ...setting }
    });
  }

  /**
   * サイト設定を削除
   */
  async deleteSiteSetting(organizationId: string, key: string): Promise<AdminApiResponse<any>> {
    return this.request('/site-settings', {
      method: 'DELETE',
      body: { organization_id: organizationId, key }
    });
  }

  /**
   * CMSセクションを取得
   */
  async getCmsSections(organizationId: string): Promise<AdminApiResponse<any[]>> {
    return this.request(`/cms-sections?organization_id=${organizationId}`);
  }

  /**
   * CMSセクションを更新/作成
   */
  async upsertCmsSection(organizationId: string, section: {
    page_key: string;
    section_key: string;
    section_type: string;
    title?: string;
    content: Record<string, any>;
    display_order: number;
    is_active: boolean;
  }): Promise<AdminApiResponse<any>> {
    return this.request('/cms-sections', {
      method: 'POST',
      body: { organization_id: organizationId, ...section }
    });
  }

  /**
   * CMSセクションを削除
   */
  async deleteCmsSection(organizationId: string, pageKey: string, sectionKey: string): Promise<AdminApiResponse<any>> {
    return this.request('/cms-sections', {
      method: 'DELETE',
      body: { organization_id: organizationId, page_key: pageKey, section_key: sectionKey }
    });
  }

  /**
   * CMSアセットを取得
   */
  async getCmsAssets(organizationId: string): Promise<AdminApiResponse<any[]>> {
    return this.request(`/cms-assets?organization_id=${organizationId}`);
  }

  /**
   * CMSアセットを更新/作成
   */
  async upsertCmsAsset(organizationId: string, asset: {
    filename: string;
    original_name: string;
    file_path: string;
    file_size?: number;
    mime_type?: string;
    alt_text?: string;
    description?: string;
    tags: string[];
    is_active: boolean;
  }): Promise<AdminApiResponse<any>> {
    return this.request('/cms-assets', {
      method: 'POST',
      body: { organization_id: organizationId, ...asset }
    });
  }

  /**
   * CMSアセットを削除
   */
  async deleteCmsAsset(organizationId: string, assetId: string): Promise<AdminApiResponse<any>> {
    return this.request('/cms-assets', {
      method: 'DELETE',
      body: { organization_id: organizationId, asset_id: assetId }
    });
  }

  /**
   * バルク操作: 複数のCMSセクションを一括更新
   */
  async bulkUpdateSections(organizationId: string, sections: any[]): Promise<AdminApiResponse<any>> {
    return this.request('/cms-sections/bulk', {
      method: 'POST',
      body: { organization_id: organizationId, sections },
      timeout: 60000 // 1分
    });
  }

  /**
   * ヘルスチェック: Edge Function の動作確認
   */
  async healthCheck(): Promise<AdminApiResponse<any>> {
    return this.request('/health');
  }

  /**
   * CMS概要情報を取得
   */
  async getCmsOverview(organizationId: string): Promise<AdminApiResponse<any>> {
    return this.request(`/cms_overview?organization_id=${organizationId}`);
  }

  /**
   * 組織の権限チェック
   */
  async checkOrganizationPermission(organizationId: string): Promise<AdminApiResponse<any>> {
    return this.request(`/check-permission?organization_id=${organizationId}`);
  }
}

// シングルトンインスタンス
export const adminApiClient = new AdminApiClient();

/**
 * React Hook版 Admin API Client
 */
export function useAdminApiClient() {
  return adminApiClient;
}

// TypeScript型定義
export type {
  AdminApiResponse,
  AdminApiRequestOptions
};