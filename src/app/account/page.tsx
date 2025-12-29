/**
 * Account Index Page
 *
 * Account領域のトップページ
 * 主体: user（個人）
 * 責務: 個人設定、プロフィール、通知設定等
 *
 * @note Dashboard（org主体）とは明確に分離
 */

import { UserShell } from '@/components/account';
import Link from 'next/link';

export const metadata = {
  title: 'アカウント設定',
  description: '個人アカウントの設定を管理',
};

export default async function AccountPage() {
  return (
    <UserShell title="アカウント設定">
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="border-b border-[var(--aio-border)] pb-4">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            アカウント設定
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            個人アカウントの設定を管理します
          </p>
        </div>

        {/* メニュー */}
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/account/profile"
            className="block p-6 bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg hover:border-[var(--aio-primary)] transition-colors"
          >
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              プロフィール
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              名前、メールアドレス、アバター等
            </p>
          </Link>

          <Link
            href="/account/security"
            className="block p-6 bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg hover:border-[var(--aio-primary)] transition-colors"
          >
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              セキュリティ
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              パスワード、二要素認証等
            </p>
          </Link>

          <Link
            href="/account/notifications"
            className="block p-6 bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg hover:border-[var(--aio-primary)] transition-colors"
          >
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              通知設定
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              メール通知、プッシュ通知等
            </p>
          </Link>

          <Link
            href="/dashboard"
            className="block p-6 bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg hover:border-[var(--aio-primary)] transition-colors"
          >
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              組織ダッシュボード
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              組織の管理画面へ移動
            </p>
          </Link>
        </div>
      </div>
    </UserShell>
  );
}
