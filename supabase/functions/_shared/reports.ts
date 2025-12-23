/**
 * Monthly Reports - Shared Utilities
 *
 * Edge Functions 用レポート共通ユーティリティ
 * - 期間正規化 (util.normalize_month_period 相当)
 * - idempotency_key 生成
 * - 共通型定義
 */

// =====================================================
// Types
// =====================================================

export interface NormalizedPeriod {
  monthBucket: string; // YYYY-MM format for indexing
  periodStart: string; // YYYY-MM-DD (first day of month)
  periodEnd: string; // YYYY-MM-DD (last day of month)
}

export interface ReportJobInput {
  organizationId: string;
  planId: string;
  level: 'basic' | 'advanced';
  periodStart: string; // date string
  periodEnd?: string; // optional, auto-calculated if not provided
}

export interface IdempotencyKeyComponents {
  organizationId: string;
  monthBucket: string;
  planId: string;
  level: string;
}

export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';
export type JobStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'timeout'
  | 'skipped';

// =====================================================
// Period Normalization (util.normalize_month_period equivalent)
// =====================================================

/**
 * 期間を正規化（月単位に丸める）
 * DB関数 util.normalize_month_period と同等の処理
 *
 * @param periodStart - 開始日 (YYYY-MM-DD or Date)
 * @param periodEnd - 終了日 (optional, YYYY-MM-DD or Date)
 * @returns 正規化された期間情報
 */
export function normalizeMonthPeriod(
  periodStart: string | Date,
  periodEnd?: string | Date
): NormalizedPeriod {
  const startDate =
    typeof periodStart === 'string' ? new Date(periodStart) : periodStart;

  // Extract year and month (UTC)
  const year = startDate.getUTCFullYear();
  const month = startDate.getUTCMonth() + 1; // 1-12

  // Calculate month bucket (YYYY-MM)
  const monthBucket = `${year}-${String(month).padStart(2, '0')}`;

  // First day of month
  const normalizedStart = `${year}-${String(month).padStart(2, '0')}-01`;

  // Last day of month
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const normalizedEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return {
    monthBucket,
    periodStart: normalizedStart,
    periodEnd: normalizedEnd,
  };
}

/**
 * 年月から期間を生成
 */
export function toPeriodFromYearMonth(
  year: number,
  month: number
): NormalizedPeriod {
  const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
  return normalizeMonthPeriod(periodStart);
}

/**
 * デフォルトの対象期間を取得（前月）
 */
export function getDefaultTargetPeriod(): NormalizedPeriod {
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth(); // 0-11

  // 前月を計算
  const targetYear = utcMonth === 0 ? utcYear - 1 : utcYear;
  const targetMonth = utcMonth === 0 ? 12 : utcMonth; // 1-12

  return toPeriodFromYearMonth(targetYear, targetMonth);
}

// =====================================================
// Idempotency Key Generation
// =====================================================

/**
 * idempotency_key を生成
 * 形式: hash(orgId, month_bucket, plan_id, level)
 *
 * @param components - キー構成要素
 * @returns idempotency key string
 */
export function generateIdempotencyKey(
  components: IdempotencyKeyComponents
): string {
  const { organizationId, monthBucket, planId, level } = components;
  // Create a deterministic key from components
  const raw = `${organizationId}:${monthBucket}:${planId}:${level}`;

  // Use SHA-256 hash (Deno built-in)
  return hashString(raw);
}

/**
 * 文字列をSHA-256ハッシュに変換
 */
function hashString(input: string): string {
  // Simple hash for Deno - using TextEncoder
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  // Create a simple hash (not cryptographically secure, but deterministic)
  // For production, use crypto.subtle.digest
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to hex string with prefix
  return `rpt_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

/**
 * async版: SHA-256ハッシュを生成
 */
export async function generateIdempotencyKeyAsync(
  components: IdempotencyKeyComponents
): Promise<string> {
  const { organizationId, monthBucket, planId, level } = components;
  const raw = `${organizationId}:${monthBucket}:${planId}:${level}`;

  // Use Web Crypto API (available in Deno)
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `rpt_${hashHex}`;
}

// =====================================================
// Validation
// =====================================================

/**
 * UUID形式チェック
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * 年月のバリデーション
 */
export function isValidYearMonth(year: number, month: number): boolean {
  return (
    Number.isInteger(year) &&
    year >= 2020 &&
    year <= 2100 &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12
  );
}

/**
 * 未来の月かチェック
 */
export function isFuturePeriod(year: number, month: number): boolean {
  const now = new Date();
  const requestedDate = new Date(Date.UTC(year, month - 1, 1));
  const currentMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  return requestedDate > currentMonth;
}

// =====================================================
// Response Helpers
// =====================================================

export interface ReportJobResult {
  status: 'ok' | 'error' | 'skipped';
  reportId?: string;
  jobId?: string;
  organizationId?: string;
  period?: NormalizedPeriod;
  currentStatus?: ReportStatus | JobStatus;
  message?: string;
}

/**
 * JSON レスポンスを生成
 */
export function jsonResponse(
  body: ReportJobResult | { error: string; details?: string },
  status = 200
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      Connection: 'keep-alive',
    },
  });
}

/**
 * エラーレスポンスを生成
 */
export function errorResponse(
  message: string,
  status = 400,
  details?: string
): Response {
  return jsonResponse({ error: message, details }, status);
}

// =====================================================
// Report Query Helpers
// =====================================================

/**
 * レポート優先度でソート
 * completed > generating > pending > failed
 */
export function sortByStatusPriority<
  T extends { status: string; updated_at: string },
>(reports: T[]): T[] {
  const priority: Record<string, number> = {
    completed: 0,
    generating: 1,
    pending: 2,
    failed: 3,
  };

  return [...reports].sort((a, b) => {
    const priorityA = priority[a.status] ?? 99;
    const priorityB = priority[b.status] ?? 99;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Same priority: sort by updated_at desc
    return (
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  });
}
