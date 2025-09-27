/**
 * 安全なデータ取得関数 - SSRでthrowしない実装
 */

interface SafeOrganizationData {
  id: string;
  name: string;
  status: string;
  slug?: string;
  updated_at: string;
  logo_url?: string;
}

interface SafeStatsData {
  total: number;
  draft: number;
  published: number;
  archived: number;
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
    await fetch('/api/diag/ui', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'error',
        timestamp: new Date().toISOString(),
        ...errorInfo
      }),
      cache: 'no-store'
    });
  } catch {
    // 診断ログ送信失敗は無視
  }
}

/**
 * /api/my/organization から安全に組織データを取得
 */
export async function getMyOrganizationSafe(reqHeaders?: Headers): Promise<SafeDataResult<SafeOrganizationData>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Server-side の場合はリクエストヘッダーを転送
    if (reqHeaders) {
      const cookie = reqHeaders.get('cookie');
      if (cookie) {
        headers.Cookie = cookie;
      }
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/my/organization`, {
      headers,
      cache: 'no-store'
    });

    if (response.status === 404 || response.status === 401) {
      // ログインしていない or 組織がない場合
      return { data: null };
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.data) {
      return { data: null };
    }

    return { data: result.data };

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