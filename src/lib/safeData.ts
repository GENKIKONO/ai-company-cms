/**
 * 安全なデータ取得関数 - SSRでthrowしない実装
 */

import { unstable_cache } from 'next/cache';
import { serverFetch } from './serverFetch';

interface SafeOrganizationData {
  id: string;
  name: string;
  is_published: boolean;
  slug?: string;
  updated_at: string;
  created_at: string;
  logo_url?: string;
}

interface SafeStatsData {
  total: number;
  draft: number;
  published: number;
  archived: number;
}

interface SafeCaseStudiesStats {
  total: number;
  published: number;
}

interface SafeDataResult<T> {
  data: T | null;
  error?: string;
  errorId?: string;
}

/**
 * 診断ログを /api/diag/ui に送信（失敗しても無視）
 */
async function logToDiag(errorInfo: { errorId: string; at: string; note: string }) {
  try {
    await serverFetch('/api/diag/ui', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'error',
        timestamp: new Date().toISOString(),
        ...errorInfo
      })
    });
  } catch {
    // 診断ログ送信失敗は無視
  }
}

/**
 * ✅ FIXED: This function is now deprecated - use getCurrentUserOrganization() from organizations-server.ts instead
 * This wrapper is kept for backward compatibility during transition
 */
export async function getMyOrganizationSafe(userId?: string): Promise<SafeDataResult<SafeOrganizationData>> {
  try {
    if (!userId) {
      return { 
        data: null, 
        error: '401 Unauthorized - userId required' 
      };
    }

    // Use new server-side function that properly handles caching
    const { getOrganizationSafe } = await import('./organizations-server');
    const result = await getOrganizationSafe(userId, true);
    
    if (result.error) {
      return { 
        data: null, 
        error: result.error 
      };
    }

    // Transform to match expected interface
    const organization = result.data;
    if (!organization) {
      return { data: null };
    }

    const safeData: SafeOrganizationData = {
      id: organization.id,
      name: organization.name,
      is_published: organization.is_published,
      slug: organization.slug,
      updated_at: organization.updated_at,
      created_at: organization.created_at,
      logo_url: organization.logo_url
    };

    console.log('[getMyOrganizationSafe] Data loaded:', { 
      hasOrg: !!organization, 
      hasApiKey: !!organization.api_key 
    });

    return { data: safeData };

  } catch (error) {
    const errorId = `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const errorNote = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('[getMyOrganizationSafe] Error:', error);
    
    // 診断ログ送信
    await logToDiag({
      errorId,
      at: 'getMyOrganizationSafe',
      note: errorNote
    });

    return { 
      data: null, 
      error: errorNote,
      errorId 
    };
  }
}

/**
 * 安全な統計データ取得（フォールバック値付き）
 */
export async function getOrganizationStatsSafe(): Promise<SafeDataResult<SafeStatsData>> {
  try {
    // Single-Org モードでは統計は単純化
    const defaultStats: SafeStatsData = {
      total: 0,
      draft: 0,
      published: 0,
      archived: 0
    };

    return { data: defaultStats };

  } catch (error) {
    const errorId = `stats-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const errorNote = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('[getOrganizationStatsSafe] Error:', error);
    
    await logToDiag({
      errorId,
      at: 'getOrganizationStatsSafe', 
      note: errorNote
    });

    // エラー時もデフォルト値を返す
    return { 
      data: { total: 0, draft: 0, published: 0, archived: 0 },
      error: errorNote,
      errorId
    };
  }
}

/**
 * 安全な導入事例統計取得
 */
export async function getCaseStudiesStatsSafe(orgId?: string): Promise<SafeDataResult<SafeCaseStudiesStats>> {
  try {
    if (!orgId) {
      return { data: { total: 0, published: 0 } };
    }

    const result = await serverFetch(`/api/dashboard/case-studies-stats?orgId=${orgId}`);
    
    if (!result.ok) {
      console.warn('[getCaseStudiesStatsSafe] API returned non-ok status:', result.status);
      return { data: { total: 0, published: 0 } };
    }

    const stats = await result.json();
    return { data: stats };

  } catch (error) {
    const errorId = `case-studies-stats-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const errorNote = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('[getCaseStudiesStatsSafe] Error:', error);
    
    await logToDiag({
      errorId,
      at: 'getCaseStudiesStatsSafe', 
      note: errorNote
    });

    // エラー時もデフォルト値を返す
    return { 
      data: { total: 0, published: 0 },
      error: errorNote,
      errorId
    };
  }
}

/**
 * 安全な文字列マッチング - undefined.match() エラーを防ぐ
 */
export function safeMatch(str: unknown, regex: RegExp): RegExpMatchArray | null {
  if (typeof str !== 'string') {
    return null;
  }
  return str.match(regex);
}

/**
 * 安全なテスト関数 - undefined.test() エラーを防ぐ  
 */
export function safeTest(regex: RegExp, str: unknown): boolean {
  if (typeof str !== 'string') {
    return false;
  }
  return regex.test(str);
}