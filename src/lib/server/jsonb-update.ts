import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { logger } from '@/lib/log';

/**
 * RPC エラーの分類
 * Supabase DDL で定義されたエラーメッセージを分類
 */
function classifyRPCError(errorMessage: string): 'auth' | 'permission' | 'validation' | 'unknown' {
  if (errorMessage.includes('unauthenticated')) {
    return 'auth';
  }
  if (errorMessage.includes('forbidden')) {
    return 'permission';
  }
  if (errorMessage.includes('invalid patch') || 
      errorMessage.includes('patch too large') || 
      errorMessage.includes('invalid path') ||
      errorMessage.includes('feature_flags values must be boolean')) {
    return 'validation';
  }
  return 'unknown';
}

/**
 * P1-3: JSONB更新の運用ガイドライン（安全版 - RPC のみ使用）
 * 
 * feature_flags:
 * - フラットな boolean/string/number map を想定
 * - 例: { "ai_enabled": true, "premium_ui": false, "debug_mode": "development" }
 * 
 * entitlements:
 * - ある程度構造化された JSON を想定
 * - 例: { "plan": "premium", "limits": { "api_calls": 10000, "storage_gb": 100 } }
 * 
 * サイズ制限:
 * - 1レコードあたりの JSONB はおおよそ 64KB 目安
 * - 過度なネストや大量のキーは避ける
 * 
 * セキュリティ:
 * - SQLインジェクション防止のため、直接SQL組み立ては禁止
 * - Supabase RPC 関数のみを使用
 */

/**
 * サーバーサイド用Supabaseクライアント作成
 */
async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Server Component での cookie 設定エラーをハンドル
          }
        },
      },
    }
  );
}

/**
 * organizationsテーブルのfeature_flagsを部分更新
 * P1-3: Supabase RPC patch_org_feature_flags を使用（最終版）
 * 
 * @param orgId - 組織ID（UUID文字列）
 * @param updates - マージする feature_flags のパッチデータ（boolean値のみ）
 * @returns 更新結果
 */
