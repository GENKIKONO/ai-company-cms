/**
 * Account Security Page
 *
 * セキュリティ設定ページ（Read-only MVP）
 * 主体: user（個人）
 */

import { UserShell } from '@/components/account';
import { createClient } from '@/lib/supabase/server';
import { getUserFullWithClient } from '@/lib/core/auth-state';
import Link from 'next/link';

export const metadata = {
  title: 'セキュリティ | アカウント設定',
  description: 'パスワード、二要素認証等のセキュリティ設定',
};

export default async function SecurityPage() {
  const supabase = await createClient();

  // ユーザー情報取得
  const user = await getUserFullWithClient(supabase);

  // 認証プロバイダー情報
  const authProvider = (user?.app_metadata?.provider as string) || 'email';
  const lastSignIn = user?.last_sign_in_at;

  // 二要素認証状態（Supabaseのファクター確認）
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const mfaEnabled = (factors?.totp?.length ?? 0) > 0;

  return (
    <UserShell title="セキュリティ">
      <div className="space-y-6">
        {/* パンくずナビ */}
        <nav className="text-sm text-[var(--color-text-secondary)]">
          <Link href="/account" className="hover:text-[var(--aio-primary)]">
            アカウント設定
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--color-text-primary)]">セキュリティ</span>
        </nav>

        {/* ヘッダー */}
        <div className="border-b border-[var(--aio-border)] pb-4">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            セキュリティ
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            アカウントのセキュリティ設定
          </p>
        </div>

        {/* セキュリティ情報 */}
        <div className="space-y-4">
          {/* ログイン方法 */}
          <div className="bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              ログイン方法
            </h2>
            <div className="divide-y divide-[var(--aio-border)]">
              <div className="py-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    認証プロバイダー
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {authProvider === 'email' ? 'メール・パスワード' : authProvider}
                  </p>
                </div>
              </div>

              <div className="py-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    最終ログイン
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {lastSignIn
                      ? new Date(lastSignIn).toLocaleString('ja-JP')
                      : '不明'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 二要素認証 */}
          <div className="bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              二要素認証（2FA）
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  認証アプリを使用した二要素認証でアカウントを保護します
                </p>
              </div>
              <div className="flex items-center gap-2">
                {mfaEnabled ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    有効
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    無効
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* パスワード */}
          <div className="bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              パスワード
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  パスワードの変更はログイン画面の「パスワードを忘れた」から行えます
                </p>
              </div>
            </div>
          </div>

          {/* セッション情報 */}
          <div className="bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              セッション情報
            </h2>
            <div className="divide-y divide-[var(--aio-border)]">
              <div className="py-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    現在のセッション
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    アクティブ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 注記 */}
        <p className="text-xs text-[var(--color-text-secondary)]">
          パスワード変更・2FA設定機能は今後追加予定です
        </p>
      </div>
    </UserShell>
  );
}
