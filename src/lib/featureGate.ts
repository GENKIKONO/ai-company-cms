/**
 * Feature Gate - 唯一の機能設定参照元
 *
 * 【重要】
 * - 機能設定は必ずこのモジュール経由で取得する
 * - DB直読みを各所に散らさない
 * - 表示用はキャッシュOK、実行時は必ずサーバ判定
 *
 * 【DB正対応】
 * - 主体（Subject）は org が標準、user は例外
 * - すべてのRPCは subject_type/subject_id を必須引数に持つ
 *
 * 【Request-Scope Memoization】
 * - React cache() を使用してリクエストスコープでの重複抑止
 * - module-level Map は TTLキャッシュ用（60秒）
 * - inflight deduplication は cache() が自動的に行う
 *
 * 【依存RPC】
 * - get_effective_feature_set(subject_type, subject_id)
 * - check_and_consume_quota(subject_type, subject_id, feature_key, limit_key, amount, period, idempotency_key)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';

// NOTE: [CLIENT_IMPORT_CHAIN_FIX] サーバーサイドモジュールを動的インポート
// webpackIgnore は削除（ランタイムでエイリアス解決できないため）
const getSupabaseClient = async () => {
  const mod = await import('@/lib/supabase/server');
  return mod.createClient();
};

// auth-state.ts も supabase/server.ts を静的インポートするため動的インポートでラップ
const getUserWithClientDynamic = async (supabase: SupabaseClient) => {
  const mod = await import('@/lib/core/auth-state');
  return mod.getUserWithClient(supabase);
};

// =============================================================================
// Types (DB正対応)
// =============================================================================

/** 主体（Subject）の統一型 */
export type Subject = {
  type: 'org' | 'user';
  id: string;
};

/** Quota判定結果コード（DB正対応） */
export type QuotaResultCode =
  | 'OK'
  | 'NO_PLAN'
  | 'DISABLED'
  | 'EXCEEDED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_ARG'
  | 'ERROR'
  // Legacy codes (互換性のため)
  | 'NO_LIMIT'
  | 'USER_MISMATCH';

/** Quota判定結果（統一形式、DB正対応） */
export interface QuotaResult {
  ok: boolean;
  code: QuotaResultCode;
  remaining?: number;
  limit?: number;
  period?: string | null;
  window_end?: string;
  replayed?: boolean;
}

/** 単一機能の有効設定（DB正対応） */
export interface EffectiveFeature {
  feature_id?: string;
  feature_key: string;
  is_enabled?: boolean;
  enabled?: boolean; // Legacy互換
  effective_config?: Record<string, unknown>;
  config?: Record<string, unknown>; // Legacy互換
  limits?: Array<{
    limit_key: string;
    period: string;
    limit_value: number;
    reset_day: number | null;
  }> | Record<string, { value: number; period: string | null; reset_day: number | null }>; // 両形式対応
  meter_key?: string | null;
  ui_visibility?: boolean;
}

/** 機能セット（DB正対応） */
export interface FeatureSet {
  subject: Subject;
  planId: string | null;
  features: Map<string, EffectiveFeature>;
  fetchedAt: number;
  // Legacy互換
  userId?: string;
  orgId?: string | null;
}

// =============================================================================
// Cache (Server-side in-memory, short-lived)
// =============================================================================

const CACHE_TTL_MS = 60 * 1000; // 60秒（表示用）
const featureSetCache = new Map<string, FeatureSet>();

// =============================================================================
// Request-Scope Memoization (React cache)
// =============================================================================
//
// React cache() を使用してリクエストスコープでの重複抑止を実現
// - 同一リクエスト内で同じ引数の呼び出しは1回だけRPCを実行
// - リクエスト完了時に自動でクリーンアップ（メモリリークなし）
// - module-level Map と異なり、リクエスト間で共有されない
//
// 注意: cache() はプリミティブ値のみ比較可能
// SupabaseClient は引数に渡せないため、subject のみをキーとする

/**
 * Request-scoped RPC fetch for getEffectiveFeatures
 *
 * cache() によりリクエストスコープでメモ化される
 * 同一リクエスト内で同じ subject への呼び出しは1回だけRPCを実行
 */
const fetchEffectiveFeaturesRPC = cache(async (
  subjectType: 'org' | 'user',
  subjectId: string
): Promise<{ data: unknown; error: { code?: string; message?: string } | null }> => {
  const supabase = await getSupabaseClient();
  return supabase.rpc('get_effective_feature_set', {
    subject_type: subjectType,
    subject_id: subjectId,
  });
});

