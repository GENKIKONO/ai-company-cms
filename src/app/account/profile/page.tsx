/**
 * Account Profile Page
 *
 * プロフィール表示・編集ページ（Read-only MVP）
 * 主体: user（個人）
 */

import { UserShell } from '@/components/account';
import { createClient } from '@/lib/supabase/server';
import { getUserFullWithClient } from '@/lib/core/auth-state';
import Link from 'next/link';

export const metadata = {
  title: 'プロフィール | アカウント設定',
  description: 'プロフィール情報の確認・編集',
};

export default async function ProfilePage() {
  const supabase = await createClient();

  // ユーザー情報取得
  const user = await getUserFullWithClient(supabase);

  const fullName = (user?.user_metadata?.full_name as string) || '未設定';
  const email = user?.email || '未設定';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <UserShell title="プロフィール">
      <div className="space-y-6">
        {/* パンくずナビ */}
        <nav className="text-sm text-[var(--color-text-secondary)]">
          <Link href="/account" className="hover:text-[var(--aio-primary)]">
            アカウント設定
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--color-text-primary)]">プロフィール</span>
        </nav>

        {/* ヘッダー */}
        <div className="border-b border-[var(--aio-border)] pb-4">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            プロフィール
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            アカウントのプロフィール情報
          </p>
        </div>

        {/* プロフィール情報 */}
        <div className="bg-[var(--aio-surface)] border border-[var(--aio-border)] rounded-lg p-6 space-y-6">
          {/* アバター */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[var(--aio-primary)] flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                {fullName}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {email}
              </p>
            </div>
          </div>

          {/* 情報一覧 */}
          <div className="divide-y divide-[var(--aio-border)]">
            <div className="py-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  表示名
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {fullName}
                </p>
              </div>
            </div>

            <div className="py-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  メールアドレス
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {email}
                </p>
              </div>
            </div>

            <div className="py-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  ユーザーID
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] font-mono">
                  {user?.id || '不明'}
                </p>
              </div>
            </div>

            <div className="py-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  アカウント作成日
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('ja-JP')
                    : '不明'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 注記 */}
        <p className="text-xs text-[var(--color-text-secondary)]">
          プロフィール情報の編集機能は今後追加予定です
        </p>
      </div>
    </UserShell>
  );
}