export async function updateOrgFeatureFlags(
  orgId: string, 
  updates: Record<string, boolean>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();
    
    // Supabase RPC patch_org_feature_flags 呼び出し
    const { error } = await supabase.rpc('patch_org_feature_flags', {
      org_id: orgId,
      patch: updates
    });

    if (error) {
      // RPC エラーの分類
      const errorType = classifyRPCError(error.message);
      logger.error('Error updating org feature flags via RPC', { 
        orgId, 
        updates, 
        error: error.message,
        errorType 
      });
      return { success: false, error: error.message };
    }

    logger.info('Successfully updated org feature flags via RPC', { orgId, updatedKeys: Object.keys(updates) });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Exception in updateOrgFeatureFlags', { orgId, updates, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * organizationsテーブルのentitlementsを部分更新
 * P1-3: Supabase RPC patch_org_entitlements を使用（最終版）
 * 
 * @param orgId - 組織ID（UUID文字列）
 * @param updates - マージする entitlements のパッチデータ（JSON object）
 * @returns 更新結果
 */
export async function updateOrgEntitlements(
  orgId: string, 
  updates: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();
    
    // Supabase RPC patch_org_entitlements 呼び出し
    const { error } = await supabase.rpc('patch_org_entitlements', {
      org_id: orgId,
      patch: updates
    });

    if (error) {
      // RPC エラーの分類
      const errorType = classifyRPCError(error.message);
      logger.error('Error updating org entitlements via RPC', { 
        orgId, 
        updates, 
        error: error.message,
        errorType 
      });
      return { success: false, error: error.message };
    }

    logger.info('Successfully updated org entitlements via RPC', { orgId, updatedKeys: Object.keys(updates) });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Exception in updateOrgEntitlements', { orgId, updates, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * organizationsテーブルの feature_flags から指定キーを削除
 * P1-3: Supabase RPC remove_org_feature_flag_keys を使用（最終版）
 * 
 * @param orgId - 組織ID（UUID文字列）
 * @param keysToRemove - 削除するキーの配列
 * @returns 更新結果
 */
export async function removeOrgFeatureFlagKeys(
  orgId: string,
  keysToRemove: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();
    
    // Supabase RPC remove_org_feature_flag_keys 呼び出し
    const { error } = await supabase.rpc('remove_org_feature_flag_keys', {
      org_id: orgId,
      keys: keysToRemove
    });

    if (error) {
      // RPC エラーの分類
      const errorType = classifyRPCError(error.message);
      logger.error('Error removing org feature flag keys via RPC', { 
        orgId, 
        keysToRemove, 
        error: error.message,
        errorType 
      });
      return { success: false, error: error.message };
    }

    logger.info('Successfully removed org feature flag keys via RPC', { orgId, removedKeys: keysToRemove });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Exception in removeOrgFeatureFlagKeys', { orgId, keysToRemove, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * 単一 feature_flag キーの設定（新規作成または上書き）
 * P1-3: updateOrgFeatureFlags を使用して単一キーを更新（最終版）
 * 
 * @param orgId - 組織ID（UUID文字列）
 * @param key - feature_flags のキー
 * @param value - 設定する値（boolean のみ許可）
 * @returns 更新結果
 */
export async function setOrgFeatureFlag(
  orgId: string,
  key: string,
  value: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // 単一キーをpatchとして渡す
    const updatePatch = { [key]: value };
    return updateOrgFeatureFlags(orgId, updatePatch);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Exception in setOrgFeatureFlag', { orgId, key, value, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * ネストされた entitlements パスの更新
 * P1-3: Supabase RPC set_org_entitlement_path を使用（最終版）
 * 
 * @param orgId - 組織ID（UUID文字列）
 * @param path - ネストパスの配列 (例: ['limits', 'monthly_tokens'])
 * @param value - 設定する値（任意のJSON値）
 * @returns 更新結果
 */
export async function setOrgNestedEntitlement(
  orgId: string,
  path: string[],
  value: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();
    
    // Supabase RPC set_org_entitlement_path 呼び出し
    const { error } = await supabase.rpc('set_org_entitlement_path', {
      org_id: orgId,
      path: path,
      value: value
    });

    if (error) {
      // RPC エラーの分類
      const errorType = classifyRPCError(error.message);
      logger.error('Error setting nested entitlement via RPC', { 
        orgId, 
        path, 
        value, 
        error: error.message,
        errorType 
      });
      return { success: false, error: error.message };
    }

    logger.info('Successfully set nested entitlement via RPC', { orgId, path, value });
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Exception in setOrgNestedEntitlement', { orgId, path, value, error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * P1-3: 使用する Supabase RPC 関数（admin スキーマ + public ラッパー）
 * 
 * ✅ これらのRPC関数がSupabase側で実装済み（DDL確定）
 * 
 * 1. patch_org_feature_flags(org_id uuid, patch jsonb) RETURNS void
 *    - feature_flagsのルートレベルマージ（boolean値のみ）
 * 
 * 2. patch_org_entitlements(org_id uuid, patch jsonb) RETURNS void  
 *    - entitlementsのルートレベルマージ（任意のJSON）
 * 
 * 3. set_org_entitlement_path(org_id uuid, path text[], value jsonb) RETURNS void
 *    - entitlementsの特定パス（ネスト）に値を設定
 * 
 * 4. remove_org_feature_flag_keys(org_id uuid, keys text[]) RETURNS void
 *    - feature_flagsから指定キーを削除
 * 
 * 権限チェック: 各RPC内でauth.uid()とorganization_membersを確認（owner/admin必須）
 * エラー分類: unauthenticated/forbidden/validation/unknown に分類済み
 */

//
// P1-3 最終エクスポート: 本番で使用するJSONB更新関数
//
// 【feature_flags 操作】
// - updateOrgFeatureFlags(): 複数フラグの一括更新（boolean値）
// - setOrgFeatureFlag(): 単一フラグ設定（boolean値）
// - removeOrgFeatureFlagKeys(): 指定キーの削除
//
// 【entitlements 操作】  
// - updateOrgEntitlements(): ルートレベル複数値更新（任意JSON）
// - setOrgNestedEntitlement(): ネストパス指定での値設定
//
// 【想定ユースケース】
// 1. 組織設定変更: requireOrgRole(['admin']) → updateOrgFeatureFlags()
// 2. プラン変更: requireOrgRole(['owner']) → updateOrgEntitlements()
// 3. 制限値設定: setOrgNestedEntitlement(orgId, ['limits', 'api_calls'], 10000)
// 4. フラグ削除: removeOrgFeatureFlagKeys() で廃止フラグクリーンアップ
// 5. すべてRPC専用: SQLインジェクション対策済み、auth.uid()による自動認証
//