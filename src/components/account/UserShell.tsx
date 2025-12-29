/**
 * UserShell - Account領域の共通シェル
 *
 * 責務:
 * - 認証チェック（サーバ側）
 * - 個人コンテキスト提供（user主体）
 * - 統一エラー/ローディング
 * - 監査ログの入口
 *
 * @note Account領域はuser主体。Dashboardはorg主体。
 */

import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserWithClient } from '@/lib/core/auth-state';
import { UIProvider } from '@/lib/core';

interface UserShellProps {
  children: ReactNode;
  /** ページタイトル（アクセシビリティ用） */
  title?: string;
  /** 必要な機能キー（指定時はその機能が有効かチェック） */
  requiredFeature?: string;
}

export async function UserShell({
  children,
  title,
  requiredFeature,
}: UserShellProps) {
  const supabase = await createClient();

  // 認証チェック
  const user = await getUserWithClient(supabase);

  if (!user) {
    redirect('/login?redirect=/account');
  }

  // Feature Gate（オプション、user主体）
  if (requiredFeature) {
    try {
      const { data: featureEnabled } = await supabase.rpc('get_effective_feature_set', {
        subject_type: 'user',
        subject_id: user.id,
      });

      // 機能が有効かチェック
      const features = Array.isArray(featureEnabled) ? featureEnabled : [];
      const feature = features.find((f: { feature_key: string }) => f.feature_key === requiredFeature);

      if (!feature || !(feature.is_enabled ?? feature.enabled)) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-[var(--aio-background)]">
            <div className="text-center p-8">
              <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                この機能は利用できません
              </h1>
              <p className="text-[var(--color-text-secondary)]">
                プランをアップグレードするか、管理者にお問い合わせください。
              </p>
            </div>
          </div>
        );
      }
    } catch {
      // RPCがない場合はスキップ（将来対応）
    }
  }

  return (
    <UIProvider>
      <section aria-label={title || 'アカウント'}>
        <div className="min-h-screen bg-[var(--aio-background)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </div>
      </section>
    </UIProvider>
  );
}

export default UserShell;
