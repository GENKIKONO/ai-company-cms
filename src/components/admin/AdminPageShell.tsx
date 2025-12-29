/**
 * AdminPageShell
 * Admin領域の全ページで使用する共通シェル
 *
 * 責務:
 * - 認証チェック（サーバ側）
 * - site_admin判定（サーバ側）
 * - feature gate（このページ/操作が有効か）
 * - 統一エラー/ローディング
 * - 監査ログの入口（AdminAuditContext）
 */

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { requireUserServer, isSiteAdmin } from '@/lib/core';
import { AdminAuditProvider } from './AdminAuditContext';
import { AdminAccessDenied } from './AdminAccessDenied';

interface AdminPageShellProps {
  children: ReactNode;
  /** 必要な機能キー（指定時はその機能が有効かチェック） */
  requiredFeature?: string;
  /** ページタイトル（監査ログ用） */
  pageTitle?: string;
}

export async function AdminPageShell({
  children,
  requiredFeature,
  pageTitle,
}: AdminPageShellProps) {
  // 認証チェック（Core経由）
  let user;
  try {
    user = await requireUserServer();
  } catch {
    redirect('/auth/login?redirect=/admin');
  }

  // site_admin判定（Core経由）
  const isAdmin = await isSiteAdmin();

  if (!isAdmin) {
    return <AdminAccessDenied reason="site_admin_required" />;
  }

  // Feature Gate（オプション）- supabase.rpc が必要なため遅延生成
  if (requiredFeature) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: featureEnabled } = await supabase.rpc('get_feature_config', {
      p_user_id: user.id,
      p_feature_key: requiredFeature,
    });

    if (!featureEnabled?.enabled) {
      return <AdminAccessDenied reason="feature_disabled" featureKey={requiredFeature} />;
    }
  }

  return (
    <AdminAuditProvider userId={user.id} pageTitle={pageTitle}>
      <div className="min-h-screen bg-[var(--aio-background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </div>
    </AdminAuditProvider>
  );
}
