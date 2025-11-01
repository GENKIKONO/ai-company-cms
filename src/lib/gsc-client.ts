/**
 * Google Search Console API Client
 * GSC APIを使用してSEOメトリクスを取得
 */

import { logger } from '@/lib/utils/logger';

// GSC API 型定義
export interface GSCSearchQuery {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dimensions?: ('query' | 'page' | 'country' | 'device' | 'searchAppearance')[];
  filters?: GSCFilter[];
  aggregationType?: 'auto' | 'byPage' | 'byProperty';
  rowLimit?: number; // max 25000
  startRow?: number;
}

export interface GSCFilter {
  dimension: 'query' | 'page' | 'country' | 'device' | 'searchAppearance';
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'includingRegex' | 'excludingRegex';
  expression: string;
}

export interface GSCMetricRow {
  keys?: string[]; // dimensionsに対応した値
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCResponse {
  rows?: GSCMetricRow[];
  responseAggregationType?: string;
}

export interface GSCApiCredentials {
  client_email: string;
  private_key: string;
  project_id: string;
}

/**
 * Google Search Console API クライアント
 */
export class GSCClient {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private credentials: GSCApiCredentials;
  private siteUrl: string;

  constructor(credentials: GSCApiCredentials, siteUrl: string) {
    this.credentials = credentials;
    this.siteUrl = siteUrl;
  }

  /**
   * JWT トークンを生成してアクセストークンを取得
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // JWT生成用ライブラリを使用（jose）
      const { SignJWT } = await import('jose');
      
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: this.credentials.client_email,
        scope: 'https://www.googleapis.com/auth/webmasters.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600, // 1時間後
        iat: now,
      };

      // 秘密鍵をPEM形式に変換
      const privateKeyPem = this.credentials.private_key.replace(/\\n/g, '\n');
      const privateKey = await import('crypto').then(crypto => 
        crypto.createPrivateKey(privateKeyPem)
      );

      const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .sign(privateKey);

      // OAuth2 トークンエンドポイントに POST
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token request failed: ${tokenResponse.status} ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in * 1000) - 60000); // 1分前に期限切れ扱い

      return this.accessToken;

    } catch (error) {
      logger.error('Failed to get GSC access token:', error);
      throw new Error('GSC authentication failed');
    }
  }

  /**
   * Search Analytics データを取得
   */
  async querySearchAnalytics(query: GSCSearchQuery): Promise<GSCResponse> {
    try {
      const accessToken = await this.getAccessToken();
      
      const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(this.siteUrl)}/searchAnalytics/query`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: query.startDate,
          endDate: query.endDate,
          dimensions: query.dimensions || ['query', 'page'],
          ...(query.filters && { dimensionFilterGroups: [{ filters: query.filters }] }),
          aggregationType: query.aggregationType || 'auto',
          rowLimit: Math.min(query.rowLimit || 1000, 25000),
          startRow: query.startRow || 0,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GSC API request failed: ${response.status} ${errorText}`);
      }

      const data: GSCResponse = await response.json();
      return data;

    } catch (error) {
      logger.error('GSC Search Analytics query failed:', error);
      throw error;
    }
  }

  /**
   * 特定URLのメトリクスを取得
   */
  async getUrlMetrics(
    url: string, 
    startDate: string, 
    endDate: string,
    includeQueries: boolean = true
  ): Promise<GSCMetricRow[]> {
    const query: GSCSearchQuery = {
      startDate,
      endDate,
      dimensions: includeQueries ? ['query', 'page'] : ['page'],
      filters: [
        {
          dimension: 'page',
          operator: 'equals',
          expression: url,
        },
      ],
      rowLimit: includeQueries ? 1000 : 1,
    };

    const response = await this.querySearchAnalytics(query);
    return response.rows || [];
  }

  /**
   * トップクエリを取得
   */
  async getTopQueries(
    startDate: string,
    endDate: string,
    limit: number = 100
  ): Promise<GSCMetricRow[]> {
    const query: GSCSearchQuery = {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: limit,
    };

    const response = await this.querySearchAnalytics(query);
    return response.rows || [];
  }

  /**
   * トップページを取得
   */
  async getTopPages(
    startDate: string,
    endDate: string,
    limit: number = 100
  ): Promise<GSCMetricRow[]> {
    const query: GSCSearchQuery = {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: limit,
    };

    const response = await this.querySearchAnalytics(query);
    return response.rows || [];
  }
}

/**
 * 環境変数からGSCクライアントを初期化
 */
export function createGSCClient(siteUrl: string): GSCClient {
  const credentials: GSCApiCredentials = {
    client_email: process.env.GSC_CLIENT_EMAIL!,
    private_key: process.env.GSC_PRIVATE_KEY!,
    project_id: process.env.GSC_PROJECT_ID!,
  };

  if (!credentials.client_email || !credentials.private_key || !credentials.project_id) {
    throw new Error('GSC credentials not configured in environment variables');
  }

  return new GSCClient(credentials, siteUrl);
}

/**
 * GSCメトリクスをデータベース形式に変換
 */
export function transformGSCMetrics(
  metrics: GSCMetricRow[],
  orgId: string,
  dateRecorded: string
): Array<{
  org_id: string;
  url: string;
  search_query: string | null;
  impressions: number;
  clicks: number;
  average_position: number;
  ctr: number;
  date_recorded: string;
}> {
  return metrics.map(metric => {
    const isQueryDimension = metric.keys && metric.keys.length >= 2;
    const query = isQueryDimension ? metric.keys[0] : null;
    const url = isQueryDimension ? metric.keys[1] : metric.keys?.[0] || '';

    return {
      org_id: orgId,
      url: url,
      search_query: query,
      impressions: metric.impressions,
      clicks: metric.clicks,
      average_position: metric.position,
      ctr: metric.ctr,
      date_recorded: dateRecorded,
    };
  });
}