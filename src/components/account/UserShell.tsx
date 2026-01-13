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
 * @note レイアウト（サイドバー等）は layout.tsx + AccountLayoutContent が担当
 */

import { ReactNode } from 'react';
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
  // NOTE: Middleware が /account の認証を担当するため、ここでのリダイレクトは削除
  // Middleware を通過した場合はユーザーが認証済みのはず
  // Cookie同期の遅延で一時的にnullになる場合があるため、フォールバック処理を行う
  const user = await getUserWithClient(supabase);

  if (!user) {
    // Middleware を通過したがユーザー取得に失敗した場合
    // リダイレクトではなくエラー表示（Cookie同期問題を防止）
    return (
      <div className="text-center p-8">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
          認証情報の取得に失敗しました
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          ページを再読み込みしてください。
        </p>
      </div>
    );
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
          <div className="text-center p-8">
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              この機能は利用できません
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              プランをアップグレードするか、管理者にお問い合わせください。
            </p>
          </div>
        );
      }
    } catch {
      // RPCがない場合はスキップ（将来対応）
    }
  }

  // NOTE: レイアウト（サイドバー、背景色等）は layout.tsx の AccountLayoutContent が担当
  // UserShellはコンテンツのみをラップ
  return (
    <UIProvider>
      <section aria-label={title || 'アカウント'}>
        {children}
      </section>
    </UIProvider>
  );
}

export default UserShell;