/**
 * Request-scoped RPC fetch for getFeatureSetForUser (Legacy API)
 *
 * cache() によりリクエストスコープでメモ化される
 * @deprecated 新規コードでは getEffectiveFeatures を使用
 */
const fetchFeatureSetForUserRPC = cache(async (
  userId: string,
  orgId: string | null
): Promise<{ data: unknown; error: { code?: string; message?: string } | null }> => {
  const supabase = await getSupabaseClient();
  return supabase.rpc('get_effective_feature_set', {
    p_user_id: userId,
    p_org_id: orgId,
  });
});

function getCacheKey(userId: string, orgId?: string | null): string {
  return `${userId}:${orgId || 'personal'}`;
}

function getCachedFeatureSet(userId: string, orgId?: string | null): FeatureSet | null {
  const key = getCacheKey(userId, orgId);
  const cached = featureSetCache.get(key);

  if (!cached) return null;

  // TTLチェック
  if (Date.now() - cached.fetchedAt > CACHE_TTL_MS) {
    featureSetCache.delete(key);
    return null;
  }

  return cached;
}

function setCachedFeatureSet(featureSet: FeatureSet): void {
  const key = getCacheKey(featureSet.userId, featureSet.orgId);
  featureSetCache.set(key, featureSet);
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * ユーザーの全機能セットを取得（RPCを1回だけ呼ぶ + リクエストスコープメモ化）
 *
 * リクエストスコープメモ化:
 * - React cache() により同一リクエスト内の重複RPC呼び出しを自動抑止
 * - module-level Map は使用せず、リクエスト間での共有リスクを排除
 *
 * @deprecated Subject型APIを使用してください: getEffectiveFeatures({ type: 'user' | 'org', id })
 * @param supabase - Supabaseクライアント（フォールバック・getUser時のみ使用）
 * @param userId - ユーザーID（省略時は現在のユーザー）
 * @param orgId - 組織ID（オプション、将来のマルチテナンシ用）
 * @param skipCache - キャッシュをスキップするか
 */
export async function getFeatureSetForUser(
  supabase: SupabaseClient,
  userId?: string,
  orgId?: string | null,
  skipCache = false
): Promise<FeatureSet | null> {
  try {
    // userIdが指定されていない場合は現在のユーザーを取得（Core正本経由）
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await getUserWithClientDynamic(supabase);
      if (!user) return null;
      targetUserId = user.id;
    }

    // キャッシュチェック（TTL 60秒）
    if (!skipCache) {
      const cached = getCachedFeatureSet(targetUserId, orgId);
      if (cached) return cached;
    }

    // React cache() によるリクエストスコープメモ化でRPC呼び出し
    // 同一リクエスト内で同じ userId/orgId への呼び出しは1回だけ実行される
    try {
      const { data, error } = await fetchFeatureSetForUserRPC(targetUserId, orgId || null);

      if (error) {
        // RPCが存在しない場合はフォールバック
        if (error.code === '42883') {
          // eslint-disable-next-line no-console
          console.warn('[featureGate] RPC get_effective_feature_set not found, using fallback');
          return await getFeatureSetFallback(supabase, targetUserId, orgId);
        }
        // eslint-disable-next-line no-console
        console.error('[featureGate] RPC error:', error);
        return null;
      }

      // FeatureSetに変換
      const features = new Map<string, EffectiveFeature>();
      if (Array.isArray(data)) {
        for (const item of data) {
          features.set(item.feature_key, item as EffectiveFeature);
        }
      }

      const featureSet: FeatureSet = {
        subject: orgId ? { type: 'org', id: orgId } : { type: 'user', id: targetUserId },
        userId: targetUserId,
        orgId: orgId || null,
        planId: null, // RPC側で含める場合は取得
        features,
        fetchedAt: Date.now(),
      };

      setCachedFeatureSet(featureSet);
      return featureSet;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[featureGate] getFeatureSetForUser error:', err);
      return null;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[featureGate] getFeatureSetForUser error:', err);
    return null;
  }
}

/**
 * フォールバック: RPCがない場合の個別クエリ
 */
async function getFeatureSetFallback(
  supabase: SupabaseClient,
  userId: string,
  orgId?: string | null
): Promise<FeatureSet | null> {
  try {
    // 現在のプランを取得
    const { data: planData } = await supabase.rpc('get_current_plan_for_user', {
      user_id: userId,
    });

    const planId = planData as string | null;
    const features = new Map<string, EffectiveFeature>();

    if (planId) {
      // プランに紐づく機能を取得
      const { data: planFeatures } = await supabase
        .from('plan_features_v2')
        .select(
          `
          is_enabled,
          default_config,
          feature:features(key, name)
        `
        )
        .eq('plan_id', planId);

      if (planFeatures) {
        for (const pf of planFeatures) {
          // Supabase relationは配列で返却されるため、最初の要素を取得
          const featureData = Array.isArray(pf.feature) ? pf.feature[0] : pf.feature;
          const featureKey = (featureData as { key: string } | null)?.key;
          if (featureKey) {
            features.set(featureKey, {
              feature_key: featureKey,
              enabled: pf.is_enabled,
              config: (pf.default_config as Record<string, unknown>) || {},
              limits: {},
              meter_key: null,
              ui_visibility: pf.is_enabled,
            });
          }
        }
      }
    }

    return {
      subject: orgId ? { type: 'org' as const, id: orgId } : { type: 'user' as const, id: userId },
      userId,
      orgId: orgId || null,
      planId,
      features,
      fetchedAt: Date.now(),
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[featureGate] fallback error:', err);
    return null;
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * 機能が有効かどうかをチェック（表示用）
 *
 * @deprecated Subject型APIを使用してください: getEffectiveFeatures(subject) から判定
 */
export async function isFeatureEnabled(
  supabase: SupabaseClient,
  featureKey: string,
  userId?: string,
  orgId?: string | null
): Promise<boolean> {
  const featureSet = await getFeatureSetForUser(supabase, userId, orgId);
  if (!featureSet) return false;

  const feature = featureSet.features.get(featureKey);
  return feature?.enabled ?? false;
}

/**
 * 機能設定を取得（表示用）
 *
 * @deprecated Subject型APIを使用してください: getEffectiveFeatures(subject) から取得
 */
export async function getFeatureConfig(
  supabase: SupabaseClient,
  featureKey: string,
  userId?: string,
  orgId?: string | null
): Promise<Record<string, unknown> | null> {
  const featureSet = await getFeatureSetForUser(supabase, userId, orgId);
  if (!featureSet) return null;

  const feature = featureSet.features.get(featureKey);
  return feature?.config ?? null;
}

/**
 * 機能の上限情報を取得（表示用）
 *
 * @deprecated Subject型APIを使用してください: getEffectiveFeatures(subject) から取得
 */
export async function getFeatureLimit(
  supabase: SupabaseClient,
  featureKey: string,
  limitKey: string,
  userId?: string,
  orgId?: string | null
): Promise<{ value: number; period: string | null } | null> {
  const featureSet = await getFeatureSetForUser(supabase, userId, orgId);
  if (!featureSet) return null;

  const feature = featureSet.features.get(featureKey);
  const limit = feature?.limits?.[limitKey];
  if (!limit) return null;

  return { value: limit.value, period: limit.period };
}

// =============================================================================
// Runtime Enforcement (実行時強制)
// =============================================================================

/**
 * クォータをチェックして消費（実行時用、必ずサーバー側で呼ぶ）
 *
 * @deprecated Subject型APIを使用してください: canExecute({ subject, feature_key, limit_key, amount, period })
 * @returns QuotaResult { ok, code, remaining? }
 */
export async function checkAndConsumeQuota(
  supabase: SupabaseClient,
  featureKey: string,
  amount: number = 1,
  userId?: string,
  orgId?: string | null
): Promise<QuotaResult> {
  try {
    // userIdが指定されていない場合は現在のユーザーを取得（Core正本経由）
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await getUserWithClientDynamic(supabase);
      if (!user) {
        return { ok: false, code: 'USER_MISMATCH' };
      }
      targetUserId = user.id;
    }

    // RPC呼び出し（新形式を想定）
    const { data, error } = await supabase.rpc('check_and_consume_quota', {
      p_user: targetUserId,
      p_feature_key: featureKey,
      p_amount: amount,
      p_org_id: orgId || null,
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[featureGate] quota RPC error:', error);
      return { ok: false, code: 'ERROR' };
    }

    // RPC返却形式に応じて変換
    // 既存RPC（boolean返却）の場合
    if (typeof data === 'boolean') {
      return {
        ok: data,
        code: data ? 'OK' : 'EXCEEDED',
      };
    }

    // 新形式RPC（jsonb返却）の場合
    if (typeof data === 'object' && data !== null) {
      // 旧RPCの code/status を新形式にマッピング
      let code: QuotaResultCode = data.code ?? 'ERROR';
      let ok = data.ok ?? false;

      // 旧RPC互換: code が小文字の場合や異なる表記の場合
      const legacyCodeMap: Record<string, QuotaResultCode> = {
        'ok': 'OK',
        'quota_exceeded': 'EXCEEDED',
        'limit_exceeded': 'EXCEEDED',
        'no_active_plan': 'NO_PLAN',
        'feature_not_found': 'NOT_FOUND',
        'invalid_amount': 'INVALID_ARG',
        'unlimited': 'NO_LIMIT',
      };

      const rawCode = (data.code || data.status || '').toLowerCase();
      if (legacyCodeMap[rawCode]) {
        code = legacyCodeMap[rawCode];
        // 'ok' / 'unlimited' は成功扱い
        if (rawCode === 'ok' || rawCode === 'unlimited') {
          ok = true;
        }
      }

      return {
        ok,
        code,
        remaining: data.remaining,
        limit: data.limit,
        period: data.period,
        replayed: data.replayed,
      };
    }

    return { ok: false, code: 'ERROR' };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[featureGate] checkAndConsumeQuota error:', err);
    return { ok: false, code: 'ERROR' };
  }
}

/**
 * クォータガード（APIルート用）
 * クォータを消費できない場合はエラーをスロー
 *
 * @deprecated Subject型APIを使用してください: canExecute({ subject, ... }) でチェック後、エラーをスロー
 */
export async function guardWithQuota(
  supabase: SupabaseClient,
  featureKey: string,
  amount: number = 1,
  userId?: string,
  orgId?: string | null
): Promise<QuotaResult> {
  const result = await checkAndConsumeQuota(supabase, featureKey, amount, userId, orgId);

  if (!result.ok) {
    throw new QuotaError(featureKey, result);
  }

  return result;
}

/**
 * 機能ガード（APIルート用）
 * 機能が無効な場合はエラーをスロー
 *
 * @deprecated Subject型APIを使用してください: getEffectiveFeatures(subject) でチェック後、エラーをスロー
 */
export async function guardWithFeature(
  supabase: SupabaseClient,
  featureKey: string,
  userId?: string,
  orgId?: string | null
): Promise<void> {
  const enabled = await isFeatureEnabled(supabase, featureKey, userId, orgId);

  if (!enabled) {
    throw new FeatureDisabledError(featureKey);
  }
}

// =============================================================================
// Error Classes
// =============================================================================

export class QuotaError extends Error {
  code: QuotaResultCode;
  status: number;
  featureKey: string;
  result: QuotaResult;

  constructor(featureKey: string, result: QuotaResult) {
    const message = QuotaError.getMessage(result.code);
    super(message);
    this.name = 'QuotaError';
    this.featureKey = featureKey;
    this.code = result.code;
    this.result = result;
    this.status = QuotaError.getStatus(result.code);
  }

  static getMessage(code: QuotaResultCode): string {
    const messages: Record<QuotaResultCode, string> = {
      OK: 'OK',
      NO_PLAN: 'プランが設定されていません',
      DISABLED: 'この機能は無効です',
      NO_LIMIT: '上限なし',
      EXCEEDED: 'クォータ上限に達しました',
      ERROR: 'エラーが発生しました',
      USER_MISMATCH: 'ユーザーが一致しません',
      // DB正対応の新コード
      FORBIDDEN: '権限がありません',
      NOT_FOUND: '対象が見つかりません',
      INVALID_ARG: '引数が不正です',
    };
    return messages[code] || 'エラーが発生しました';
  }

  static getStatus(code: QuotaResultCode): number {
    const statuses: Record<QuotaResultCode, number> = {
      OK: 200,
      NO_PLAN: 402,
      DISABLED: 403,
      NO_LIMIT: 200, // 上限なし = 許可
      EXCEEDED: 429,
      ERROR: 500,
      USER_MISMATCH: 401,
      // DB正対応の新コード
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      INVALID_ARG: 400,
    };
    return statuses[code] || 500;
  }
}

export class FeatureDisabledError extends Error {
  code = 'FEATURE_DISABLED';
  status = 403;
  featureKey: string;

  constructor(featureKey: string) {
    super(`この機能は利用できません: ${featureKey}`);
    this.name = 'FeatureDisabledError';
    this.featureKey = featureKey;
  }
}

// =============================================================================
// Cache Management
// =============================================================================

/**
 * キャッシュをクリア（管理者がプラン/機能を変更した後に呼ぶ）
 *
 * @deprecated Subject型APIを使用してください: clearSubjectCache(subject)
 */
export function clearFeatureCache(userId?: string, orgId?: string | null): void {
  if (userId) {
    const key = getCacheKey(userId, orgId);
    featureSetCache.delete(key);
  } else {
    featureSetCache.clear();
  }
}

// =============================================================================
// DB正対応 API（Subject ベース）
// =============================================================================

/**
 * Subject ベースのキャッシュキー生成
 */
function getSubjectCacheKey(subject: Subject): string {
  return `${subject.type}:${subject.id}`;
}

/**
 * Subject ベースの機能セット取得（60秒キャッシュ + リクエストスコープメモ化）
 * DB正対応: get_effective_feature_set(subject_type, subject_id) を呼び出し
 *
 * リクエストスコープメモ化:
 * - React cache() により同一リクエスト内の重複RPC呼び出しを自動抑止
 * - module-level Map は使用せず、リクエスト間での共有リスクを排除
 *
 * @param supabase - SupabaseClient（フォールバック時のみ使用）
 * @param subject - 主体（org or user）
 */
export async function getEffectiveFeatures(
  supabase: SupabaseClient,
  subject: Subject
): Promise<EffectiveFeature[]> {
  const key = getSubjectCacheKey(subject);
  const now = Date.now();

  // 1. TTLキャッシュチェック（60秒）
  const cached = featureSetCache.get(key);
  if (cached && (now - cached.fetchedAt) < CACHE_TTL_MS) {
    return Array.from(cached.features.values());
  }

  // 2. React cache() によるリクエストスコープメモ化でRPC呼び出し
  //    同一リクエスト内で同じ subject への呼び出しは1回だけ実行される
  try {
    const { data, error } = await fetchEffectiveFeaturesRPC(subject.type, subject.id);

    if (error) {
      // RPC が存在しない場合はレガシーAPIにフォールバック
      if (error.code === '42883') {
        // eslint-disable-next-line no-console
        console.warn('[featureGate] New RPC not found, falling back to legacy');
        const legacySet = await getFeatureSetForUser(
          supabase,
          subject.type === 'user' ? subject.id : undefined,
          subject.type === 'org' ? subject.id : undefined
        );
        return legacySet ? Array.from(legacySet.features.values()) : [];
      }

      // DB側がRAISE exceptionで返すエラーをハンドリング
      const errorMessage = error.message?.toUpperCase() || '';
      if (errorMessage.includes('FORBIDDEN')) {
        // eslint-disable-next-line no-console
        console.warn('[featureGate] Access forbidden for subject', { subject });
        throw new FeatureDisabledError('access_denied');
      }
      if (errorMessage.includes('INVALID_ARG')) {
        // eslint-disable-next-line no-console
        console.error('[featureGate] Invalid argument', { subject, error });
        throw new Error('Invalid subject argument');
      }

      throw error;
    }

    // キャッシュに保存
    const features = new Map<string, EffectiveFeature>();
    if (Array.isArray(data)) {
      for (const item of data) {
        const feature = item as EffectiveFeature;
        features.set(feature.feature_key, feature);
      }
    }

    const featureSet: FeatureSet = {
      subject,
      planId: null,
      features,
      fetchedAt: Date.now(),
      // Legacy互換
      userId: subject.type === 'user' ? subject.id : undefined,
      orgId: subject.type === 'org' ? subject.id : undefined,
    };

    featureSetCache.set(key, featureSet);
    return Array.from(features.values());
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[featureGate] getEffectiveFeatures error:', err);
    return [];
  }
}

/**
 * Subject ベースのクォータ判定・消費（実行時用、必ずサーバー側で呼ぶ）
 * DB正対応: check_and_consume_quota RPC を呼び出し
 *
 * 注意: DB側は daily/weekly/monthly/total のみ対応
 *       yearly/rolling は未実装のためエラーになる
 */
export async function canExecute(
  supabase: SupabaseClient,
  args: {
    subject: Subject;
    feature_key: string;
    limit_key: string;
    amount?: number;
    period: 'daily' | 'weekly' | 'monthly' | 'total'; // yearly/rolling は DB未対応
    idempotency_key?: string;
  }
): Promise<QuotaResult> {
  try {
    const { data, error } = await supabase.rpc('check_and_consume_quota', {
      subject_type: args.subject.type,
      subject_id: args.subject.id,
      feature_key: args.feature_key,
      limit_key: args.limit_key,
      amount: args.amount ?? 1,
      period: args.period,
      idempotency_key: args.idempotency_key ?? null,
    });

    if (error) {
      // RPC が存在しない場合はレガシーAPIにフォールバック
      if (error.code === '42883') {
        // eslint-disable-next-line no-console
        console.warn('[featureGate] New quota RPC not found, falling back to legacy');
        return checkAndConsumeQuota(
          supabase,
          args.feature_key,
          args.amount ?? 1,
          args.subject.type === 'user' ? args.subject.id : undefined,
          args.subject.type === 'org' ? args.subject.id : undefined
        );
      }
      // eslint-disable-next-line no-console
      console.error('[featureGate] canExecute RPC error:', error);
      return { ok: false, code: 'ERROR' };
    }

    // DB側のjsonb返却をマップ（旧RPC互換含む）
    if (typeof data === 'object' && data !== null) {
      // 旧RPCの code/status を新形式にマッピング
      let code: QuotaResultCode = data.code ?? 'ERROR';
      let ok = data.ok ?? false;

      const legacyCodeMap: Record<string, QuotaResultCode> = {
        'ok': 'OK',
        'quota_exceeded': 'EXCEEDED',
        'limit_exceeded': 'EXCEEDED',
        'no_active_plan': 'NO_PLAN',
        'feature_not_found': 'NOT_FOUND',
        'invalid_amount': 'INVALID_ARG',
        'unlimited': 'NO_LIMIT',
      };

      const rawCode = (data.code || data.status || '').toLowerCase();
      if (legacyCodeMap[rawCode]) {
        code = legacyCodeMap[rawCode];
        if (rawCode === 'ok' || rawCode === 'unlimited') {
          ok = true;
        }
      }

      return {
        ok,
        code,
        remaining: data.remaining,
        limit: data.limit,
        period: data.period,
        window_end: data.window_end,
        replayed: data.replayed,
      };
    }

    // boolean 返却の場合（レガシー互換）
    if (typeof data === 'boolean') {
      return { ok: data, code: data ? 'OK' : 'EXCEEDED' };
    }

    return { ok: false, code: 'ERROR' };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[featureGate] canExecute error:', err);
    return { ok: false, code: 'ERROR' };
  }
}

/**
 * Subject のキャッシュをクリア
 */
export function clearSubjectCache(subject?: Subject): void {
  if (subject) {
    const key = getSubjectCacheKey(subject);
    featureSetCache.delete(key);
  } else {
    featureSetCache.clear();
  }
}

// =============================================================================
// 統一ヘルパー関数（UI側が直接参照するためのAPI）
// NOTE: [FEATUREGATE_PHASE2] org-features/PLAN_LIMITS の代替として使用
// =============================================================================

/**
 * 機能が有効かどうかを判定（防御的実装）
 *
 * @param features - getEffectiveFeatures() から取得した配列
 * @param featureKey - 機能キー（例: 'ai_reports', 'verified_badge'）
 * @returns 有効なら true
 */
export function getFeatureEnabled(
  features: EffectiveFeature[],
  featureKey: string
): boolean {
  const feature = features.find(f => f.feature_key === featureKey);
  if (!feature) return false;

  // is_enabled / enabled の両方に対応（DB形式の揺れを吸収）
  return feature.is_enabled === true || feature.enabled === true;
}

/**
 * 機能の特定の制限値を取得（防御的実装）
 *
 * @param features - getEffectiveFeatures() から取得した配列
 * @param featureKey - 機能キー
 * @param limitKey - 制限キー（例: 'max_count', 'monthly_limit'）
 * @param period - 期間（例: 'monthly', 'total'）省略可
 * @returns 制限値、または取得できない場合は null
 */
export function getLimitValue(
  features: EffectiveFeature[],
  featureKey: string,
  limitKey: string,
  period?: string
): number | null {
  const feature = features.find(f => f.feature_key === featureKey);
  if (!feature?.limits) return null;

  // limits が配列形式の場合
  if (Array.isArray(feature.limits)) {
    const found = feature.limits.find(l =>
      l.limit_key === limitKey &&
      (period === undefined || l.period === period)
    );
    return found?.limit_value ?? null;
  }

  // limits が Record形式の場合（Legacy互換）
  if (typeof feature.limits === 'object') {
    const limit = (feature.limits as Record<string, { value: number; period: string | null }>)[limitKey];
    if (!limit) return null;
    if (period !== undefined && limit.period !== period) return null;
    return limit.value ?? null;
  }

  return null;
}

/**
 * 機能の全制限を取得（防御的実装）
 *
 * @param features - getEffectiveFeatures() から取得した配列
 * @param featureKey - 機能キー
 * @returns 制限配列（統一形式）
 */
export function getLimitsForFeature(
  features: EffectiveFeature[],
  featureKey: string
): Array<{ limit_key: string; period: string | null; limit_value: number }> {
  const feature = features.find(f => f.feature_key === featureKey);
  if (!feature?.limits) return [];

  // 配列形式
  if (Array.isArray(feature.limits)) {
    return feature.limits.map(l => ({
      limit_key: l.limit_key,
      period: l.period ?? null,
      limit_value: l.limit_value,
    }));
  }

  // Record形式（Legacy互換）
  if (typeof feature.limits === 'object') {
    return Object.entries(feature.limits).map(([key, val]) => ({
      limit_key: key,
      period: val.period,
      limit_value: val.value,
    }));
  }

  return [];
}

/**
 * UI表示用のプラン制限情報を取得（PLAN_LIMITS 置換用）
 *
 * NOTE: 既存UIが必要とする最小限の項目のみ返す
 * DB側にデータがない場合は null を返す（呼び出し側でフォールバック処理を行う）
 *
 * @param features - getEffectiveFeatures() から取得した配列
 * @returns UI表示用の制限情報（フォールバック用にnull許容）
 */
export interface PlanUiLimits {
  services: number | null;
  qa_items: number | null;
  case_studies: number | null;
  faqs: number | null;
  posts: number | null;
  materials: number | null;
  embeds: number | null;
  verified_badge: boolean;
  ai_reports: boolean;
  system_monitoring: boolean;
}

export function getPlanUiLimitsFromFeatures(
  features: EffectiveFeature[]
): PlanUiLimits {
  // 各機能から limit を取得（DB構造に依存せず防御的に）
  const getLimit = (key: string): number | null => {
    const feature = features.find(f => f.feature_key === key);
    if (!feature) return null;

    // effective_config に limit がある場合
    const configLimit = feature.effective_config?.limit ?? feature.config?.limit;
    if (typeof configLimit === 'number') return configLimit;

    // limits 配列/オブジェクトから取得
    if (feature.limits) {
      if (Array.isArray(feature.limits)) {
        const found = feature.limits.find(l => l.limit_key === 'max_count' || l.limit_key === 'limit');
        if (found) return found.limit_value;
      } else if (typeof feature.limits === 'object') {
        const val = (feature.limits as Record<string, { value: number }>)['max_count']
                 || (feature.limits as Record<string, { value: number }>)['limit'];
        if (val) return val.value;
      }
    }

    return null;
  };

  return {
    services: getLimit('services'),
    qa_items: getLimit('qa_items'),
    case_studies: getLimit('case_studies'),
    faqs: getLimit('faqs'),
    posts: getLimit('posts'),
    materials: getLimit('materials'),
    embeds: getLimit('embeds'),
    verified_badge: getFeatureEnabled(features, 'verified_badge'),
    ai_reports: getFeatureEnabled(features, 'ai_reports'),
    system_monitoring: getFeatureEnabled(features, 'system_monitoring'),
  };
}

// =============================================================================
// Re-exports from org-features (for migration)
// NOTE: [FEATUREGATE_MIGRATION] org-features からの直接 import を廃止するための re-export
// これらは org-features 廃止後に削除予定
// NOTE: [CLIENT_IMPORT_CHAIN_FIX] quota.ts が supabase/server.ts を静的インポートするため、
// 関数は動的インポートでラップする必要がある
// =============================================================================

// Type re-exports（型はランタイムに影響しないため静的エクスポートで問題ない）
import type { NormalizedOrgQuotaUsage as _NormalizedOrgQuotaUsage, SupabaseFeatureKey as _SupabaseFeatureKey } from '@/types/features';
export type { NormalizedOrgQuotaUsage, SupabaseFeatureKey } from '@/types/features';

// FetchOrgQuotaUsageResult の型定義（動的インポートのため再定義）
export interface FetchOrgQuotaUsageResult {
  data?: _NormalizedOrgQuotaUsage;
  error?: {
    type: 'permission' | 'not_found' | 'network' | 'unknown';
    message: string;
    code?: string;
  };
}

/**
 * 組織の機能使用量を取得（サーバーサイド専用）
 * @param organizationId 組織UUID
 * @param featureKey 機能キー
 */
export async function fetchOrgQuotaUsage(
  organizationId: string,
  featureKey: string
): Promise<FetchOrgQuotaUsageResult> {
  if (typeof window !== 'undefined') {
    throw new Error('fetchOrgQuotaUsage can only be called on the server side');
  }
  try {
    const mod = await import('@/lib/org-features/quota');
    return mod.fetchOrgQuotaUsage(organizationId, featureKey as any);
  } catch (err) {
    // NOTE: 動的インポート失敗時はエラー情報を返す
    // eslint-disable-next-line no-console
    console.error('[featureGate] fetchOrgQuotaUsage dynamic import failed:', err);
    return {
      error: {
        type: 'unknown',
        message: '機能使用量の取得に失敗しました',
      }
    };
  }
}

/**
 * 機能の上限到達判定（サーバーサイド専用）
 * @param organizationId 組織UUID
 * @param featureKey 機能キー
 */
export async function isFeatureQuotaLimitReached(
  organizationId: string,
  featureKey: string
): Promise<boolean> {
  if (typeof window !== 'undefined') {
    throw new Error('isFeatureQuotaLimitReached can only be called on the server side');
  }
  try {
    const mod = await import('@/lib/org-features/quota');
    return mod.isFeatureQuotaLimitReached(organizationId, featureKey as any);
  } catch (err) {
    // NOTE: 動的インポート失敗時はエラーログを出して安全側（true=上限到達扱い）で返す
    // eslint-disable-next-line no-console
    console.error('[featureGate] isFeatureQuotaLimitReached dynamic import failed:', err);
    return true;
  }
}

// =============================================================================
// Feature check functions (dynamic import wrappers)
// NOTE: [CLIENT_IMPORT_CHAIN_FIX] effective-features.ts が supabase-admin-client.ts
// (server-only) を参照するため、静的 re-export はクライアントコンポーネントから
// インポートされた場合にビルドエラーを引き起こす。
// これらの関数はサーバーサイドでのみ実行可能なため、動的インポートでラップする。
// =============================================================================

/**
 * 特定機能の利用可否チェック（サーバーサイド専用）
 * @param orgId 組織ID
 * @param featureKey 機能キー
 * @returns 機能が利用可能かどうか
 */
export async function canUseFeature(orgId: string, featureKey: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    throw new Error('canUseFeature can only be called on the server side');
  }
  try {
    const mod = await import('@/lib/org-features/effective-features');
    return mod.canUseFeature(orgId, featureKey);
  } catch (err) {
    // NOTE: 動的インポート失敗時はエラーログを出して安全側（false）で返す
    // eslint-disable-next-line no-console
    console.error('[featureGate] canUseFeature dynamic import failed:', err);
    return false;
  }
}

/**
 * 特定機能の制限値取得（サーバーサイド専用）
 * @param orgId 組織ID
 * @param featureKey 機能キー
 * @returns 制限値 または null
 */
export async function getOrgFeatureLimit(orgId: string, featureKey: string): Promise<number | null> {
  if (typeof window !== 'undefined') {
    throw new Error('getOrgFeatureLimit can only be called on the server side');
  }
  try {
    const mod = await import('@/lib/org-features/effective-features');
    return mod.getFeatureLimit(orgId, featureKey);
  } catch (err) {
    // NOTE: 動的インポート失敗時はエラーログを出して安全側（null=制限なし情報なし）で返す
    // eslint-disable-next-line no-console
    console.error('[featureGate] getOrgFeatureLimit dynamic import failed:', err);
    return null;
  }
}

/**
 * 特定機能のレベル取得（サーバーサイド専用）
 * @param orgId 組織ID
 * @param featureKey 機能キー
 * @returns 機能レベル または null
 */
export async function getFeatureLevel(orgId: string, featureKey: string): Promise<string | null> {
  if (typeof window !== 'undefined') {
    throw new Error('getFeatureLevel can only be called on the server side');
  }
  try {
    const mod = await import('@/lib/org-features/effective-features');
    return mod.getFeatureLevel(orgId, featureKey);
  } catch (err) {
    // NOTE: 動的インポート失敗時はエラーログを出して安全側（null）で返す
    // eslint-disable-next-line no-console
    console.error('[featureGate] getFeatureLevel dynamic import failed:', err);
    return null;
  }
}

// Type re-exports (サーバーサイドモジュールへの依存を避けるため @/types/features から取得)
// NOTE: [CLIENT_IMPORT_CHAIN_FIX] effective-features.ts からの型インポートは
// バンドラーがモジュール解析時に server-only を検出するため避ける
export type { FeatureConfig, FeatureKey as OrgFeatureKey } from '@/types/features';

// EffectiveOrgFeatures はローカルで定義（effective-features.ts に依存しないため）
import type { FeatureConfig as _FeatureConfig, FeatureKey as _FeatureKey } from '@/types/features';
export interface EffectiveOrgFeatures {
  features: Partial<Record<_FeatureKey, _FeatureConfig>>;
  _meta?: {
    source: 'rpc' | 'entitlements_fallback' | 'plan_limits_fallback';
    retrieved_at: string;
    organization_id: string;
    warnings?: string[];
  };
}
