/**
 * Supabaseベースの型安全な機能フラグ／プラン権限ヘルパー
 * 
 * NOTE: [足場づくり] 既存の挙動を変えずに型安全なアクセス層を提供
 * 既存の effective-features.ts と協調動作し、段階移行を可能にする
 * 
 * 🎯 新規コード推奨エントリーポイント:
 * 
 * ```typescript
 * import { canUseFeatureFromOrg } from '@/lib/org-features/features';
 * 
 * // 組織データから直接機能判定（同期処理）
 * const canUseAI = canUseFeatureFromOrg(organization, 'ai_reports');
 * if (canUseAI) {
 *   // AI機能を表示/実行
 * }
 * ```
 * 
 * NOTE: 既存の canUseFeature(orgId, key) は非同期でDB参照するため、
 * UIコンポーネントでは上記の同期版を推奨
 */

import type { FeatureKey, FeatureFlags, FeatureConfig } from '@/types/features';
// TODO: [SUPABASE_TYPE_FOLLOWUP] Supabase Database 型定義を再構築後に復元する

type OrganizationRow = any;

/**
 * 組織の feature_flags JSONB から特定キーの値を型安全に取得
 * 
 * @param org - Supabase organizations テーブルの行データ
 * @param key - 取得したい機能キー
 * @returns boolean | null (null = 未設定/不正な値)
 */
export function getFeatureFlagFromOrg(
  org: OrganizationRow | null | undefined,
  key: FeatureKey,
): boolean | null {
  if (!org?.feature_flags || typeof org.feature_flags !== 'object') {
    return null;
  }

  // NOTE: [型安全性] JSONB を Record<string, unknown> として安全に読み取り
  const raw = (org.feature_flags as Record<string, unknown>)[key];
  
  if (typeof raw === 'boolean') return raw;
  if (raw === null || raw === undefined) return null;
  
  // TODO: [FUTURE] runtime validation ライブラリ（zod等）での検証を追加
  return null;
}

/**
 * 組織のプラン情報を型安全に取得
 * 
 * @param org - Supabase organizations テーブルの行データ  
 * @returns プラン文字列 (fallback: 'starter')
 */
export function getPlanFromOrg(
  org: OrganizationRow | null | undefined,
): string {
  // NOTE: [既存挙動維持] 既存コードと同じfallback戦略
  return org?.plan || 'starter';
}

/**
 * feature_flags の複数キーを一括で型安全に取得
 * 
 * @param org - Supabase organizations テーブルの行データ
 * @param keys - 取得したい機能キーの配列
 * @returns 各キーの boolean 値のマップ (未設定は false)
 */
export function getMultipleFeatureFlagsFromOrg(
  org: OrganizationRow | null | undefined,
  keys: FeatureKey[],
): Record<FeatureKey, boolean> {
  const result = {} as Record<FeatureKey, boolean>;
  
  for (const key of keys) {
    const value = getFeatureFlagFromOrg(org, key);
    // NOTE: [既存挙動維持] null/undefined は false として扱う（既存コードと同じ）
    result[key] = value === true;
  }
  
  return result;
}

/**
 * 既存の PLAN_LIMITS パターンと互換性のあるプラン制限チェック
 * 
 * @param org - Supabase organizations テーブルの行データ
 * @param feature - チェックしたい機能名
 * @returns プラン的にその機能が利用可能かどうか
 */
export function isPlanFeatureEnabled(
  org: OrganizationRow | null | undefined,
  feature: string,
): boolean {
  const plan = getPlanFromOrg(org);
  
  // NOTE: [既存挙動維持] PLAN_LIMITS の判定ロジックを保持
  // TODO: [FEATURE_MIGRATION] これを plan_features テーブル参照に変更予定
  switch (feature) {
    case 'ai_reports':
      return ['pro', 'business', 'enterprise'].includes(plan);
    case 'system_monitoring':
      return ['business', 'enterprise'].includes(plan);
    case 'verified_badge':
      return ['business', 'pro', 'enterprise'].includes(plan);
    case 'team_management':
      return ['business', 'enterprise'].includes(plan);
    case 'ai_interview':
      // NOTE: [EXISTING_LOGIC] AI面接は全プランで利用可能と仮定
      return true;
    case 'materials':
      // NOTE: [EXISTING_LOGIC] 営業資料は全プランで利用可能（制限は数量のみ）
      return true;
    case 'faq_module':
      // NOTE: [EXISTING_LOGIC] FAQは全プランで利用可能（制限は数量のみ）
      return true;
    case 'embeds':
      // NOTE: [EXISTING_LOGIC] 埋め込みは全プランで利用可能（制限は数量のみ）
      return true;
    default:
      return true; // 不明な機能は許可（安全側）
  }
}

/**
 * 機能フラグとプラン制限の両方を考慮した総合判定
 * NOTE: [足場づくり] 新規コードで使用する推奨エントリーポイント
 * 
 * @param org - Supabase organizations テーブルの行データ
 * @param key - 機能キー
 * @returns 機能が利用可能かどうか
 */
export function canUseFeatureFromOrg(
  org: OrganizationRow | null | undefined,
  key: FeatureKey,
): boolean {
  // NOTE: [既存挙動維持] まずは feature_flags を優先、フォールバックでプラン判定
  const featureFlag = getFeatureFlagFromOrg(org, key);
  
  // feature_flags で明示的に true/false が設定されている場合はそれに従う
  if (featureFlag !== null) {
    return featureFlag;
  }
  
  // feature_flags が未設定の場合はプラン制限で判定
  return isPlanFeatureEnabled(org, key);
}